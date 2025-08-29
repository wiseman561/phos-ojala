using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Moq;
using Xunit;
using AutoMapper;

using Phos.Data.Entities;
using Phos.Identity.Models;
using Phos.Identity.Services;              //  ← AuthService implementation
using Phos.Identity.Services.Interfaces;   //  ← ITokenService interface (and IAuthService if needed)
using Phos.Data.Repositories.Interfaces;

namespace Phos.Tests.Unit
{
    // ‑‑‑ Mock classes for Identity ‑‑‑
    public class MockUserManager : UserManager<ApplicationUser>
    {
        public MockUserManager() : base(
            new Mock<IUserStore<ApplicationUser>>().Object,
            null!, null!, null!, null!, null!, null!, null!, null!)
        { }
    }

    public class MockSignInManager : SignInManager<ApplicationUser>
    {
        public MockSignInManager() : base(
            new MockUserManager(),
            new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>().Object,
            new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>().Object,
            null!, null!, null!, null!)
        { }
    }

    public class AuthServiceTests
    {
        private readonly Mock<MockUserManager> _userManagerMock;
        private readonly Mock<MockSignInManager> _signInManagerMock;
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<ILoginOtpRepository> _otpRepositoryMock;
        private readonly Mock<IUserProfileRepository> _userProfileRepositoryMock;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _userManagerMock = new Mock<MockUserManager>();
            _signInManagerMock = new Mock<MockSignInManager>();
            _tokenServiceMock = new Mock<ITokenService>();
            _mapperMock = new Mock<IMapper>();
            _emailServiceMock = new Mock<IEmailService>();
            _otpRepositoryMock = new Mock<ILoginOtpRepository>();
            _userProfileRepositoryMock = new Mock<IUserProfileRepository>();

            _authService = new AuthService(
                _userManagerMock.Object,
                _signInManagerMock.Object,
                _tokenServiceMock.Object,
                _mapperMock.Object,
                _emailServiceMock.Object,
                _otpRepositoryMock.Object,
                _userProfileRepositoryMock.Object
            );
        }

        [Fact]
        public async Task RegisterAsync_WhenUserAlreadyExists_ReturnsFailure()
        {
            var registerRequest = new RegisterRequest { 
                Email = "test@example.com", 
                Password = "Password123!",
                FirstName = "Test",
                LastName = "User",
                ConfirmPassword = "Password123!",
                Role = "User"
            };
            _userManagerMock
                .Setup(um => um.FindByEmailAsync(registerRequest.Email))
                .ReturnsAsync(new ApplicationUser { Email = registerRequest.Email });

            var result = await _authService.RegisterAsync(registerRequest);

            Assert.False(result.Success);
            Assert.Equal("User with this email already exists", result.Message);
            _userManagerMock.Verify(um => um.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task RegisterAsync_WhenPasswordIsWeak_ShouldFail()
        {
            var registerRequest = new RegisterRequest { 
                Email = "new@example.com", 
                Password = "weak",
                FirstName = "Test",
                LastName = "User",
                ConfirmPassword = "weak",
                Role = "User"
            };
            _userManagerMock
                .Setup(um => um.FindByEmailAsync(registerRequest.Email))
                .ReturnsAsync((ApplicationUser)null!);
            _userManagerMock
                .Setup(um => um.CreateAsync(It.IsAny<ApplicationUser>(), registerRequest.Password))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Password too weak" }));

            var result = await _authService.RegisterAsync(registerRequest);

            Assert.False(result.Success);
            Assert.Equal("User creation failed", result.Message);
            Assert.Contains(result.Errors, e => e.Description == "Password too weak");
        }

        [Fact]
        public async Task LoginAsync_WhenUserDoesNotExist_ReturnsFailure()
        {
            var loginRequest = new LoginRequest { Email = "nonexistent@example.com", Password = "Password123!" };
            _userManagerMock
                .Setup(um => um.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync((ApplicationUser)null!);

            var result = await _authService.LoginAsync(loginRequest);

            Assert.False(result.Success);
            Assert.Equal("Invalid email or password", result.Message);
            _signInManagerMock.Verify(
                sm => sm.CheckPasswordSignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), false),
                Times.Never);
        }

        [Fact]
        public async Task LoginAsync_WhenPasswordIsIncorrect_ReturnsFailure()
        {
            var loginRequest = new LoginRequest { Email = "test@example.com", Password = "wrong" };
            var user = new ApplicationUser { Email = loginRequest.Email };
            _userManagerMock
                .Setup(um => um.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);
            _signInManagerMock
                .Setup(sm => sm.CheckPasswordSignInAsync(user, loginRequest.Password, false))
                .ReturnsAsync(SignInResult.Failed);

            var result = await _authService.LoginAsync(loginRequest);

            Assert.False(result.Success);
            Assert.Equal("Invalid email or password", result.Message);
            _tokenServiceMock.Verify(ts => ts.GenerateJwtToken(It.IsAny<ApplicationUser>()), Times.Never);
        }

        [Fact]
        public async Task RefreshTokenAsync_WhenTokenIsInvalid_ReturnsFailure()
        {
            var invalid = "invalid-token";
            _tokenServiceMock
                .Setup(ts => ts.ValidateToken(invalid))
                .Returns((ClaimsPrincipal)null!);

            var result = await _authService.RefreshTokenAsync(invalid);

            Assert.False(result.Success);
            Assert.Equal("Invalid refresh token", result.Message);
        }

        [Fact]
        public async Task RefreshTokenAsync_WhenUserNotFound_ReturnsFailure()
        {
            var token = "valid-refresh-token";
            var userId = "user1";
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

            _tokenServiceMock.Setup(ts => ts.ValidateToken(token)).Returns(principal);
            _userManagerMock.Setup(um => um.FindByIdAsync(userId)).ReturnsAsync((ApplicationUser)null!);

            var result = await _authService.RefreshTokenAsync(token);

            Assert.False(result.Success);
            Assert.Equal("User not found", result.Message);
            _tokenServiceMock.Verify(ts => ts.GenerateJwtToken(It.IsAny<ApplicationUser>()), Times.Never);
        }

        [Fact]
        public async Task InitiateTwoFactorAsync_ValidUser_ReturnsRequestId()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser { Id = userId, Email = "test@example.com" };
            
            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);

            // Act
            var requestId = await _authService.InitiateTwoFactorAsync(userId);

            // Assert
            Assert.NotEqual(Guid.Empty, requestId);
            _otpRepositoryMock.Verify(x => x.CreateAsync(It.Is<LoginOtpRequest>(r => 
                r.UserId == userId && 
                r.ExpiresAt > DateTime.UtcNow)), Times.Once);
            _emailServiceMock.Verify(x => x.SendTwoFactorCodeAsync(user.Email, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task InitiateTwoFactorAsync_InvalidUser_ThrowsException()
        {
            // Arrange
            var userId = "invalid-user-id";
            
            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync((ApplicationUser)null!);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => 
                _authService.InitiateTwoFactorAsync(userId));
        }

        [Fact]
        public async Task CompleteTwoFactorAsync_ValidCode_ReturnsTokens()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var userId = "test-user-id";
            var code = "123456";
            // Manually calculated hash value for "123456" using SHA256
            var hashedCode = "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=";
            var user = new ApplicationUser { Id = userId };
            
            var otpRequest = new LoginOtpRequest
            {
                Id = requestId,
                UserId = userId,
                HashedCode = hashedCode,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5)
            };

            _otpRepositoryMock.Setup(x => x.GetByIdAsync(requestId))
                .ReturnsAsync(otpRequest);
            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _tokenServiceMock.Setup(x => x.GenerateJwtToken(user))
                .ReturnsAsync("jwt-token");
            _tokenServiceMock.Setup(x => x.GenerateRefreshToken(user))
                .ReturnsAsync("refresh-token");

            // Act
            var result = await _authService.CompleteTwoFactorAsync(requestId, code);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("jwt-token", result.Token);
            Assert.Equal("refresh-token", result.RefreshToken);
            _otpRepositoryMock.Verify(x => x.DeleteAsync(requestId), Times.Once);
        }

        [Fact]
        public async Task CompleteTwoFactorAsync_ExpiredCode_ThrowsException()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var otpRequest = new LoginOtpRequest
            {
                Id = requestId,
                UserId = "user-id",
                HashedCode = "hashed-code",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            };

            _otpRepositoryMock.Setup(x => x.GetByIdAsync(requestId))
                .ReturnsAsync(otpRequest);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => 
                _authService.CompleteTwoFactorAsync(requestId, "123456"));
            _otpRepositoryMock.Verify(x => x.DeleteAsync(requestId), Times.Once);
        }

        [Fact]
        public async Task CompleteTwoFactorAsync_InvalidCode_ThrowsException()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var otpRequest = new LoginOtpRequest
            {
                Id = requestId,
                HashedCode = "correct-hash",
                UserId = "test-user-id",
                ExpiresAt = DateTime.UtcNow.AddMinutes(5)
            };

            _otpRepositoryMock.Setup(x => x.GetByIdAsync(requestId))
                .ReturnsAsync(otpRequest);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => 
                _authService.CompleteTwoFactorAsync(requestId, "wrong-code"));
            _otpRepositoryMock.Verify(x => x.DeleteAsync(requestId), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_WhenSuccessful_CreatesProfileAndReturnsSuccess()
        {
            // Arrange
            var registerRequest = new RegisterRequest 
            { 
                Email = "test@example.com", 
                Password = "Password123!",
                FirstName = "John",
                LastName = "Doe",
                ConfirmPassword = "Password123!",
                Role = "User"
            };
            
            var user = new ApplicationUser 
            { 
                Id = "test-user-id", 
                Email = registerRequest.Email,
                UserName = registerRequest.Email
            };
            
            _userManagerMock
                .Setup(um => um.FindByEmailAsync(registerRequest.Email))
                .ReturnsAsync((ApplicationUser)null!);
                
            _userManagerMock
                .Setup(um => um.CreateAsync(It.IsAny<ApplicationUser>(), registerRequest.Password))
                .ReturnsAsync(IdentityResult.Success)
                .Callback<ApplicationUser, string>((u, p) => u.Id = user.Id); // Set the ID when created
                
            _tokenServiceMock
                .Setup(ts => ts.GenerateJwtToken(It.IsAny<ApplicationUser>()))
                .ReturnsAsync("test-jwt-token");
                
            UserProfile createdProfile = null!;
            _userProfileRepositoryMock
                .Setup(pr => pr.CreateAsync(It.IsAny<UserProfile>()))
                .ReturnsAsync((UserProfile p) => { createdProfile = p; return p; });

            // Act
            var result = await _authService.RegisterAsync(registerRequest);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Token);
            
            // Verify profile was created with correct data
            _userProfileRepositoryMock.Verify(pr => pr.CreateAsync(It.IsAny<UserProfile>()), Times.Once);
            Assert.NotNull(createdProfile);
            Assert.Equal(user.Id, createdProfile.Id);
            Assert.Equal(registerRequest.FirstName, createdProfile.FirstName);
            Assert.Equal(registerRequest.LastName, createdProfile.LastName);
        }
    }
}
