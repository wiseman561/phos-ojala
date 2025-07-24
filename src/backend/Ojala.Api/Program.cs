using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Net;
using System.Net.Sockets;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Ojala.Api.Extensions;
using Ojala.Data;
using Ojala.Contracts.Interfaces;
using Ojala.Api.Services;
using Ojala.Identity.Services;
using Ojala.Identity.Services.Interfaces;
using Ojala.Data.Repositories;
using Ojala.Data.Repositories.Interfaces;
using Ojala.Common.Email;
using Ojala.Services.Interfaces;
using Ojala.Services.Implementations;
using Ojala.Api.Hubs;
using StackExchange.Redis;
using Ojala.Common.Events;
using Ojala.Contracts.Events;
using Ojala.Api.Listeners;

// Make the Program class accessible for tests
[assembly: InternalsVisibleTo("Ojala.Tests.Integration")]

var builder = WebApplication.CreateBuilder(args);

// --- DYNAMIC PORT CONFIGURATION ---
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    var urlsEnv = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://localhost:5000";
    var requested = urlsEnv.Split(';', StringSplitOptions.RemoveEmptyEntries);
    var actualUrls = new List<string>();

    foreach (var url in requested)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            continue;

        int startPort  = uri.Port;
        string scheme  = uri.Scheme;
        string host    = uri.Host;

        int chosenPort = KestrelPortHelper.FindAvailablePort(startPort);
        if (chosenPort != startPort)
            Console.WriteLine($"Port {startPort} is in use, using port {chosenPort} instead");

        // bind only IPv4 loopback for reliability
        if (scheme.Equals("https", StringComparison.OrdinalIgnoreCase))
        {
            serverOptions.Listen(IPAddress.Loopback, chosenPort, listenOpts => listenOpts.UseHttps());
        }
        else
        {
            serverOptions.Listen(IPAddress.Loopback, chosenPort);
        }

        actualUrls.Add($"{scheme}://{host}:{chosenPort}");
    }

    // update env var once so any downstream tools see the real endpoints
    Environment.SetEnvironmentVariable("ASPNETCORE_URLS", string.Join(';', actualUrls));
});

// --- VAULT INTEGRATION ---
var vaultEnabled = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("VAULT_ADDR"));
if (vaultEnabled)
{
    var vaultSecretsPath = "/vault/secrets/appsettings.json";
    if (File.Exists(vaultSecretsPath))
    {
        builder.Configuration.AddJsonFile(vaultSecretsPath, optional: false, reloadOnChange: true);
        Console.WriteLine("Loaded configuration from Vault secrets");
    }
    else
    {
        Console.WriteLine("Vault secrets file not found, using default configuration");
        if (Environment.GetEnvironmentVariable("VAULT_TOKEN") != null)
            Console.WriteLine("Using Vault token-based authentication for development");
    }

    builder.Services.AddVaultAuthentication();
}

// --- SERVICE REGISTRATION ---
builder.Services.AddDbContext<Ojala.Data.ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddDbContext<Ojala.Data.OjalaDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<Ojala.Data.Entities.ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<Ojala.Data.ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(); // ensure TokenValidationParameters are configured elsewhere

builder.Services.AddAuthorizationPolicies();

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationService, NotificationService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin()
     .AllowAnyHeader()
     .AllowAnyMethod()));

builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IMedicalRecordService, MedicalRecordService>();
builder.Services.AddScoped<IHealthcarePlanService, HealthcarePlanService>();

builder.Services.AddScoped<Ojala.Common.Email.IEmailService, Ojala.Common.Email.EmailService>();
builder.Services.AddScoped<Ojala.Identity.Services.Interfaces.IEmailService, Ojala.Identity.Services.EmailService>();

builder.Services.RegisterAIEngineServices(builder.Configuration);
builder.Services.RegisterNurseAssistantServices(builder.Configuration);

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddScoped<ITokenService, TokenService>();

// Add Redis and Event Bus
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(connectionString);
});

builder.Services.AddSingleton<IEventBus, RedisEventBus>();

// Add Event Handlers
builder.Services.AddHostedService<UserRegisteredHandler>();

var app = builder.Build();

// --- HTTP PIPELINE ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

#if !DEBUG_DOCKER
app.UseHttpsRedirection();
#endif
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHealthChecks("/health");
app.MapHealthChecks("/healthz");

app.Run();

// Partial for integration tests
namespace Ojala.Api
{
    public partial class Program { }
}

// --- HELPER CLASS ---
static class KestrelPortHelper
{
    public static int FindAvailablePort(int startPort)
    {
        for (int port = startPort; port <= startPort + 100; port++)
            if (IsPortAvailable(port))
                return port;

        throw new InvalidOperationException($"No available ports found starting from {startPort}");
    }

    private static bool IsPortAvailable(int port)
    {
        try
        {
            using var listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();
            listener.Stop();
            return true;
        }
        catch (SocketException)
        {
            return false;
        }
    }
}
