using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Serilog;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using NATS.Client;
using System.Text.Json;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using System.Net.Http;
using System.Net.Http.Json;
using FluentValidation;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
TryLoadVaultSecrets(builder.Configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddSingleton<NutritionAnalyzer>();
builder.Services.AddDbContext<NutritionContext>(options =>
{
    var cs = builder.Configuration["POSTGRES:CONNECTION"] ?? builder.Configuration.GetConnectionString("Default");
    if (string.IsNullOrWhiteSpace(cs)) cs = "Host=postgres;Database=phos;Username=phos;Password=phos";
    options.UseNpgsql(cs);
});
builder.Services.AddSingleton<NatsPublisher>();
builder.Services.AddValidatorsFromAssemblyContaining<AnalyzeRequestValidator>();
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("nutrition-policy", httpContext => RateLimitPartition.GetFixedWindowLimiter("nutrition", _ => new FixedWindowRateLimiterOptions
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
  .ConfigureResource(r => r.AddService(serviceName: "phos-nutrition-kit"))
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

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NutritionContext>();
    db.Database.EnsureCreated();
}

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

app.MapPost("/api/nutrition/analyze", async (HttpContext http, AnalyzeRequest req, IValidator<AnalyzeRequest> validator, NutritionAnalyzer analyzer, NutritionContext db, NatsPublisher nats) =>
{
    var validation = await validator.ValidateAsync(req);
    if (!validation.IsValid) return Results.ValidationProblem(validation.ToDictionary());
    var res = analyzer.Analyze(req);

    var entity = new NutritionEvent
    {
        UserId = req.Meals.FirstOrDefault()?.Items.FirstOrDefault()?.Name ?? "unknown",
        Timestamp = DateTimeOffset.UtcNow,
        Payload = JsonSerializer.Serialize(res)
    };
    await db.NutritionEvents.AddAsync(entity);
    await db.SaveChangesAsync();

    await nats.PublishAsync("nutrition.analysis.completed", new
    {
        userId = entity.UserId,
        timestamp = entity.Timestamp,
        totals = new { kcal = res.Kcal, protein_g = res.ProteinG, fat_g = res.FatG, carbs_g = res.CarbsG }
    });

    await nats.PublishAsync("audit.log.created", new
    {
        timestamp = DateTimeOffset.UtcNow,
        source = "nutrition-kit",
        userId = entity.UserId,
        action = "nutrition.analyze"
    });

    if (http.TraceIdentifier is string tid) http.Response.Headers.Append("x-trace-id", tid);
    return Results.Ok(res);
}).RequireAuthorization("Provider").RequireRateLimiting("nutrition-policy");

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

public sealed class AnalyzeRequestValidator : AbstractValidator<AnalyzeRequest>
{
    public AnalyzeRequestValidator()
    {
        RuleFor(x => x.Meals).NotNull().NotEmpty();
        RuleForEach(x => x.Meals).ChildRules(m =>
        {
            m.RuleFor(mm => mm.Items).NotNull().NotEmpty();
            m.RuleForEach(mm => mm.Items).ChildRules(i =>
            {
                i.RuleFor(ii => ii.Name).NotEmpty();
                i.RuleFor(ii => ii.Grams).GreaterThan(0);
            });
        });
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

public sealed class NutritionEvent
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
    public string Payload { get; set; } = string.Empty;
}

public sealed class NutritionContext : DbContext
{
    public NutritionContext(DbContextOptions<NutritionContext> options) : base(options) { }
    public DbSet<NutritionEvent> NutritionEvents => Set<NutritionEvent>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<NutritionEvent>(e =>
        {
            e.ToTable("nutrition_events");
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
