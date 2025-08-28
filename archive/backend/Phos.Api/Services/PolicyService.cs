using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Phos.Api.Services
{
    public static class PolicyService
    {
        public static void AddAuthorizationPolicies(this IServiceCollection services)
        {
            services.AddAuthorization(options =>
            {
                // Policy for posting medical records - only Doctor or System roles
                options.AddPolicy("CanPostMedicalRecords", policy =>
                    policy.RequireRole("Doctor", "System"));

                // Policy for viewing patient details - Doctor or Nurse roles
                options.AddPolicy("CanViewPatient", policy =>
                    policy.RequireRole("Doctor", "Nurse"));

                // Policy for patients to view their own data
                options.AddPolicy("CanViewSelf", policy => 
                    policy.RequireAuthenticatedUser().AddRequirements(new SameUserRequirement()));
            });

            // Register the authorization handler
            services.AddSingleton<IAuthorizationHandler, SameUserAuthorizationHandler>();
        }
    }

    // Requirement that the user must be accessing their own data
    public class SameUserRequirement : IAuthorizationRequirement { }

    // Handler for the SameUserRequirement
    public class SameUserAuthorizationHandler : AuthorizationHandler<SameUserRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context, 
            SameUserRequirement requirement)
        {
            // Get the route data from the HttpContext
            var routeData = context.Resource as Microsoft.AspNetCore.Mvc.Filters.AuthorizationFilterContext;
            if (routeData == null)
            {
                return Task.CompletedTask;
            }

            // Try to get the patientId from route data
            var patientId = string.Empty;
            if (routeData.RouteData.Values.TryGetValue("id", out var id))
            {
                patientId = id?.ToString();
            }

            // If the user has the "Patient" role and the patientId matches their user ID, succeed
            if (context.User.IsInRole("Patient"))
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrEmpty(patientId) && patientId == userId)
                {
                    context.Succeed(requirement);
                }
            }

            return Task.CompletedTask;
        }
    }
} 