using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Moq;
using Xunit;
using Phos.Identity.Controllers;              // AuthController lives here
using Phos.Identity.Services.Interfaces;     // IAuthService lives here
using Phos.Identity.Models;
using Microsoft.Extensions.Logging;

namespace Phos.Identity.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _authServiceMock;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _authServiceMock = new Mock<IAuthService>();
            _controller = new AuthController(_authServiceMock.Object);
        }

        [Fact]
        public async Task Register_InvalidModelState_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("Email", "Invalid email format");
            var request = new RegisterRequest
            {
                Email = "invalid-email",
                Password = "Password123!",
                FirstName = "Test",
                LastName = "User",
                ConfirmPassword = "Password123!",
                Role = "User"
            };

            var result = await _controller.Register(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.IsAssignableFrom<SerializableError>(badRequest.Value);
        }

        [Fact]
        public async Task Login_InvalidModelState_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("Email", "Required");
            var request = new LoginRequest
            {
                Email = string.Empty,
                Password = "Password123!"
            };

            var result = await _controller.Login(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.IsAssignableFrom<SerializableError>(badRequest.Value);
        }

        [Fact]
        public async Task Refresh_InvalidModelState_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("RefreshToken", "Required");
            var request = new RefreshRequest
            {
                RefreshToken = string.Empty
            };

            var result = await _controller.Refresh(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.IsAssignableFrom<SerializableError>(badRequest.Value);
        }

        [Fact]
        public void Logout_ReturnsNoContent()
        {
            var result = _controller.Logout();
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task Profile_ProfileFound_ReturnsOk()
        {
            // Arrange
            var userId = "123";
            var expectedProfile = new UserDto 
            { 
                Id = userId,
                Email = "test@example.com"
            };
            
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, "testuser")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
            
            _authServiceMock.Setup(x => x.GetUserByIdAsync(userId))
                .ReturnsAsync(expectedProfile);

            // Act
            var result = await _controller.Profile();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedProfile = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal(expectedProfile.Id, returnedProfile.Id);
            Assert.Equal(expectedProfile.Email, returnedProfile.Email);
        }

        [Fact]
        public async Task Profile_ProfileNotFound_ReturnsNotFound()
        {
            // Arrange
            var userId = "123";
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, "testuser")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
            
            _authServiceMock.Setup(x => x.GetUserByIdAsync(userId))
                .ReturnsAsync((UserDto)null!);

            // Act
            var result = await _controller.Profile();

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Profile_UnauthorizedUser_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            // Act
            var result = await _controller.Profile();

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }
    }
}
