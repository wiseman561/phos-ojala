using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

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

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

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
