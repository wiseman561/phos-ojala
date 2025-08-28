using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace Phos.Api.Extensions
{
    public static class ServiceRegistrationExtensions
    {
        public static IServiceCollection RegisterAIEngineServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Register AI Engine services
            services.AddHttpClient("AIEngineClient", client =>
            {
                client.BaseAddress = new Uri(configuration["Services:AIEngine:Url"] ?? "http://ai-engine");
                client.DefaultRequestHeaders.Add("Accept", "application/json");
            });

            // Register AI Engine client
            services.AddScoped<Phos.Services.Interfaces.IAIEngineClient, Phos.Api.Services.Implementations.AIEngineClient>();

            // Register health score service
            services.AddScoped<Phos.Services.Interfaces.IHealthScoreService, Phos.Services.Implementations.HealthScoreService>();

            // Register risk assessment service
            services.AddScoped<Phos.Services.Interfaces.IRiskAssessmentService, Phos.Services.Implementations.RiskAssessmentService>();

            // Register forecasting service
            services.AddScoped<Phos.Services.Interfaces.IForecastingService, Phos.Services.Implementations.ForecastingService>();

            return services;
        }

        public static IServiceCollection RegisterNurseAssistantServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Register Nurse Assistant services
            services.AddHttpClient("NurseAssistantClient", client =>
            {
                client.BaseAddress = new Uri(configuration["Services:NurseAssistant:Url"] ?? "http://nurse-assistant");
                client.DefaultRequestHeaders.Add("Accept", "application/json");
            });

            // Register clinical alerts service
            services.AddScoped<Phos.Services.Interfaces.IClinicalAlertService, Phos.Services.Implementations.ClinicalAlertService>();

            // Register recommendations service
            services.AddScoped<Phos.Services.Interfaces.IRecommendationService, Phos.Services.Implementations.RecommendationService>();

            // Register vital signs service
            services.AddScoped<Phos.Services.Interfaces.IVitalSignsService, Phos.Services.Implementations.VitalSignsService>();

            return services;
        }
    }
}
