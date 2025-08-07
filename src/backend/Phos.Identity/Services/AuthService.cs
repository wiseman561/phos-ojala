// src/backend/Phos.Identity/Services/AuthService.cs

using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Phos.Data.Entities;
using Phos.Data.Repositories.Interfaces;
using Phos.Identity.Models;
using Phos.Identity.Services.Interfaces;
using Phos.Identity.Events;

namespace Phos.Identity.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;
        private readonly ILoginOtpRepository _otpRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IUserEventPublisher _userEventPublisher;
        private const int OTP_EXPIRY_MINUTES = 5;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ITokenService tokenService,
            IMapper mapper,
            IEmailService emailService,
            ILoginOtpRepository otpRepository,
            IUserProfileRepository userProfileRepository,
            IUserEventPublisher userEventPublisher)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _mapper = mapper;
            _emailService = emailService;
            _otpRepository = otpRepository;
            _userProfileRepository = userProfileRepository;
            _userEventPublisher = userEventPublisher;
        }

        public async Task<AuthResult> RegisterAsync(RegisterRequest request)
        {
            var existing = await _userManager.FindByEmailAsync(request.Email);
            if (existing != null)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "User with this email already exists",
                    Errors = new List<IdentityError>()
                };
            }

            var user = new ApplicationUser
            {
                Email = request.Email,
                UserName = request.Email
            };
            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "User creation failed",
                    Errors = createResult.Errors
                };
            }

                        // Create a profile for the new user
            await _userProfileRepository.CreateAsync(new UserProfile
            {
                Id = user.Id,
                FirstName = request.FirstName,
                LastName = request.LastName
            });

            // Publish user registered event
            await _userEventPublisher.PublishUserRegisteredAsync(request, user.Id);

            var jwt = await _tokenService.GenerateJwtToken(user);
            return new AuthResult
            {
                Success = true,
                Message = string.Empty,
                Errors = new List<IdentityError>(),
                Token = jwt,
                RefreshToken = string.Empty,
                User = new UserDto { Id = user.Id, Email = user.Email }
            };
        }

        public async Task<AuthResult> LoginAsync(LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Invalid email or password",
                    Errors = new List<IdentityError>()
                };
            }

            var signInResult = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!signInResult.Succeeded)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Invalid email or password",
                    Errors = new List<IdentityError>()
                };
            }

            var jwt = await _tokenService.GenerateJwtToken(user);
            return new AuthResult
            {
                Success = true,
                Message = string.Empty,
                Errors = new List<IdentityError>(),
                Token = jwt,
                RefreshToken = string.Empty,
                User = new UserDto { Id = user.Id, Email = user.Email }
            };
        }

        public async Task<AuthResult> RefreshTokenAsync(string refreshToken)
        {
            var principal = _tokenService.ValidateToken(refreshToken);
            if (principal == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "Invalid refresh token",
                    Errors = new List<IdentityError>()
                };
            }

            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new AuthResult
                {
                    Success = false,
                    Message = "User not found",
                    Errors = new List<IdentityError>()
                };
            }

            var jwt = await _tokenService.GenerateJwtToken(user);
            return new AuthResult
            {
                Success = true,
                Message = string.Empty,
                Errors = new List<IdentityError>(),
                Token = jwt,
                RefreshToken = string.Empty,
                User = new UserDto { Id = user.Id, Email = user.Email }
            };
        }

        public async Task<UserDto> GetUserByIdAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email
            };
        }

        public async Task<ProfileDto?> GetProfileAsync(ClaimsPrincipal user)
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return null;

            var appUser = await _userManager.FindByIdAsync(userId);
            if (appUser == null)
                return null;

            return new ProfileDto
            {
                Id = appUser.Id,
                Email = appUser.Email,
                Username = appUser.UserName,
                FirstName = appUser.FirstName,
                LastName = appUser.LastName,
                CreatedAt = appUser.LockoutEnd?.UtcDateTime ?? DateTime.UtcNow,
                LastLoginAt = null
            };
        }

        public async Task<Guid> InitiateTwoFactorAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            // Generate 6-digit code
            var code = GenerateOtpCode();
            var hashedCode = HashOtpCode(code);

            // Create OTP request
            var otpRequest = new LoginOtpRequest
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                HashedCode = hashedCode,
                ExpiresAt = DateTime.UtcNow.AddMinutes(OTP_EXPIRY_MINUTES)
            };

            await _otpRepository.CreateAsync(otpRequest);

            // Send email
            await _emailService.SendTwoFactorCodeAsync(user.Email, code);

            return otpRequest.Id;
        }

        public async Task<TwoFactorResponseDto> CompleteTwoFactorAsync(Guid requestId, string code)
        {
            var otpRequest = await _otpRepository.GetByIdAsync(requestId);
            if (otpRequest == null)
                throw new InvalidOperationException("Invalid verification request");

            if (DateTime.UtcNow > otpRequest.ExpiresAt)
            {
                await _otpRepository.DeleteAsync(otpRequest.Id);
                throw new InvalidOperationException("Verification code has expired");
            }

            var hashedCode = HashOtpCode(code);
            if (hashedCode != otpRequest.HashedCode)
            {
                await _otpRepository.DeleteAsync(otpRequest.Id);
                throw new InvalidOperationException("Invalid verification code");
            }

            var user = await _userManager.FindByIdAsync(otpRequest.UserId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            // Generate tokens
            var jwt = await _tokenService.GenerateJwtToken(user);
            var refreshToken = await _tokenService.GenerateRefreshToken(user);

            // Clean up OTP request
            await _otpRepository.DeleteAsync(otpRequest.Id);

            return new TwoFactorResponseDto
            {
                Token = jwt,
                RefreshToken = refreshToken
            };
        }

        private string GenerateOtpCode()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        private string HashOtpCode(string code)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(code));
            return Convert.ToBase64String(hashedBytes);
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
