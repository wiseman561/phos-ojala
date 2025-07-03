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
var startup = new Ojala.Identity.Startup(builder.Configuration);
startup.ConfigureServices(builder.Services);
builder.Services.AddTwoFactorAuthentication();

// ----------------------------------------------------
// Application services
builder.Services.AddScoped<Ojala.Identity.Services.Interfaces.IAuthService,
                            Ojala.Identity.Services.AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ILoginOtpRepository, LoginOtpRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IEmailService, EmailService>();
// ----------------------------------------------------

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

var app = builder.Build();

// Run migrations
if (builder.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<OjalaDbContext>();
            if (context.Database.GetPendingMigrations().Any())
            {
                Console.WriteLine("Applying pending migrations...");
                context.Database.Migrate();
                Console.WriteLine("Database migrations applied successfully");
            }
            else
            {
                Console.WriteLine("No pending migrations to apply");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred while applying migrations: {ex.Message}");
            // Don't throw - let the app start even if migrations fail
        }
    }
}

// Configure the HTTP request pipeline
startup.Configure(app, app.Environment);

// Add health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "identity" }));

app.Run();
