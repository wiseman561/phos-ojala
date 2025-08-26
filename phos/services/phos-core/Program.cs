using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();

builder.Services.AddHostedService<NatsWorker>();

// Serilog
// Audit logger
builder.Services.AddSingleton<Phos.PhosCore.Services.IAuditLogger, Phos.PhosCore.Services.FileAuditLogger>();
builder.Host.UseSerilog((ctx, lc) => lc
  .ReadFrom.Configuration(ctx.Configuration)
  .Enrich.FromLogContext()
  .WriteTo.Console());

// Authentication & Authorization
var config = builder.Configuration;
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = config["JWT:ISSUER"] ?? "phos",
            ValidateAudience = true,
            ValidAudience = config["JWT:AUDIENCE"] ?? "phos",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["JWT:SECRET"] ?? "CHANGEME")),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Provider", p => p.RequireRole("Provider", "Admin"));
    options.AddPolicy("Patient", p => p.RequireRole("Patient", "Admin"));
});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.UseSerilogRequestLogging();

app.MapGet("/api/recommendations", (string userId, Phos.PhosCore.Services.IAuditLogger audit) => {
  var result = new object[] {
    new { id = "rec-1", userId, category = "nutrition", title = "Increase fiber intake" },
    new { id = "rec-2", userId, category = "sleep", title = "Aim for 7-8 hours nightly" }
  };
  _ = audit.LogAsync(userId, "GET", "/api/recommendations", "success");
  return Results.Ok(result);
}).RequireAuthorization("Patient");

app.MapHealthChecks("/healthz");
app.UseHttpsRedirection();

await app.RunAsync();
