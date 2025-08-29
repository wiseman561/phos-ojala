using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NATS.Client;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Metrics;
using Serilog;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;

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

builder.Services.AddDbContext<PhosDigestionContext>(options =>
{
  var cs = builder.Configuration.GetConnectionString("Default") ?? builder.Configuration["POSTGRES:CONNECTION"];
  if (string.IsNullOrWhiteSpace(cs)) cs = "Host=postgres;Database=phos;Username=phos;Password=phos";
  options.UseNpgsql(cs);
});

builder.Services.AddOpenTelemetry()
  .ConfigureResource(r => r.AddService("phos-digestion-score"))
  .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddOtlpExporter(o => o.Endpoint = new Uri(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? builder.Configuration["OTLP:ENDPOINT"] ?? "http://otel-collector:4317")))
  .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddPrometheusExporter());

builder.Services.AddHostedService<DigestionWorker>();
builder.Services.AddScoped<DigestionRepository>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
  var db = scope.ServiceProvider.GetRequiredService<PhosDigestionContext>();
  if ((Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development") == "Development")
  {
    db.Database.Migrate();
  }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseSerilogRequestLogging();
app.MapHealthChecks("/healthz");
app.MapGet("/api/info", () => Results.Ok(new { name = "Phos.DigestionScore", version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0" }));
app.MapPrometheusScrapingEndpoint();

await app.RunAsync();

public sealed class DigestionScore
{
  public long Id { get; set; }
  public string UserId { get; set; } = string.Empty;
  public decimal Score { get; set; }
  public DateTime AsOfDate { get; set; }
  public DateTime ComputedAtUtc { get; set; }
}

public sealed class PhosDigestionContext : DbContext
{
  public PhosDigestionContext(DbContextOptions<PhosDigestionContext> options) : base(options) { }
  public DbSet<DigestionScore> DigestionScores => Set<DigestionScore>();
  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<DigestionScore>(e =>
    {
      e.ToTable("digestion_scores");
      e.HasKey(x => x.Id);
      e.Property(x => x.UserId).HasMaxLength(128).IsRequired();
      e.Property(x => x.Score).HasColumnType("numeric(5,2)").IsRequired();
      e.Property(x => x.AsOfDate).IsRequired();
      e.Property(x => x.ComputedAtUtc).IsRequired();
      e.HasIndex(x => new { x.UserId, x.AsOfDate }).IsUnique();
    });
  }
}

public sealed class DigestionRepository
{
  private readonly PhosDigestionContext _db;
  public DigestionRepository(PhosDigestionContext db) { _db = db; }
  public void UpsertDaily(string userId, decimal score, DateTime asOfDate)
  {
    var existing = _db.DigestionScores.FirstOrDefault(x => x.UserId == userId && x.AsOfDate == asOfDate);
    if (existing == null)
    {
      _db.DigestionScores.Add(new DigestionScore { UserId = userId, Score = score, AsOfDate = asOfDate, ComputedAtUtc = DateTime.UtcNow });
    }
    else
    {
      existing.Score = score;
      existing.ComputedAtUtc = DateTime.UtcNow;
    }
    _db.SaveChanges();
  }
}

public sealed class DigestionWorker : BackgroundService
{
  private readonly ILogger<DigestionWorker> _logger;
  private readonly IServiceProvider _services;
  private readonly IConfiguration _configuration;
  private IConnection? _conn;
  private readonly Dictionary<string, (double labs, double nutrition)> _agg = new();
  private readonly IServiceProvider _serviceProvider;

  public DigestionWorker(ILogger<DigestionWorker> logger, IServiceProvider services, IConfiguration configuration)
  { _logger = logger; _services = services; _configuration = configuration; }

  protected override Task ExecuteAsync(CancellationToken stoppingToken)
  {
    return Task.Run(() =>
    {
      var url = _configuration["NATS:URL"] ?? "nats://nats:4222";
      var cf = new ConnectionFactory();
      _conn = cf.CreateConnection(url);
      _logger.LogInformation("DigestionScore connected to NATS at {Url}", url);

      void Sub(string subject, Action<string> handler)
      {
        var sub = _conn!.SubscribeAsync(subject);
        sub.MessageHandler += (s, a) =>
        {
          var json = Encoding.UTF8.GetString(a.Message.Data);
          try { handler(json); } catch (Exception ex) { _logger.LogError(ex, "handler error for {Subject}", subject); }
        };
        sub.Start();
        _logger.LogInformation("Subscribed to {Subject}", subject);
      }

      Sub("labs.result.created", json =>
      {
        var uid = ExtractString(json, "userId"); if (string.IsNullOrEmpty(uid)) return;
        lock (_agg) { var cur = _agg.GetValueOrDefault(uid); cur.labs = 50; _agg[uid] = cur; }
      });
      Sub("nutrition.analysis.completed", json =>
      {
        var uid = ExtractString(json, "userId"); if (string.IsNullOrEmpty(uid)) return;
        lock (_agg) { var cur = _agg.GetValueOrDefault(uid); cur.nutrition = 50; _agg[uid] = cur; }
      });

      var intervalMin = int.TryParse(_configuration["DIGESTION_SCORE:INTERVAL_MIN"], out var m) ? m :
        int.TryParse(_configuration["DIGESTION_SCORE__INTERVAL_MIN"], out var m2) ? m2 : 1440;
      while (!stoppingToken.IsCancellationRequested)
      {
        Task.Delay(TimeSpan.FromMinutes(intervalMin), stoppingToken).Wait(stoppingToken);
        try
        {
          using var scope = _services.CreateScope();
          var repo = scope.ServiceProvider.GetRequiredService<DigestionRepository>();
          Dictionary<string, (double labs, double nutrition)> snapshot;
          lock (_agg) { snapshot = new Dictionary<string, (double labs, double nutrition)>(_agg); _agg.Clear(); }
          foreach (var (uid, vals) in snapshot)
          {
            var score = Math.Round((vals.labs + vals.nutrition) / 2, 2);
            repo.UpsertDaily(uid, (decimal)score, DateTime.UtcNow.Date);
            Publish("digestion.score.generated", new { userId = uid, timestamp = DateTimeOffset.UtcNow, score, asOfDate = DateTime.UtcNow.Date.ToString("yyyy-MM-dd") });
          }
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to generate digestion scores"); }
      }
    });
  }

  private void Publish(string subject, object payload)
  {
    if (_conn == null) return;
    var json = System.Text.Json.JsonSerializer.Serialize(payload);
    var bytes = Encoding.UTF8.GetBytes(json);
    _conn.Publish(subject, bytes);
  }

  private static string? ExtractString(string json, string prop)
  { try { using var doc = System.Text.Json.JsonDocument.Parse(json); return doc.RootElement.TryGetProperty(prop, out var v) ? v.GetString() : null; } catch { return null; } }
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


