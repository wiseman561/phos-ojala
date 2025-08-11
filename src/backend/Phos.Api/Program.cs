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
using Phos.Api.Extensions;
using Phos.Data;
using Phos.Contracts.Interfaces;
using Phos.Api.Services;
using Phos.Identity.Services;
using Phos.Identity.Services.Interfaces;
using Phos.Data.Repositories;
using Phos.Data.Repositories.Interfaces;
using Phos.Common.Email;
using Phos.Services.Interfaces;
using Phos.Services.Implementations;
using Phos.Api.Hubs;
using StackExchange.Redis;
using Phos.Common.Events;
using Phos.Contracts.Events;
using Phos.Api.Listeners;

// Make the Program class accessible for tests
[assembly: InternalsVisibleTo("Phos.Tests.Integration")]

var builder = WebApplication.CreateBuilder(args);

// Use Kestrel endpoints from configuration (see appsettings)

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

    builder.Services.AddVaultAuthentication(builder.Configuration);
}

// --- SERVICE REGISTRATION ---
builder.Services.AddDbContext<Phos.Data.ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddDbContext<Phos.Data.PhosDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<Phos.Data.Entities.ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<Phos.Data.ApplicationDbContext>()
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDev", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
              .AllowAnyHeader()
              .AllowCredentials());
});

builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IMedicalRecordService, MedicalRecordService>();
builder.Services.AddScoped<IHealthcarePlanService, HealthcarePlanService>();

builder.Services.AddScoped<Phos.Common.Email.IEmailService, Phos.Common.Email.EmailService>();
builder.Services.AddScoped<Phos.Identity.Services.Interfaces.IEmailService, Phos.Identity.Services.EmailService>();

builder.Services.RegisterAIEngineServices(builder.Configuration);
builder.Services.RegisterNurseAssistantServices(builder.Configuration);

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddScoped<ITokenService, TokenService>();

// Add Redis and Event Bus
var services = builder.Services;
var redisConnStr =
    builder.Configuration["Redis:ConnectionString"]
    ?? Environment.GetEnvironmentVariable("REDIS__CONNECTIONSTRING")
    ?? "127.0.0.1:6379,abortConnect=false,connectTimeout=2000";

services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    var opts = ConfigurationOptions.Parse(redisConnStr);
    opts.AbortOnConnectFail = false;
    return ConnectionMultiplexer.Connect(opts);
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
app.UseCors("AllowLocalDev");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHealthChecks("/health");
app.MapHealthChecks("/healthz");

app.Run();

// Partial for integration tests
namespace Phos.Api
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
