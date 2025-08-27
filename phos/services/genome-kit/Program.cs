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
    name = "Phos.GenomeKit",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));

app.MapGet("/info", () => Results.Ok(new {
    name = "Phos.GenomeKit",
    version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0"
}));

app.MapGet("/healthz", () => Results.Ok(new {
    service = "genome-kit",
    status = "healthy"
}));

// Minimal business logic: parse simulated FASTA (string) and return gene risk summary
app.MapPost("/api/genome/analyze", (GenomeAnalyzeRequest req) =>
{
    var totalBases = req.Fasta?.Length ?? 0;
    var gc = req.Fasta == null ? 0 : req.Fasta.Count(c => c == 'G' || c == 'C');
    var gcPct = totalBases == 0 ? 0 : Math.Round(gc * 100.0 / totalBases, 1);
    var risk = gcPct > 55 ? "elevated" : gcPct < 40 ? "low" : "moderate";
    return Results.Ok(new GenomeAnalyzeResponse { TotalBases = totalBases, GcPercent = gcPct, Risk = risk });
}).RequireAuthorization();

app.Run();

public sealed class GenomeAnalyzeRequest
{
    public string? Fasta { get; set; }
}

public sealed class GenomeAnalyzeResponse
{
    public int TotalBases { get; set; }
    public double GcPercent { get; set; }
    public string Risk { get; set; } = "moderate";
}

// end of file
