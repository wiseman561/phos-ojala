using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
// Serilog
builder.Host.UseSerilog((ctx, lc) => lc
  .ReadFrom.Configuration(ctx.Configuration)
  .Enrich.FromLogContext()
  .WriteTo.Console());

builder.Configuration.AddJsonFile("https.json", optional: true, reloadOnChange: true);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapHealthChecks("/healthz");
app.MapGet("/api/info", () => Results.Ok(new { name = "Phos.Sync", version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0" }));

app.UseHttpsRedirection();
app.UseSerilogRequestLogging();

await app.RunAsync();
