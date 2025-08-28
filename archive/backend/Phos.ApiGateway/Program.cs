using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using HealthChecks.Uris;

var builder = WebApplication.CreateBuilder(args);

// 1) Load Ocelot configuration
builder.Configuration.AddJsonFile("ocelot.simple.json", optional: false, reloadOnChange: true);

// 2) Configure JWT Bearer authentication
var jwtSecretKey = builder.Configuration["JwtSettings:SecretKey"] ?? "YOUR_SUPER_SECRET_KEY_HERE_THAT_IS_AT_LEAST_32_CHARACTERS_LONG";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "Phos.Identity";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "Phos.Client";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["JwtSettings:Authority"];
        options.Audience = jwtAudience;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecretKey)
            ),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// 3) Add controllers for health check and swagger proxy
builder.Services.AddControllers();
builder.Services.AddHttpClient();

// 4) Add health checks
builder.Services
  .AddHealthChecks()
  .AddUrlGroup(new Uri("http://phos-api:80/health"), name: "api");

// 5) Add Swagger configuration
builder.Services.AddSwaggerGen(c =>
{
  c.SwaggerDoc("v1", new OpenApiInfo { Title = "Phos API Gateway", Version = "v1" });
  c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
  {
    In = ParameterLocation.Header,
    Description = "Enter 'Bearer <token>'",
    Name = "Authorization",
    Type = SecuritySchemeType.ApiKey
  });
  c.AddSecurityRequirement(new OpenApiSecurityRequirement
  {
    {
      new OpenApiSecurityScheme { Reference = new OpenApiReference
        {
          Type = ReferenceType.SecurityScheme,
          Id = "Bearer"
        }
      },
      new string[] {}
    }
  });
});

// 6) Register Ocelot
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

// 7) Add custom middleware to handle health endpoint before Ocelot
app.Use(async (context, next) =>
{
  if (context.Request.Path == "/health")
  {
    var healthCheckService = context.RequestServices.GetRequiredService<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckService>();
    var result = await healthCheckService.CheckHealthAsync();

    context.Response.ContentType = "application/json";
    await context.Response.WriteAsJsonAsync(new {
      status = result.Status.ToString(),
      results = result.Entries.ToDictionary(
        e => e.Key,
        e => new { status = e.Value.Status.ToString(), description = e.Value.Description }
      )
    });
    return;
  }
  await next();
});

// 8) Middleware pipeline
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Phos API Gateway v1"));

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// Add a simple endpoint for API Gateway info
app.MapGet("/", () => "Phos API Gateway - Routes: /api/patients, /api/appointments, /api/auth, /api/health");

app.MapControllers();

// 9) Run Ocelot (this will handle all other routes)
await app.UseOcelot();

app.Run();
