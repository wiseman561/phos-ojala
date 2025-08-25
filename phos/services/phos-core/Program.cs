using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHealthChecks();

builder.Services.AddHostedService<NatsWorker>();

var app = builder.Build();

app.MapGet("/api/recommendations", (string userId) => Results.Ok(new object[] {
    new { id = "rec-1", userId, category = "nutrition", title = "Increase fiber intake" },
    new { id = "rec-2", userId, category = "sleep", title = "Aim for 7-8 hours nightly" }
}));

app.MapHealthChecks("/healthz");

await app.RunAsync();
