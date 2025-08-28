using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Phos.Identity.Models;
using Phos.Identity.Services.Interfaces;

namespace Phos.Identity.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(request);
            if (!result.Success)
                return BadRequest(result.Errors);

            return Ok(new
            {
                token = result.Token,
                refreshToken = result.RefreshToken,
                user = result.User
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.LoginAsync(request);
            if (!result.Success)
                return Unauthorized(new { message = result.Message });

            return Ok(new
            {
                token = result.Token,
                refreshToken = result.RefreshToken,
                user = result.User
            });
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> Profile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RefreshTokenAsync(request.RefreshToken);
            if (!result.Success)
                return Unauthorized(new { message = result.Message });

            return Ok(new
            {
                token = result.Token,
                refreshToken = result.RefreshToken
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // No body parameter; simply return 204 No Content
            return NoContent();
        }
    }
}
