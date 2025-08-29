using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.Runtime.CompilerServices;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using NATS.Client;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using System.Net.Http;
using System.Net.Http.Json;
using FluentValidation;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("https.json", optional: true, reloadOnChange: true);

// Vault (optional + enforce in non-dev)
TryLoadVaultSecrets(builder.Configuration);
EnsureRequired(builder.Configuration, new[] { "POSTGRES:CONNECTION", "NATS:URL", "IDP:ISSUER", "IDP:AUDIENCE" });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddSingleton<ReferenceRanges>();
builder.Services.AddSingleton<UnitConverter>();
builder.Services.AddSingleton<LabInterpreter>();
builder.Services.AddSingleton<Phos.LabInterpreter.Services.IAuditLogger, Phos.LabInterpreter.Services.FileAuditLogger>();
builder.Services.AddDbContext<LabInterpreterContext>(options =>
{
    var cs = builder.Configuration["POSTGRES:CONNECTION"] ?? builder.Configuration.GetConnectionString("Default");
    if (string.IsNullOrWhiteSpace(cs)) cs = "Host=postgres;Database=phos;Username=phos;Password=phos";
    options.UseNpgsql(cs);
});
builder.Services.AddSingleton<NatsPublisher>();
builder.Services.AddValidatorsFromAssemblyContaining<InterpretationRequestValidator>();
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("labs-policy", httpContext => RateLimitPartition.GetFixedWindowLimiter("labs", _ => new FixedWindowRateLimiterOptions
    {
        PermitLimit = 60,
        Window = TimeSpan.FromMinutes(1),
        QueueLimit = 0,
        AutoReplenishment = true
    }));
});

// Serilog
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
});

// OpenTelemetry
builder.Services.AddOpenTelemetry()
  .ConfigureResource(r => r.AddService(serviceName: "phos-lab-interpreter"))
  .WithTracing(tracer => tracer
    .AddAspNetCoreInstrumentation()
    .AddHttpClientInstrumentation()
    .AddOtlpExporter(o =>
    {
      o.Endpoint = new Uri(config["OTLP:ENDPOINT"] ?? "http://tempo:4317");
    }));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseSerilogRequestLogging();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Ensure database exists
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LabInterpreterContext>();
    db.Database.EnsureCreated();
}

var appConfig = app.Configuration;
_ = appConfig["POSTGRES:CONNECTION"]; // maps from env POSTGRES__CONNECTION
_ = appConfig["REDIS:CONNECTION"];    // maps from env REDIS__CONNECTION
_ = appConfig["NATS:URL"];            // maps from env NATS__URL

app.MapGet("/api/info", () => Results.Ok(new {
    name = "Phos.LabInterpreter",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));
app.MapGet("/info", () => Results.Ok(new {
    name = "Phos.LabInterpreter",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));

app.MapHealthChecks("/healthz");
app.UseHttpsRedirection();

app.MapPost("/api/labs/interpret", async (HttpContext http, InterpretationRequest request, IValidator<InterpretationRequest> validator, LabInterpreter interpreter, Phos.LabInterpreter.Services.IAuditLogger audit, LabInterpreterContext db, NatsPublisher nats) =>
{
    var validation = await validator.ValidateAsync(request);
    if (!validation.IsValid) return Results.ValidationProblem(validation.ToDictionary());

    var result = interpreter.Interpret(request);
    await audit.LogAsync(request.UserId, "POST", "/api/labs/interpret", "success");

    var entity = new LabResult
    {
        UserId = request.UserId,
        Timestamp = DateTimeOffset.UtcNow,
        Payload = JsonSerializer.Serialize(result)
    };
    await db.LabResults.AddAsync(entity);
    await db.SaveChangesAsync();

    await nats.PublishAsync("labs.result.created", new
    {
        userId = request.UserId,
        timestamp = DateTimeOffset.UtcNow,
        results = result.Results
    });

    // Audit log
    await nats.PublishAsync("audit.log.created", new
    {
        timestamp = DateTimeOffset.UtcNow,
        source = "lab-interpreter",
        userId = request.UserId,
        action = "labs.interpret"
    });

    if (http.TraceIdentifier is string tid) http.Response.Headers.Append("x-trace-id", tid);
    return Results.Ok(result);
}).RequireAuthorization("Provider").RequireRateLimiting("labs-policy");

app.Run();

// DTOs
public sealed class Measurement
{
    [Required]
    [JsonPropertyName("code")] public string Code { get; set; } = string.Empty; // e.g., LDL_C

    [JsonPropertyName("name")] public string? Name { get; set; }

    [Required]
    [JsonPropertyName("value")] public double Value { get; set; }

    [Required]
    [JsonPropertyName("unit")] public string Unit { get; set; } = string.Empty; // e.g., mg/dL, mmol/L, U/L

    [JsonPropertyName("measuredAt")] public DateTimeOffset? MeasuredAt { get; set; }
}

public sealed class RequestContext
{
    [JsonPropertyName("sex")] public string? Sex { get; set; } // "male" | "female" (optional)
    [JsonPropertyName("ageYears")] public int? AgeYears { get; set; }
}

public sealed class InterpretationRequest
{
    [Required]
    [JsonPropertyName("userId")] public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("context")] public RequestContext Context { get; set; } = new();

    [Required]
    [MinLength(1)]
    [JsonPropertyName("measurements")] public List<Measurement> Measurements { get; set; } = new();

    public IDictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(UserId)) errors["userId"] = new[] { "userId is required" };
        if (Measurements == null || Measurements.Count == 0) errors["measurements"] = new[] { "At least one measurement is required" };
        else
        {
            for (int i = 0; i < Measurements.Count; i++)
            {
                var m = Measurements[i];
                var key = $"measurements[{i}]";
                var list = new List<string>();
                if (string.IsNullOrWhiteSpace(m.Code)) list.Add("code is required");
                if (double.IsNaN(m.Value) || double.IsInfinity(m.Value)) list.Add("value must be a valid number");
                if (string.IsNullOrWhiteSpace(m.Unit)) list.Add("unit is required");
                if (list.Count > 0) errors[key] = list.ToArray();
            }
        }
        return errors;
    }
}

public sealed class InterpretationRequestValidator : AbstractValidator<InterpretationRequest>
{
    public InterpretationRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Measurements).NotNull().NotEmpty();
        RuleForEach(x => x.Measurements).ChildRules(m =>
        {
            m.RuleFor(v => v.Code).NotEmpty();
            m.RuleFor(v => v.Value).NotNull();
            m.RuleFor(v => v.Unit).NotEmpty();
        });
    }
}

public sealed class MeasurementInterpretation
{
    [JsonPropertyName("code")] public string Code { get; set; } = string.Empty;
    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("value")] public double Value { get; set; }
    [JsonPropertyName("unit")] public string Unit { get; set; } = string.Empty;
    [JsonPropertyName("severity")] public string Severity { get; set; } = "normal"; // low | normal | high
    [JsonPropertyName("summary")] public string Summary { get; set; } = string.Empty;
}

public sealed class InterpretationResponse
{
    [JsonPropertyName("userId")] public string UserId { get; set; } = string.Empty;
    [JsonPropertyName("results")] public List<MeasurementInterpretation> Results { get; set; } = new();
}

// Services
public sealed class ReferenceRanges
{
    // Very simple static ranges for demo; units indicated in comments
    private readonly Dictionary<string, (double low, double high, string unit)> _ranges = new(StringComparer.OrdinalIgnoreCase)
    {
        { "LDL_C", (0, 100, "mg/dL") },              // Optimal < 100
        { "HDL_C", (40, 9999, "mg/dL") },            // Desirable >= 40 (simplified)
        { "TRIG",  (0, 150, "mg/dL") },              // Normal < 150
        { "A1C",   (0, 5.7, "%") },                  // Normal < 5.7%
        { "ALT",   (0, 40, "U/L") },                 // Typical upper limit ~40
        { "TSH",   (0.4, 4.0, "mIU/L") },            // Typical range 0.4–4.0
        { "VITD",  (20, 50, "ng/mL") },              // Adequate 20–50
    };

    public bool TryGet(string code, out (double low, double high, string unit) range) => _ranges.TryGetValue(code, out range);
}

public sealed class UnitConverter
{
    // Conversion factors for common lipids (approximate)
    public const double MgDlToMmolL_LDL = 0.0259;   // mmol/L = mg/dL × 0.0259
    public const double MgDlToMmolL_TRIG = 0.0113;  // mmol/L = mg/dL × 0.0113

    public (double value, string unit) Normalize(string code, double value, string unit)
    {
        if (string.Equals(unit, "mg/dL", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(code, "LDL_C", StringComparison.OrdinalIgnoreCase))
                return (value, unit);
            if (string.Equals(code, "TRIG", StringComparison.OrdinalIgnoreCase))
                return (value, unit);
        }
        if (string.Equals(unit, "mmol/L", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(code, "LDL_C", StringComparison.OrdinalIgnoreCase))
                return (value / MgDlToMmolL_LDL, "mg/dL");
            if (string.Equals(code, "TRIG", StringComparison.OrdinalIgnoreCase))
                return (value / MgDlToMmolL_TRIG, "mg/dL");
        }
        // For unsupported unit/code combos, return as-is
        return (value, unit);
    }
}

public sealed class LabInterpreter
{
    private readonly ReferenceRanges _ranges;
    private readonly UnitConverter _converter;

    public LabInterpreter(ReferenceRanges ranges, UnitConverter converter)
    {
        _ranges = ranges;
        _converter = converter;
    }

    public InterpretationResponse Interpret(InterpretationRequest request)
    {
        var response = new InterpretationResponse { UserId = request.UserId };
        foreach (var m in request.Measurements)
        {
            var code = m.Code.Trim();
            var (normalizedValue, normalizedUnit) = _converter.Normalize(code, m.Value, m.Unit);
            var (severity, summary) = Classify(code, normalizedValue, normalizedUnit);

            response.Results.Add(new MeasurementInterpretation
            {
                Code = code,
                Name = m.Name,
                Value = normalizedValue,
                Unit = normalizedUnit,
                Severity = severity,
                Summary = summary,
            });
        }
        return response;
    }

    public (string severity, string summary) Classify(string code, double value, string unit)
    {
        if (!_ranges.TryGet(code, out var range))
        {
            return ("normal", $"No reference for {code}. Value {value} {unit} recorded.");
        }

        // If units differ from reference, keep simple note
        var refUnit = range.unit;
        if (!string.Equals(refUnit, unit, StringComparison.OrdinalIgnoreCase))
        {
            // Attempt to normalize common lipids to mg/dL already done; proceed anyway
        }

        if (value < range.low)
        {
            return ("low", $"{code}: {value} {unit} is below reference ({range.low}-{range.high} {refUnit}).");
        }
        if (value > range.high)
        {
            return ("high", $"{code}: {value} {unit} is above reference ({range.low}-{range.high} {refUnit}).");
        }
        return ("normal", $"{code}: {value} {unit} within reference ({range.low}-{range.high} {refUnit}).");
    }
}

public sealed class LabResult
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
    public string Payload { get; set; } = string.Empty;
}

public sealed class LabInterpreterContext : DbContext
{
    public LabInterpreterContext(DbContextOptions<LabInterpreterContext> options) : base(options) { }
    public DbSet<LabResult> LabResults => Set<LabResult>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LabResult>(e =>
        {
            e.ToTable("lab_results");
            e.HasKey(x => x.Id);
            e.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            e.Property(x => x.Timestamp).IsRequired();
            e.Property(x => x.Payload).IsRequired();
        });
    }
}

public sealed class NatsPublisher
{
    private readonly IConfiguration _configuration;
    public NatsPublisher(IConfiguration configuration) { _configuration = configuration; }
    public Task PublishAsync(string subject, object payload, CancellationToken ct = default)
    {
        var url = _configuration["NATS:URL"] ?? "nats://nats:4222";
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
    var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
    var enabledRaw = config["VAULT:ENABLED"] ?? config["VAULT__ENABLED"] ?? (env == "Development" ? "false" : "true");
    var enabled = enabledRaw.Equals("true", StringComparison.OrdinalIgnoreCase);
    if (!enabled) return;
    var addr = config["VAULT:ADDR"]; var roleId = config["VAULT:ROLE_ID"]; var secretId = config["VAULT:SECRET_ID"]; var kvPath = config["VAULT:KV_PATH"] ?? "secret/data/phos";
    if (string.IsNullOrWhiteSpace(addr) || string.IsNullOrWhiteSpace(roleId) || string.IsNullOrWhiteSpace(secretId))
        throw new InvalidOperationException("Vault is enabled but VAULT:ADDR/ROLE_ID/SECRET_ID are missing");
    using var http = new HttpClient { BaseAddress = new Uri(addr) };
    var loginRes = http.PostAsJsonAsync("/v1/auth/approle/login", new { role_id = roleId, secret_id = secretId }).Result; loginRes.EnsureSuccessStatusCode();
    var loginJson = loginRes.Content.ReadFromJsonAsync<dynamic>().Result; string token = loginJson?.auth?.client_token ?? string.Empty;
    if (string.IsNullOrWhiteSpace(token)) throw new InvalidOperationException("Vault login did not return a token");
    http.DefaultRequestHeaders.Add("X-Vault-Token", token);
    var kvRes = http.GetAsync($"/v1/{kvPath}").Result; kvRes.EnsureSuccessStatusCode();
    var kvJson = kvRes.Content.ReadFromJsonAsync<dynamic>().Result; var data = kvJson?.data?.data;
    if (data is null) throw new InvalidOperationException("Vault KV data is empty");
    var dict = new Dictionary<string, string?>(); foreach (var prop in (IDictionary<string, object>)data) dict[prop.Key.Replace("__", ":")] = prop.Value?.ToString();
    if (dict.Count > 0) config.AddInMemoryCollection(dict!);
}

static void EnsureRequired(IConfiguration config, string[] keys)
{
    var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
    var enabledRaw = config["VAULT:ENABLED"] ?? config["VAULT__ENABLED"] ?? (env == "Development" ? "false" : "true");
    var enforce = enabledRaw.Equals("true", StringComparison.OrdinalIgnoreCase);
    if (!enforce) return;
    foreach (var k in keys)
    {
        if (string.IsNullOrWhiteSpace(config[k])) throw new InvalidOperationException($"Missing required configuration key: {k}");
    }
}
