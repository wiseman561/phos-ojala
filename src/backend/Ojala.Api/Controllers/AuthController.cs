using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ojala.Identity.Services.Interfaces;
using Ojala.Identity.Models;
using System.Security.Claims;

namespace Ojala.Api.Controllers
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

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var profile = await _authService.GetProfileAsync(User);
            return profile is null ? NotFound() : Ok(profile);
        }
    }
}
