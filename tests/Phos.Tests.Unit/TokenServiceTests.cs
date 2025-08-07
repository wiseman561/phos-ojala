using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using Phos.Data.Entities;
using Phos.Identity.Services;
using Xunit;

namespace Phos.Tests.Unit
{
    public class TokenServiceTests
    {
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly TokenService _tokenService;

        public TokenServiceTests()
        {
            _configMock = new Mock<IConfiguration>();

            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                Mock.Of<IUserStore<ApplicationUser>>(),
                null!, null!, null!, null!, null!, null!, null!, null!);

            // Minimal JWT settings
            _configMock.Setup(c => c.GetSection("JwtSettings")["Secret"])
                       .Returns("ThisIsASuperSecureKeyOf32Bytes!!");
            _configMock.Setup(c => c.GetSection("JwtSettings")["ExpiryMinutes"])
                       .Returns("30");
            _configMock.Setup(c => c.GetSection("JwtSettings")["Issuer"])
                       .Returns("TestIssuer");
            _configMock.Setup(c => c.GetSection("JwtSettings")["Audience"])
                       .Returns("TestAudience");

            _tokenService = new TokenService(_configMock.Object, _userManagerMock.Object);
        }

        [Fact]
        public async Task GenerateJwtToken_IncludesClaimsAndRoles()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id        = "user123",
                Email     = "test@example.com",
                FirstName = "John",
                LastName  = "Doe"
            };

            var roles = new List<string> { "Admin" };
            _userManagerMock.Setup(um => um.GetRolesAsync(user)).ReturnsAsync(roles);

            // Act
            var token = await _tokenService.GenerateJwtToken(user);
            var jwt   = new JwtSecurityTokenHandler().ReadJwtToken(token);

            // Subject claim
            Assert.Contains(jwt.Claims,
                c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == "user123");

            // Issuer property
            Assert.Equal("TestIssuer", jwt.Issuer);

            // Role claim
            Assert.Contains(jwt.Claims, c =>
                c.Type == ClaimTypes.Role &&
                c.Value.Equals("Admin", StringComparison.OrdinalIgnoreCase));
        }
    }
}
