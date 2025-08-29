using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using System.Net.Http;
using System.Net.Http.Json;

var builder = WebApplication.CreateBuilder(args);
TryLoadVaultSecrets(builder.Configuration);

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
        var authority = config["IDP:ISSUER"] ?? (config["IDP:DOMAIN"] != null ? $"https://{config["IDP:DOMAIN"]}/" : null);
        options.Authority = authority;
        options.Audience = config["IDP:AUDIENCE"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Provider", p => p.RequireRole("Provider", "Admin"));
    options.AddPolicy("Patient", p => p.RequireRole("Patient", "Admin"));
});

// OpenTelemetry
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService(serviceName: "phos-core"))
    .WithTracing(tracer => tracer
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(o =>
        {
            o.Endpoint = new Uri(config["OTLP:ENDPOINT"] ?? "http://tempo:4317");
        }));

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.UseSerilogRequestLogging();

app.MapGet("/api/recommendations", (HttpContext http, string userId, Phos.PhosCore.Services.IAuditLogger audit) => {
  if (http.TraceIdentifier is string tid) http.Response.Headers.Append("x-trace-id", tid);
  var result = new object[] {
    new { id = "rec-1", userId, category = "nutrition", title = "Increase fiber intake" },
    new { id = "rec-2", userId, category = "sleep", title = "Aim for 7-8 hours nightly" }
  };
  _ = audit.LogAsync(userId, "GET", "/api/recommendations", "success");
  // Emit audit event via NATS is handled in NatsWorker or here if needed
  return Results.Ok(result);
}).RequireAuthorization("Patient");

app.MapHealthChecks("/healthz");
app.UseHttpsRedirection();

await app.RunAsync();

static void TryLoadVaultSecrets(ConfigurationManager config)
{
    try
    {
        var addr = config["VAULT:ADDR"];
        var roleId = config["VAULT:ROLE_ID"];
        var secretId = config["VAULT:SECRET_ID"];
        var kvPath = config["VAULT:KV_PATH"] ?? "secret/data/phos";
        if (string.IsNullOrWhiteSpace(addr) || string.IsNullOrWhiteSpace(roleId) || string.IsNullOrWhiteSpace(secretId)) return;
        using var http = new HttpClient { BaseAddress = new Uri(addr) };
        var loginRes = http.PostAsJsonAsync("/v1/auth/approle/login", new { role_id = roleId, secret_id = secretId }).Result;
        loginRes.EnsureSuccessStatusCode();
        var loginJson = loginRes.Content.ReadFromJsonAsync<dynamic>().Result;
        string token = loginJson?.auth?.client_token ?? string.Empty;
        if (string.IsNullOrWhiteSpace(token)) return;
        http.DefaultRequestHeaders.Add("X-Vault-Token", token);
        var kvRes = http.GetAsync($"/v1/{kvPath}").Result;
        kvRes.EnsureSuccessStatusCode();
        var kvJson = kvRes.Content.ReadFromJsonAsync<dynamic>().Result;
        var data = kvJson?.data?.data;
        if (data is null) return;
        var dict = new Dictionary<string, string?>();
        foreach (var prop in (IDictionary<string, object>)data)
        {
            dict[prop.Key.Replace("__", ":")] = prop.Value?.ToString();
        }
        if (dict.Count > 0)
        {
            config.AddInMemoryCollection(dict!);
        }
    }
    catch { }
}
