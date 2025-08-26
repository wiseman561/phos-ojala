using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Serilog;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddSingleton<NutritionAnalyzer>();

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
    name = "Phos.NutritionKit",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));
app.MapGet("/info", () => Results.Ok(new {
    name = "Phos.NutritionKit",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));

app.MapHealthChecks("/healthz");
app.UseHttpsRedirection();

app.MapPost("/api/nutrition/analyze", (AnalyzeRequest req, NutritionAnalyzer analyzer) =>
{
    var errors = req.Validate();
    if (errors.Count > 0) return Results.ValidationProblem(errors);
    var res = analyzer.Analyze(req);
    return Results.Ok(res);
}).RequireAuthorization("Provider");

app.Run();

public sealed class AnalyzeRequest
{
    [Required]
    [JsonPropertyName("meals")] public List<Meal> Meals { get; set; } = new();

    public IDictionary<string, string[]> Validate()
    {
        var errors = new Dictionary<string, string[]>();
        if (Meals == null || Meals.Count == 0)
        {
            errors["meals"] = new[] { "At least one meal is required" };
            return errors;
        }
        for (int i = 0; i < Meals.Count; i++)
        {
            var meal = Meals[i];
            if (meal.Items == null || meal.Items.Count == 0)
            {
                errors[$"meals[{i}].items"] = new[] { "At least one item is required" };
            }
            else
            {
                for (int j = 0; j < meal.Items.Count; j++)
                {
                    var it = meal.Items[j];
                    var list = new List<string>();
                    if (string.IsNullOrWhiteSpace(it.Name)) list.Add("name is required");
                    if (it.Grams <= 0) list.Add("grams must be > 0");
                    if (list.Count > 0) errors[$"meals[{i}].items[{j}]"] = list.ToArray();
                }
            }
        }
        return errors;
    }
}

public sealed class Meal
{
    [JsonPropertyName("items")] public List<MealItem> Items { get; set; } = new();
}

public sealed class MealItem
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("grams")] public double Grams { get; set; }
    [JsonPropertyName("macros")] public Macros? Macros { get; set; }
}

public sealed class Macros
{
    [JsonPropertyName("kcal")] public double Kcal { get; set; }
    [JsonPropertyName("protein_g")] public double ProteinG { get; set; }
    [JsonPropertyName("fat_g")] public double FatG { get; set; }
    [JsonPropertyName("carbs_g")] public double CarbsG { get; set; }
}

public sealed class AnalyzeResponse
{
    [JsonPropertyName("kcal")] public double Kcal { get; set; }
    [JsonPropertyName("protein_g")] public double ProteinG { get; set; }
    [JsonPropertyName("fat_g")] public double FatG { get; set; }
    [JsonPropertyName("carbs_g")] public double CarbsG { get; set; }
}

public sealed class NutritionAnalyzer
{
    public AnalyzeResponse Analyze(AnalyzeRequest req)
    {
        double kcal = 0, p = 0, f = 0, c = 0;
        foreach (var meal in req.Meals)
        {
            foreach (var it in meal.Items)
            {
                var factor = Math.Max(0, it.Grams) / 100.0; // macros per 100g
                var m = it.Macros ?? InferMacros(it);
                kcal += m.Kcal * factor;
                p += m.ProteinG * factor;
                f += m.FatG * factor;
                c += m.CarbsG * factor;
            }
        }
        return new AnalyzeResponse { Kcal = Math.Round(kcal, 1), ProteinG = Math.Round(p, 1), FatG = Math.Round(f, 1), CarbsG = Math.Round(c, 1) };
    }

    private Macros InferMacros(MealItem it)
    {
        // Simple stub for common items (per 100g)
        return it.Name.ToLowerInvariant() switch
        {
            "chicken" => new Macros { Kcal = 165, ProteinG = 31, FatG = 3.6, CarbsG = 0 },
            "rice" => new Macros { Kcal = 130, ProteinG = 2.7, FatG = 0.3, CarbsG = 28 },
            "broccoli" => new Macros { Kcal = 55, ProteinG = 3.7, FatG = 0.6, CarbsG = 11 },
            _ => new Macros { Kcal = 200, ProteinG = 5, FatG = 5, CarbsG = 30 }
        };
    }
}
