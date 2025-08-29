using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using NATS.Client;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Metrics;
using Serilog;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
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
builder.Services.AddValidatorsFromAssemblyContaining<ChargeRequestValidator>();

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
  .ConfigureResource(r => r.AddService("phos-billing-gateway"))
  .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddOtlpExporter(o => o.Endpoint = new Uri(cfg["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? cfg["OTLP:ENDPOINT"] ?? "http://otel-collector:4317")))
  .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddPrometheusExporter());

builder.Services.AddSingleton<NatsPublisher>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapPrometheusScrapingEndpoint();

app.MapHealthChecks("/healthz");
app.MapGet("/api/info", () => Results.Ok(new { name = "Phos.BillingGateway", version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0" }));

app.MapPost("/api/billing/charge", async (ChargeRequest req, IValidator<ChargeRequest> validator, NatsPublisher nats) =>
{
  var result = await validator.ValidateAsync(req);
  if (!result.IsValid) return Results.ValidationProblem(result.ToDictionary());
  var id = Guid.NewGuid().ToString("n");
  var evt = new { id, userId = req.UserId, timestamp = DateTimeOffset.UtcNow, amount = req.Amount, method = req.Method, status = "queued" };
  await nats.PublishAsync("billing.attempted", evt);
  return Results.Ok(new { id, status = "queued" });
});

app.MapGet("/api/billing/status/{id}", (string id) => Results.Ok(new { id, status = "queued" }));

// Apply auth requirement conditionally
var disableAuth = (cfg["DISABLE_AUTH"] ?? "false").ToLowerInvariant() == "true";
if (!disableAuth)
{
  app.MapMethods("/api/{**catchall}", new[] { "GET", "POST", "PUT", "DELETE" }, (HttpContext ctx) => Results.NotFound())
     .RequireAuthorization();
}

app.Run();

public sealed class ChargeRequest
{
  public string UserId { get; set; } = string.Empty;
  public double Amount { get; set; }
  public string Method { get; set; } = "credit"; // credit | ach
}

public sealed class ChargeRequestValidator : AbstractValidator<ChargeRequest>
{
  public ChargeRequestValidator()
  {
    RuleFor(x => x.UserId).NotEmpty();
    RuleFor(x => x.Amount).GreaterThan(0);
    RuleFor(x => x.Method).Must(m => m == "credit" || m == "ach");
  }
}

public sealed class NatsPublisher
{
  private readonly IConfiguration _cfg;
  public NatsPublisher(IConfiguration cfg) { _cfg = cfg; }
  public Task PublishAsync(string subject, object payload)
  {
    var url = _cfg["NATS:URL"] ?? "nats://nats:4222";
    var cf = new ConnectionFactory();
    using var conn = cf.CreateConnection(url);
    var json = System.Text.Json.JsonSerializer.Serialize(payload);
    var bytes = Encoding.UTF8.GetBytes(json);
    conn.Publish(subject, bytes);
    return Task.CompletedTask;
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


