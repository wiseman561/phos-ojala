using Microsoft.AspNetCore.Identity;
using Ojala.Data.Entities;
using Ojala.Identity.Models;
using System;
using System.Threading.Tasks;

namespace Ojala.Identity
{
    public interface IAuthService
    {
        Task<AuthResult> RegisterAsync(RegisterRequest model);
        Task<AuthResult> LoginAsync(LoginRequest model);
        Task<AuthResult> RefreshTokenAsync(string refreshToken);
        Task<bool> LogoutAsync(string userId);
    }

    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
        }

        public async Task<AuthResult> RegisterAsync(RegisterRequest model)
        {
            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "User with this email already exists"
                };
            }

            // Create new user
            var user = new ApplicationUser
            {
                Email = model.Email,
                UserName = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                PhoneNumber = model.PhoneNumber,
                EmailConfirmed = true // For simplicity; in production, implement email confirmation
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "User creation failed",
                    Errors = result.Errors
                };
            }

            // Assign role
            await _userManager.AddToRoleAsync(user, model.Role ?? "Patient");

            // Generate token
            var token = await _tokenService.GenerateJwtToken(user);

            return new AuthResult
            {
                Success = true,
                Token = token,
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            };
        }

        public async Task<AuthResult> LoginAsync(LoginRequest model)
        {
            // Find user by email
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Invalid email or password"
                };
            }

            // Check password
            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Invalid email or password"
                };
            }

            // Generate token
            var token = await _tokenService.GenerateJwtToken(user);

            return new AuthResult
            {
                Success = true,
                Token = token,
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            };
        }

        public async Task<AuthResult> RefreshTokenAsync(string refreshToken)
        {
            // In a real implementation, you would validate the refresh token
            // and issue a new access token if valid

            // This is a simplified implementation
            var principal = _tokenService.ValidateToken(refreshToken);
            if (principal == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Invalid refresh token"
                };
            }

            var userId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Invalid refresh token"
                };
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Generate new token
            var token = await _tokenService.GenerateJwtToken(user);

            return new AuthResult
            {
                Success = true,
                Token = token,
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            };
        }

        public async Task<bool> LogoutAsync(string userId)
        {
            // In a stateless JWT authentication system, there's no server-side logout
            // The client should discard the token

            // However, you could implement token revocation or blacklisting here

            return true;
        }
    }
}
