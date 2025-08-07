using System;
using System.Threading.Tasks;
using System.Security.Claims;
using Phos.Identity.Models;

namespace Phos.Identity.Services.Interfaces
{
    /// <summary>
    /// Interface for authentication-related operations.
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Registers a new user and returns authentication tokens and user info.
        /// </summary>
        Task<AuthResult> RegisterAsync(RegisterRequest request);

        /// <summary>
        /// Logs in an existing user and returns authentication tokens and user info.
        /// </summary>
        Task<AuthResult> LoginAsync(LoginRequest request);

        /// <summary>
        /// Generates a new JWT and refresh token pair based on an existing refresh token.
        /// </summary>
        Task<AuthResult> RefreshTokenAsync(string refreshToken);

        /// <summary>
        /// Retrieves a user profile by their user ID.
        /// </summary>
        Task<UserDto> GetUserByIdAsync(string userId);

        /// <summary>
        /// Retrieves the profile of the currently authenticated user.
        /// </summary>
        /// <param name="user">The claims principal representing the authenticated user.</param>
        /// <returns>The user's profile information, or null if not found.</returns>
        Task<ProfileDto?> GetProfileAsync(ClaimsPrincipal user);

        /// <summary>
        /// Initiates the two-factor authentication process by generating and sending a verification code.
        /// </summary>
        /// <param name="userId">The ID of the user requesting 2FA.</param>
        /// <returns>The ID of the created OTP request.</returns>
        Task<Guid> InitiateTwoFactorAsync(string userId);

        /// <summary>
        /// Completes the two-factor authentication process by verifying the provided code.
        /// </summary>
        /// <param name="requestId">The ID of the OTP request.</param>
        /// <param name="code">The verification code provided by the user.</param>
        /// <returns>The authentication result containing the JWT token.</returns>
        Task<TwoFactorResponseDto> CompleteTwoFactorAsync(Guid requestId, string code);

        /// <summary>
        /// Logs out a user by invalidating their session.
        /// </summary>
        /// <param name="userId">The ID of the user to log out.</param>
        /// <returns>True if logout was successful, false otherwise.</returns>
        Task<bool> LogoutAsync(string userId);
    }
}
