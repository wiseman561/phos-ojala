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

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("https.json", optional: true, reloadOnChange: true);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddSingleton<ReferenceRanges>();
builder.Services.AddSingleton<UnitConverter>();
builder.Services.AddSingleton<LabInterpreter>();
builder.Services.AddSingleton<Phos.LabInterpreter.Services.IAuditLogger, Phos.LabInterpreter.Services.FileAuditLogger>();

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
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseSerilogRequestLogging();

app.UseAuthentication();
app.UseAuthorization();

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

app.MapPost("/api/labs/interpret", async (InterpretationRequest request, LabInterpreter interpreter, Phos.LabInterpreter.Services.IAuditLogger audit) =>
{
    var validationErrors = request.Validate();
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(validationErrors);
    }

    var result = interpreter.Interpret(request);
    await audit.LogAsync(request.UserId, "POST", "/api/labs/interpret", "success");
    return Results.Ok(result);
}).RequireAuthorization("Provider");

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
