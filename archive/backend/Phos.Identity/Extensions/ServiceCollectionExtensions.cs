using Microsoft.Extensions.DependencyInjection;
using Phos.Data.Repositories.Interfaces;
using Phos.Data.Repositories;
using Phos.Identity.Services;
using Phos.Identity.Services.Interfaces;

namespace Phos.Identity.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddTwoFactorAuthentication(
            this IServiceCollection services)
        {
            services.AddScoped<ILoginOtpRepository, LoginOtpRepository>();
            services.AddScoped<IEmailService, EmailService>();
            
            return services;
        }
    }
} 