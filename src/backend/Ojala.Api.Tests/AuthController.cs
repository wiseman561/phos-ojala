using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging; // Added for logging
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Ojala.Identity.Models;
using Ojala.Identity.Services.Interfaces;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Ojala.Identity.Controllers
[ApiController]
[Route("api/[controller]")]            // must be api/Auth
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    // … ctor …

    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await _authService.GetProfileAsync(User);
        return profile is null ? NotFound() : Ok(profile);
    }
}


        /// <summary>
        /// Registers a new user account
        /// </summary>
        /// <param name="request">The registration request containing user details</param>
        /// <returns>Authentication result with tokens and user info</returns>
        /// <response code="200">Returns the authentication result with tokens</response>
        /// <response code="400">If the request is invalid or user already exists</response>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResult), 200)]
        [ProducesResponseType(typeof(SerializableError), 400)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Registration attempt failed due to invalid model state from {IPAddress}", ipAddress);
                return BadRequest(ModelState);
            }

            var result = await _authService.RegisterAsync(request);

            if (!result.Success)
            {
                _logger.LogWarning("Registration failed for user {Email} from {IPAddress}: {Reason}", 
                    request.Email, ipAddress, result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("User {Email} registered successfully from {IPAddress}", 
                request.Email, ipAddress);
            return Ok(result);
        }

        /// <summary>
        /// Logs in a user and initiates two-factor authentication
        /// </summary>
        /// <param name="request">The login credentials</param>
        /// <returns>A request ID for 2FA verification</returns>
        /// <response code="202">Returns the 2FA request ID</response>
        /// <response code="400">If the request is invalid</response>
        /// <response code="401">If the credentials are invalid</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(TwoFactorRequestDto), 202)]
        [ProducesResponseType(typeof(SerializableError), 400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Login attempt failed due to invalid model state for user {Email} from {IPAddress}", 
                    request.Email, ipAddress);
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                _logger.LogWarning("Login failed for non-existent user {Email} from {IPAddress}", 
                    request.Email, ipAddress);
                return Unauthorized(new { Message = "Invalid email or password" });
            }

            var signInResult = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!signInResult.Succeeded)
            {
                _logger.LogWarning("Login failed for user {Email} from {IPAddress}: Invalid password", 
                    request.Email, ipAddress);
                return Unauthorized(new { Message = "Invalid email or password" });
            }

            try
            {
                var requestId = await _authService.InitiateTwoFactorAsync(user.Id);
                _logger.LogInformation("2FA initiated for user {Email} from {IPAddress}", 
                    request.Email, ipAddress);
                return Accepted(new { RequestId = requestId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initiate 2FA for user {Email} from {IPAddress}", 
                    request.Email, ipAddress);
                return StatusCode(500, new { Message = "Failed to initiate two-factor authentication" });
            }
        }

        /// <summary>
        /// Verifies a two-factor authentication code
        /// </summary>
        /// <param name="request">The 2FA verification request</param>
        /// <returns>Authentication tokens</returns>
        /// <response code="200">Returns the authentication tokens</response>
        /// <response code="400">If the request is invalid</response>
        /// <response code="401">If the code is invalid or expired</response>
        [HttpPost("verify-otp")]
        [ProducesResponseType(typeof(TwoFactorResponseDto), 200)]
        [ProducesResponseType(typeof(SerializableError), 400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> VerifyOtp([FromBody] TwoFactorRequestDto request)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("OTP verification failed due to invalid model state from {IPAddress}", ipAddress);
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _authService.CompleteTwoFactorAsync(request.RequestId, request.Code);
                _logger.LogInformation("2FA completed successfully for request {RequestId} from {IPAddress}", 
                    request.RequestId, ipAddress);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("2FA verification failed for request {RequestId} from {IPAddress}: {Message}", 
                    request.RequestId, ipAddress, ex.Message);
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during 2FA verification for request {RequestId} from {IPAddress}", 
                    request.RequestId, ipAddress);
                return StatusCode(500, new { Message = "An unexpected error occurred" });
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest model)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Token refresh attempt failed due to invalid model state from {IPAddress}", ipAddress);
                return BadRequest(ModelState);
            }

            // Note: We don't have username here easily without decoding the expired token, which is complex.
            // Log based on refresh token success/failure.
            var result = await _authService.RefreshTokenAsync(model.RefreshToken);

            if (!result.Success)
            {
                _logger.LogWarning("Token refresh failed from {IPAddress}: {Reason}", ipAddress, result.Message);
                return Unauthorized(result);
            }

            _logger.LogInformation("Token refreshed successfully from {IPAddress}", ipAddress);
            // Avoid logging the new token
            return Ok(result);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest model)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Logout attempt failed due to invalid model state for user {UserId} from {IPAddress}", model.UserId, ipAddress);
                return BadRequest(ModelState);
            }

            var result = await _authService.LogoutAsync(model.UserId);

            if (!result)
            {
                _logger.LogWarning("Logout failed for user {UserId} from {IPAddress}", model.UserId, ipAddress);
                return BadRequest(new { Success = false, Message = "Logout failed" });
            }

            _logger.LogInformation("User {UserId} logged out successfully from {IPAddress}", model.UserId, ipAddress);
            return Ok(new { Success = true, Message = "Logged out successfully" });
        }

        [HttpGet("profile")]
        [Authorize]
        [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProfile()
        {
            var profile = await _authService.GetProfileAsync(User);
            return profile is null ? NotFound() : Ok(profile);
        }
    }
}
