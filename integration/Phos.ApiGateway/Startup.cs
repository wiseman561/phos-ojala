using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Phos.Services.Interfaces;

namespace Phos.ApiGateway
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddOcelot();
            services.AddControllers();
        }

        public async void Configure(IApplicationBuilder app, IFeatureFlagService featureFlagService)
        {
            app.UseRouting();

            // Example of using feature flags to control routing
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGet("/api/health", async context =>
                {
                    await context.Response.WriteAsync("API Gateway is healthy");
                });

                // Dynamic routing based on feature flags
                endpoints.MapGet("/api/route-example/{id}", async context =>
                {
                    var id = context.Request.RouteValues["id"]?.ToString();
                    var useNewApi = await featureFlagService.IsEnabled("UseNewApi");
                    
                    if (useNewApi)
                    {
                        // Route to new API
                        context.Request.Path = $"/api/new/resource/{id}";
                    }
                    else
                    {
                        // Route to legacy API
                        context.Request.Path = $"/api/legacy/resource/{id}";
                    }
                    
                    await context.Response.WriteAsync($"Routing to: {context.Request.Path}");
                });

                // User-specific feature flag example
                endpoints.MapGet("/api/user-features/{userId}", async context =>
                {
                    var userId = context.Request.RouteValues["userId"]?.ToString();
                    var features = new Dictionary<string, bool>();
                    
                    // Check various features for this user
                    features["UseNewDashboard"] = await featureFlagService.IsEnabledForUser("UseNewDashboard", userId);
                    features["EnableAIRecommendations"] = await featureFlagService.IsEnabledForUser("EnableAIRecommendations", userId);
                    features["ShowBetaFeatures"] = await featureFlagService.IsEnabledForUser("ShowBetaFeatures", userId);
                    
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(features);
                });
            });

            // Configure Ocelot with dynamic routing based on feature flags
            var configuration = new OcelotPipelineConfiguration
            {
                PreErrorResponderMiddleware = async (ctx, next) =>
                {
                    // Check if we should use new API endpoints
                    var useNewApi = await featureFlagService.IsEnabled("UseNewApi");
                    
                    // Modify the downstream route if needed
                    if (useNewApi && ctx.HttpContext.Request.Path.StartsWithSegments("/api/patients"))
                    {
                        // Route to new patient API
                        ctx.HttpContext.Request.Path = ctx.HttpContext.Request.Path.ToString().Replace("/api/patients", "/api/new/patients");
                    }
                    
                    await next.Invoke();
                }
            };

            await app.UseOcelot(configuration);
        }
    }
}
