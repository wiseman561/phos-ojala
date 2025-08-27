using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NATS.Client;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using System.Text;
using System.Net.Http;
using System.Net.Http.Json;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.Host.UseSerilog((ctx, lc) => lc
  .ReadFrom.Configuration(ctx.Configuration)
  .Enrich.FromLogContext()
  .WriteTo.Console());

builder.Configuration.AddJsonFile("https.json", optional: true, reloadOnChange: true);
TryLoadVaultSecrets(builder.Configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

// EF Core
builder.Services.AddDbContext<AuditLogContext>(options =>
{
    var cs = builder.Configuration.GetConnectionString("Default") ?? builder.Configuration["POSTGRES:CONNECTION"];
    if (string.IsNullOrWhiteSpace(cs)) cs = "Host=postgres;Database=phos;Username=phos;Password=phos";
    options.UseNpgsql(cs);
});

// NATS subscriber
builder.Services.AddHostedService<NatsAuditSubscriber>();

// OpenTelemetry
builder.Services.AddOpenTelemetry()
  .ConfigureResource(r => r.AddService(serviceName: "phos-audit-log"))
  .WithTracing(tracer => tracer
    .AddAspNetCoreInstrumentation()
    .AddHttpClientInstrumentation()
    .AddOtlpExporter(o =>
    {
      o.Endpoint = new Uri(builder.Configuration["OTLP:ENDPOINT"] ?? "http://tempo:4317");
    }));

var app = builder.Build();

// Ensure DB
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuditLogContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

app.MapHealthChecks("/healthz");
app.MapGet("/api/info", () => Results.Ok(new { name = "Phos.AuditLog", version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0" }));

// Query endpoint
app.MapGet("/api/audit-logs", async (AuditLogContext db, int? page, int? pageSize, string? userId, string? action, DateTimeOffset? from, DateTimeOffset? to) =>
{
    var q = db.AuditLogs.AsQueryable();
    if (!string.IsNullOrWhiteSpace(userId)) q = q.Where(x => x.UserId == userId);
    if (!string.IsNullOrWhiteSpace(action)) q = q.Where(x => x.Action == action);
    if (from.HasValue) q = q.Where(x => x.Timestamp >= from.Value);
    if (to.HasValue) q = q.Where(x => x.Timestamp <= to.Value);
    var p = Math.Max(1, page ?? 1);
    var ps = Math.Clamp(pageSize ?? 25, 1, 200);
    var rows = await q.OrderByDescending(x => x.Timestamp).Skip((p - 1) * ps).Take(ps).Select(x => new { x.Id, x.Timestamp, x.Source, x.UserId, x.Action }).ToListAsync();
    return Results.Ok(rows);
});

await app.RunAsync();

public sealed class AuditLog
{
    public long Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string Source { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
}

public sealed class AuditLogContext : DbContext
{
    public AuditLogContext(DbContextOptions<AuditLogContext> options) : base(options) { }
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.ToTable("audit_logs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Timestamp).IsRequired();
            e.Property(x => x.Source).HasMaxLength(100).IsRequired();
            e.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            e.Property(x => x.Action).HasMaxLength(200).IsRequired();
            e.Property(x => x.Payload).IsRequired();
        });
    }
}

public sealed class NatsAuditSubscriber : BackgroundService
{
    private readonly ILogger<NatsAuditSubscriber> _logger;
    private readonly IServiceProvider _services;
    private readonly IConfiguration _configuration;
    private IConnection? _conn;

    public NatsAuditSubscriber(ILogger<NatsAuditSubscriber> logger, IServiceProvider services, IConfiguration configuration)
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
            _logger.LogInformation("AuditLog connected to NATS at {Url}", url);

            var sub = _conn.SubscribeAsync("audit.log.created");
            sub.MessageHandler += async (s, a) =>
            {
                var json = Encoding.UTF8.GetString(a.Message.Data);
                try
                {
                    using var scope = _services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AuditLogContext>();
                    var (ts, src, uid, act) = Parse(json);
                    await db.AuditLogs.AddAsync(new AuditLog
                    {
                        Timestamp = ts ?? DateTimeOffset.UtcNow,
                        Source = src ?? "unknown",
                        UserId = uid ?? "unknown",
                        Action = act ?? "unknown",
                        Payload = json
                    }, stoppingToken);
                    await db.SaveChangesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to persist audit log");
                }
            };
            sub.Start();

            while (!stoppingToken.IsCancellationRequested)
            {
                Task.Delay(500, stoppingToken).Wait(stoppingToken);
            }
        }, stoppingToken);
    }

    private static (DateTimeOffset? ts, string? src, string? uid, string? act) Parse(string json)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;
            DateTimeOffset? ts = root.TryGetProperty("timestamp", out var v1) ? v1.GetDateTimeOffset() : null;
            string? src = root.TryGetProperty("source", out var v2) ? v2.GetString() : null;
            string? uid = root.TryGetProperty("userId", out var v3) ? v3.GetString() : null;
            string? act = root.TryGetProperty("action", out var v4) ? v4.GetString() : null;
            return (ts, src, uid, act);
        }
        catch { return (null, null, null, null); }
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


