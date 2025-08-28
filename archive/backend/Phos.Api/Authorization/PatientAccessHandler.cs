using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Phos.Api.Authorization
{
    public class PatientAccessHandler : AuthorizationHandler<PatientAccessRequirement>
    {
        private readonly IAuthorizationService _authorizationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PatientAccessHandler(IAuthorizationService authorizationService, IHttpContextAccessor httpContextAccessor)
        {
            _authorizationService = authorizationService;
            _httpContextAccessor = httpContextAccessor;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PatientAccessRequirement requirement)
        {
            var user = context.User;
            if (user == null)
            {
                context.Fail();
                return;
            }

            // Check if user meets the ProviderOnly policy
            var providerPolicyResult = await _authorizationService.AuthorizeAsync(user, "ProviderOnly");
            if (providerPolicyResult.Succeeded)
            {
                context.Succeed(requirement);
                return;
            }

            // Check if user is the patient themselves
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
            {
                context.Fail();
                return;
            }

            // Assuming the patient ID is passed as a route parameter named "id" or "patientId"
            var requestedPatientId = httpContext.GetRouteValue("id")?.ToString() ?? httpContext.GetRouteValue("patientId")?.ToString();
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(requestedPatientId) && requestedPatientId.Equals(userIdClaim, System.StringComparison.OrdinalIgnoreCase))
            {
                context.Succeed(requirement);
                return;
            }

            // If neither condition is met, fail the requirement
            context.Fail();
        }
    }
}
