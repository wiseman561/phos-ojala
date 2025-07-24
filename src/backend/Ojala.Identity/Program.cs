using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.IO;
using Ojala.Identity.Extensions;
using Microsoft.EntityFrameworkCore;
using Ojala.Data;
using Ojala.Data.Entities;
using Ojala.Identity.Services.Interfaces;
using Ojala.Identity.Services;
using Ojala.Data.Repositories.Interfaces;
using Ojala.Data.Repositories;
using Microsoft.AspNetCore.Identity;
using StackExchange.Redis;
using Ojala.Common.Events;
using Ojala.Contracts.Events;
using Ojala.Identity.Events;

var builder = WebApplication.CreateBuilder(args);

// Configure Vault integration
var vaultEnabled = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("VAULT_ADDR"));
if (vaultEnabled)
{
    // Check if we're running in Kubernetes
    var kubernetesServiceHost = Environment.GetEnvironmentVariable("KUBERNETES_SERVICE_HOST");
    var isKubernetes = !string.IsNullOrEmpty(kubernetesServiceHost);

    // Use Vault-provided configuration if available
    var vaultSecretsPath = "/vault/secrets/appsettings.secrets.json";
    if (File.Exists(vaultSecretsPath))
    {
        builder.Configuration.AddJsonFile(vaultSecretsPath, optional: false, reloadOnChange: true);
        Console.WriteLine("Loaded configuration from Vault secrets");
    }
    else
    {
        Console.WriteLine("Vault secrets file not found, using default configuration");

        // In Kubernetes, we would wait for the file to be available
        // For development with docker-compose, we'll use the token-based auth
        if (Environment.GetEnvironmentVariable("VAULT_TOKEN") != null)
        {
            Console.WriteLine("Using Vault token-based authentication for development");
        }
    }

    // Add Vault authentication service
    builder.Services.AddVaultAuthentication(builder.Configuration);
}

// Add services to the container
builder.Services.AddDbContext<OjalaDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);
builder.Services.AddDbContext<Ojala.Data.ApplicationDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

builder.Services.AddIdentity<Ojala.Data.Entities.ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
})
.AddEntityFrameworkStores<OjalaDbContext>()
.AddDefaultTokenProviders();

// ----------------------------------------------------
// Application services
builder.Services.AddScoped<Ojala.Identity.Services.Interfaces.IAuthService, Ojala.Identity.Services.AuthService>();
builder.Services.AddScoped<Ojala.Identity.Services.Interfaces.ITokenService, Ojala.Identity.Services.TokenService>();
builder.Services.AddScoped<Ojala.Data.Repositories.Interfaces.ILoginOtpRepository, Ojala.Data.Repositories.LoginOtpRepository>();
builder.Services.AddScoped<Ojala.Data.Repositories.Interfaces.IUserProfileRepository, Ojala.Data.Repositories.UserProfileRepository>();
builder.Services.AddScoped<Ojala.Identity.Services.Interfaces.IEmailService, Ojala.Identity.Services.EmailService>();
// ----------------------------------------------------

builder.Services.AddCors(opts =>
{
    opts.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add health checks
builder.Services.AddHealthChecks();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Add Redis and Event Bus
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(connectionString);
});

builder.Services.AddSingleton<IEventBus, RedisEventBus>();
builder.Services.AddScoped<IUserEventPublisher, UserEventPublisher>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Ojala.Identity API V1")
    );
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");
app.MapHealthChecks("/healthz");

app.Run();
