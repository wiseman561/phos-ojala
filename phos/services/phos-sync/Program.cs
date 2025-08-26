using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapHealthChecks("/healthz");
app.MapGet("/api/info", () => Results.Ok(new { name = "Phos.Sync", version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0" }));

await app.RunAsync();
