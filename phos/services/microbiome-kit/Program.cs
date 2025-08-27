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
    name = "Phos.MicrobiomeKit",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));

app.MapGet("/info", () => Results.Ok(new {
    name = "Phos.MicrobiomeKit",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));

app.MapGet("/healthz", () => Results.Ok(new {
    service = "microbiome-kit",
    status = "healthy"
}));

// Placeholder: accept bacteria concentrations and produce diversity score
app.MapPost("/api/microbiome/analyze", (MicrobiomeAnalyzeRequest req) =>
{
    var count = req.Bacteria?.Count ?? 0;
    var total = req.Bacteria?.Values.Where(v => v > 0).Sum() ?? 0;
    var diversity = count == 0 ? 0 : Math.Round(Math.Log(count + 1, 10) * 100.0, 1);
    return Results.Ok(new MicrobiomeAnalyzeResponse { SpeciesCount = count, TotalAbundance = total, DiversityScore = diversity });
}).RequireAuthorization();

app.Run();

public sealed class MicrobiomeAnalyzeRequest
{
    public Dictionary<string, double>? Bacteria { get; set; }
}

public sealed class MicrobiomeAnalyzeResponse
{
    public int SpeciesCount { get; set; }
    public double TotalAbundance { get; set; }
    public double DiversityScore { get; set; }
}

app.Run();
