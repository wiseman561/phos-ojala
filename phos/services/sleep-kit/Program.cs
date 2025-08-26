using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

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

app.Run();
