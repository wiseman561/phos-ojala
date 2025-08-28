using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Phos.Api.Controllers;
using Phos.Identity.Services.Interfaces;
using Phos.Identity.Models;
using System.Threading.Tasks;

namespace Phos.Api.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _authService = new();
        private readonly AuthController _sut;

        public AuthControllerTests()
        {
            _sut = new AuthController(_authService.Object);
        }

        [Fact]
        public async Task GetProfile_WhenServiceReturnsNull_ShouldReturnNotFound()
        {
            // Arrange
            _authService.Setup(s => s.GetProfileAsync(It.IsAny<ClaimsPrincipal>()))
                        .ReturnsAsync((ProfileDto)null);

            // Act
            var result = await _sut.GetProfile();

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task GetProfile_WhenServiceReturnsProfile_ShouldReturnOkWithProfile()
        {
            // Arrange
            var dto = new ProfileDto
            {
                Id = "test-id",
                Email = "test@example.com",
                Username = "testuser",
                CreatedAt = DateTime.UtcNow
            };
            _authService.Setup(s => s.GetProfileAsync(It.IsAny<ClaimsPrincipal>()))
                        .ReturnsAsync(dto);

            // Act
            var result = await _sut.GetProfile();

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            ok.Value.Should().BeSameAs(dto);
        }
    }
}
