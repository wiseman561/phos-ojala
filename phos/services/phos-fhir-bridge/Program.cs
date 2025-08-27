using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Metrics;
using Serilog;
using System.Net.Http;
using System.Net.Http.Json;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, lc) => lc
  .ReadFrom.Configuration(ctx.Configuration)
  .Enrich.FromLogContext()
  .WriteTo.Console());

builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
TryLoadVaultSecrets(builder.Configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddValidatorsFromAssemblyContaining<ExportRequestValidator>();

var cfg = builder.Configuration;
builder.Services
  .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(o =>
  {
    var authority = cfg["IDP:ISSUER"] ?? (cfg["IDP:DOMAIN"] != null ? $"https://{cfg["IDP:DOMAIN"]}/" : null);
    o.Authority = authority;
    o.Audience = cfg["IDP:AUDIENCE"];
    o.TokenValidationParameters = new TokenValidationParameters
    {
      ValidateIssuer = true,
      ValidateAudience = true,
      ValidateIssuerSigningKey = true,
      ValidateLifetime = true,
      ClockSkew = TimeSpan.FromSeconds(30)
    };
  });
builder.Services.AddAuthorization();

builder.Services.AddOpenTelemetry()
  .ConfigureResource(r => r.AddService("phos-fhir-bridge"))
  .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddOtlpExporter(o => o.Endpoint = new Uri(cfg["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? cfg["OTLP:ENDPOINT"] ?? "http://otel-collector:4317")))
  .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddPrometheusExporter());

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapPrometheusScrapingEndpoint();

app.MapHealthChecks("/healthz");
app.MapGet("/api/info", () => Results.Ok(new { name = "Phos.Fhir.Bridge", version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0" }));

app.MapPost("/api/fhir/export", (ExportRequest req, IValidator<ExportRequest> validator) =>
{
  var result = validator.Validate(req);
  if (!result.IsValid) return Results.ValidationProblem(result.ToDictionary());
  var bundle = new
  {
    resourceType = "Bundle",
    type = "collection",
    entry = new object[]
    {
      new { resource = new { resourceType = "Patient", id = req.UserId } },
      new { resource = new { resourceType = "Observation", status = "final" } }
    }
  };
  return Results.Ok(bundle);
}).RequireAuthorization();

app.MapGet("/api/fhir/config", () => Results.Ok(new { version = "R4", resources = new[] { "Observation", "Patient", "Condition" } })).RequireAuthorization();

app.Run();

public sealed class ExportRequest { public string UserId { get; set; } = string.Empty; }

public sealed class ExportRequestValidator : AbstractValidator<ExportRequest>
{
  public ExportRequestValidator()
  {
    RuleFor(x => x.UserId).NotEmpty();
  }
}

static void TryLoadVaultSecrets(ConfigurationManager config)
{
  try
  {
    var addr = config["VAULT:ADDR"]; var roleId = config["VAULT:ROLE_ID"]; var secretId = config["VAULT:SECRET_ID"]; var kvPath = config["VAULT:KV_PATH"] ?? "secret/data/phos";
    if (string.IsNullOrWhiteSpace(addr) || string.IsNullOrWhiteSpace(roleId) || string.IsNullOrWhiteSpace(secretId)) return;
    using var http = new HttpClient { BaseAddress = new Uri(addr) };
    var loginRes = http.PostAsJsonAsync("/v1/auth/approle/login", new { role_id = roleId, secret_id = secretId }).Result; loginRes.EnsureSuccessStatusCode();
    var loginJson = loginRes.Content.ReadFromJsonAsync<dynamic>().Result; string token = loginJson?.auth?.client_token ?? string.Empty; if (string.IsNullOrWhiteSpace(token)) return;
    http.DefaultRequestHeaders.Add("X-Vault-Token", token);
    var kvRes = http.GetAsync($"/v1/{kvPath}").Result; kvRes.EnsureSuccessStatusCode();
    var kvJson = kvRes.Content.ReadFromJsonAsync<dynamic>().Result; var data = kvJson?.data?.data; if (data is null) return;
    var dict = new Dictionary<string, string?>(); foreach (var prop in (IDictionary<string, object>)data) dict[prop.Key.Replace("__", ":")] = prop.Value?.ToString();
    if (dict.Count > 0) config.AddInMemoryCollection(dict!);
  }
  catch { }
}


