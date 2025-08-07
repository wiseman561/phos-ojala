using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Phos.Services.Interfaces;
using Phos.Services.Models;
using System.Threading.Tasks;

namespace Phos.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ApiVersion("1.0")]
    public class AuthBridgeController : ControllerBase
    {
        private readonly IIdentityBridgeService _identityBridgeService;
        private readonly IUserService _userService;

        public AuthBridgeController(
            IIdentityBridgeService identityBridgeService,
            IUserService userService)
        {
            _identityBridgeService = identityBridgeService;
            _userService = userService;
        }

        /// <summary>
        /// Bridge login endpoint that accepts legacy authentication and returns new JWT
        /// </summary>
        /// <param name="request">Legacy authentication request</param>
        /// <returns>JWT token for the new system</returns>
        [HttpPost("bridge-login")]
        [AllowAnonymous]
        public async Task<IActionResult> BridgeLogin([FromBody] LegacyAuthRequest request)
        {
            // Validate legacy token or credentials
            var validationResult = await _identityBridgeService.ValidateLegacyAuth(request.LegacyToken, request.Username, request.Password);
            
            if (!validationResult.IsValid)
            {
                return Unauthorized(new { message = "Invalid legacy authentication" });
            }

            // Get or create user in the new system
            var user = await _identityBridgeService.GetOrCreateUserFromLegacy(validationResult.UserId, validationResult.UserClaims);
            
            if (user == null)
            {
                return BadRequest(new { message = "Failed to create or retrieve user" });
            }

            // Generate JWT token for the new system
            var token = await _userService.GenerateJwtToken(user);
            
            return Ok(new 
            { 
                token = token,
                userId = user.Id,
                username = user.Username,
                roles = user.Roles
            });
        }

        /// <summary>
        /// Validates a legacy token and returns user information
        /// </summary>
        /// <param name="request">Legacy token validation request</param>
        /// <returns>User information if token is valid</returns>
        [HttpPost("validate-legacy-token")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateLegacyToken([FromBody] LegacyTokenValidationRequest request)
        {
            var validationResult = await _identityBridgeService.ValidateLegacyToken(request.LegacyToken);
            
            if (!validationResult.IsValid)
            {
                return Unauthorized(new { message = "Invalid legacy token" });
            }
            
            return Ok(new
            {
                isValid = true,
                userId = validationResult.UserId,
                claims = validationResult.UserClaims
            });
        }

        /// <summary>
        /// Migrates a user from the legacy system to the new system
        /// </summary>
        /// <param name="request">User migration request</param>
        /// <returns>Result of the migration</returns>
        [HttpPost("migrate-user")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> MigrateUser([FromBody] UserMigrationRequest request)
        {
            var result = await _identityBridgeService.MigrateUserFromLegacy(request.LegacyUserId);
            
            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }
            
            return Ok(new
            {
                success = true,
                newUserId = result.NewUserId,
                message = "User successfully migrated"
            });
        }
    }
}
