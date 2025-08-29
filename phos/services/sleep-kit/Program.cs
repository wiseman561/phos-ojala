using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
// Serilog
builder.Host.UseSerilog((ctx, lc) => lc
  .ReadFrom.Configuration(ctx.Configuration)
  .Enrich.FromLogContext()
  .WriteTo.Console());

builder.Configuration.AddJsonFile("https.json", optional: true, reloadOnChange: true);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Auth
var cfg = builder.Configuration;
builder.Services
  .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
    var authority = cfg["IDP:ISSUER"] ?? (cfg["IDP:DOMAIN"] != null ? $"https://{cfg["IDP:DOMAIN"]}/" : null);
    options.Authority = authority;
    options.Audience = cfg["IDP:AUDIENCE"];
    options.TokenValidationParameters = new TokenValidationParameters
    {
      ValidateIssuer = true,
      ValidateAudience = true,
      ValidateIssuerSigningKey = true,
      ValidateLifetime = true,
      ClockSkew = TimeSpan.FromSeconds(30)
    };
  });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();

var config = app.Configuration;
_ = config["POSTGRES:CONNECTION"]; // maps from env POSTGRES__CONNECTION
_ = config["REDIS:CONNECTION"];    // maps from env REDIS__CONNECTION
_ = config["NATS:URL"];            // maps from env NATS__URL

app.MapGet("/api/info", () => Results.Ok(new {
    name = "Phos.SleepKit",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));

app.MapGet("/info", () => Results.Ok(new {
    name = "Phos.SleepKit",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));

app.MapGet("/healthz", () => Results.Ok(new {
    service = "sleep-kit",
    status = "healthy"
}));

// Placeholder: accept week of sleep durations and return quality metrics
app.MapPost("/api/sleep/analyze", (SleepAnalyzeRequest req) =>
{
    var nights = req.DurationsHours?.Count ?? 0;
    var avg = nights == 0 ? 0 : Math.Round(req.DurationsHours!.Average(), 1);
    var quality = avg >= 7 ? "good" : avg >= 6 ? "fair" : "poor";
    return Results.Ok(new SleepAnalyzeResponse { Nights = nights, AverageHours = avg, Quality = quality });
}).RequireAuthorization();

app.Run();

public sealed class SleepAnalyzeRequest
{
    public List<double>? DurationsHours { get; set; }
}

public sealed class SleepAnalyzeResponse
{
    public int Nights { get; set; }
    public double AverageHours { get; set; }
    public string Quality { get; set; } = "poor";
}

app.Run();
