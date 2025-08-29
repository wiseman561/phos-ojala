using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using NATS.Client;
using System.Text;
using Microsoft.Extensions.Configuration;
using OpenTelemetry.Trace;
using OpenTelemetry.Resources;
using System.Net.Http;
using System.Net.Http.Json;

var builder = WebApplication.CreateBuilder(args);
TryLoadVaultSecrets(builder.Configuration);
// Serilog
builder.Host.UseSerilog((ctx, lc) => lc
  .ReadFrom.Configuration(ctx.Configuration)
  .Enrich.FromLogContext()
  .WriteTo.Console());

builder.Configuration.AddJsonFile("https.json", optional: true, reloadOnChange: true);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();

// EF Core
builder.Services.AddDbContext<PhosSyncContext>(options =>
{
    var cs = builder.Configuration.GetConnectionString("Default") ?? builder.Configuration["POSTGRES:CONNECTION"];
    if (string.IsNullOrWhiteSpace(cs)) cs = "Host=postgres;Database=phos;Username=phos;Password=phos";
    options.UseNpgsql(cs);
});

// NATS background subscriber
builder.Services.AddHostedService<NatsSubscriber>();

// OpenTelemetry
builder.Services.AddOpenTelemetry()
  .ConfigureResource(r => r.AddService(serviceName: "phos-sync"))
  .WithTracing(tracer => tracer
    .AddAspNetCoreInstrumentation()
    .AddHttpClientInstrumentation()
    .AddOtlpExporter(o =>
    {
      o.Endpoint = new Uri(builder.Configuration["OTLP:ENDPOINT"] ?? "http://tempo:4317");
    }));

var app = builder.Build();

app.MapHealthChecks("/healthz");
app.MapGet("/api/info", () => Results.Ok(new { name = "Phos.Sync", version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0" }));

app.UseHttpsRedirection();
app.UseSerilogRequestLogging();

await app.RunAsync();

public sealed class SyncEvent
{
    public long Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
    public string Payload { get; set; } = string.Empty;
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

public sealed class PhosSyncContext : DbContext
{
    public PhosSyncContext(DbContextOptions<PhosSyncContext> options) : base(options) { }
    public DbSet<SyncEvent> SyncEvents => Set<SyncEvent>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SyncEvent>(e =>
        {
            e.ToTable("sync_events");
            e.HasKey(x => x.Id);
            e.Property(x => x.Subject).HasMaxLength(200).IsRequired();
            e.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            e.Property(x => x.Timestamp).IsRequired();
            e.Property(x => x.Payload).IsRequired();
        });
    }
}

public sealed class NatsSubscriber : BackgroundService
{
    private readonly ILogger<NatsSubscriber> _logger;
    private readonly IServiceProvider _services;
    private readonly IConfiguration _configuration;
    private IConnection? _conn;

    public NatsSubscriber(ILogger<NatsSubscriber> logger, IServiceProvider services, IConfiguration configuration)
    {
        _logger = logger;
        _services = services;
        _configuration = configuration;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return Task.Run(() =>
        {
            var url = _configuration["NATS:URL"] ?? "nats://nats:4222";
            var cf = new ConnectionFactory();
            _conn = cf.CreateConnection(url);
            _logger.LogInformation("Phos.Sync connected to NATS at {Url}", url);

            void Subscribe(string subject)
            {
                var sub = _conn!.SubscribeAsync(subject);
                sub.MessageHandler += async (s, a) =>
                {
                    var json = Encoding.UTF8.GetString(a.Message.Data);
                    try
                    {
                        using var scope = _services.CreateScope();
                        var db = scope.ServiceProvider.GetRequiredService<PhosSyncContext>();
                        var userId = ExtractUserId(json) ?? "unknown";
                        await db.SyncEvents.AddAsync(new SyncEvent
                        {
                            Subject = subject,
                            UserId = userId,
                            Timestamp = DateTimeOffset.UtcNow,
                            Payload = json
                        }, stoppingToken);
                        await db.SaveChangesAsync(stoppingToken);

                        if (subject == "labs.result.created" || subject == "nutrition.analysis.completed")
                        {
                            var payload = Encoding.UTF8.GetBytes(json);
                            _conn!.Publish("core.recommendation.required", payload);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to process event on {Subject}", subject);
                    }
                };
                sub.Start();
                _logger.LogInformation("Subscribed to {Subject}", subject);
            }

            Subscribe("labs.result.created");
            Subscribe("nutrition.analysis.completed");

            while (!stoppingToken.IsCancellationRequested)
            {
                Task.Delay(500, stoppingToken).Wait(stoppingToken);
            }
        }, stoppingToken);
    }

    private static string? ExtractUserId(string json)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("userId", out var uid))
            {
                return uid.GetString();
            }
        }
        catch { }
        return null;
    }
}
