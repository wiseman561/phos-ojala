using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.IO;
using Ojala.Api.Extensions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ojala.Data;

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

// Add database context
builder.Services.AddDbContext<OjalaDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Add existing services
builder.Services.AddScoped<Ojala.Services.Interfaces.IPatientService, Ojala.Services.Implementations.PatientService>();
builder.Services.AddScoped<Ojala.Services.Interfaces.IAppointmentService, Ojala.Services.Implementations.AppointmentService>();
builder.Services.AddScoped<Ojala.Services.Interfaces.IMedicalRecordService, Ojala.Services.Implementations.MedicalRecordService>();
builder.Services.AddScoped<Ojala.Services.Interfaces.IHealthcarePlanService, Ojala.Services.Implementations.HealthcarePlanService>();

// Register new microservices
builder.Services.RegisterAIEngineServices(builder.Configuration);
builder.Services.RegisterNurseAssistantServices(builder.Configuration);

// Add AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

var app = builder.Build();

// Apply database migrations in development environment
if (app.Environment.IsDevelopment())
{
    app.MigrateDatabase();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

// Add health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "api" }));

app.Run();
