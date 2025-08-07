using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Phos.Services.Implementations;
using Phos.Services.Interfaces;
using Phos.Services.Models;
using Xunit;

namespace Phos.Tests.Unit
{
    /// <summary>
    /// Unit tests for the IdentityBridgeService
    /// </summary>
    public class IdentityBridgeServiceTests
    {
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IUserService> _mockUserService;
        private readonly Mock<ILogger<IdentityBridgeService>> _mockLogger;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly IdentityBridgeService _identityBridgeService;

        public IdentityBridgeServiceTests()
        {
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockUserService = new Mock<IUserService>();
            _mockLogger = new Mock<ILogger<IdentityBridgeService>>();
            _mockConfiguration = new Mock<IConfiguration>();

            // TODO: Replace mock URL with secrets from Vault
            _mockConfiguration.Setup(c => c["LegacyApi:BaseUrl"]).Returns("https://legacy-api.example.com");
            _mockConfiguration.Setup(c => c["LegacyApi:AuthEndpoint"]).Returns("/auth/validate");
            _mockConfiguration.Setup(c => c["LegacyApi:UserEndpoint"]).Returns("/users");

            _identityBridgeService = new IdentityBridgeService(
                _mockHttpClientFactory.Object,
                _mockUserService.Object,
                _mockLogger.Object,
                _mockConfiguration.Object);
        }

        [Fact]
        public async Task ValidateLegacyToken_ReturnsValidResult_WhenTokenIsValid()
        {
            // Arrange
            var legacyToken = "valid-legacy-token";
            var expectedResponse = new LegacyAuthValidationResult
            {
                IsValid = true,
                UserId = "legacy-user-123",
                UserClaims = new System.Collections.Generic.Dictionary<string, string>
                {
                    { "role", "RN" },
                    { "org", "Hospital A" }
                }
            };

            var mockHttpMessageHandler = SetupMockHttpMessageHandler(
                "/auth/validate",
                System.Net.HttpStatusCode.OK,
                expectedResponse);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://legacy-api.example.com")
            };
            
            _mockHttpClientFactory.Setup(f => f.CreateClient("LegacyApi"))
                .Returns(httpClient);

            // Act
            var result = await _identityBridgeService.ValidateLegacyTokenAsync(legacyToken);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.IsValid);
            Assert.Equal(expectedResponse.UserId, result.UserId);
            Assert.Equal(expectedResponse.UserClaims, result.UserClaims);
        }

        [Fact]
        public async Task ValidateLegacyToken_ReturnsInvalidResult_WhenTokenIsInvalid()
        {
            // Arrange
            var legacyToken = "invalid-legacy-token";
            var expectedResponse = new LegacyAuthValidationResult
            {
                IsValid = false
            };

            var mockHttpMessageHandler = SetupMockHttpMessageHandler(
                "/auth/validate",
                System.Net.HttpStatusCode.OK,
                expectedResponse);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://legacy-api.example.com")
            };
            
            _mockHttpClientFactory.Setup(f => f.CreateClient("LegacyApi"))
                .Returns(httpClient);

            // Act
            var result = await _identityBridgeService.ValidateLegacyTokenAsync(legacyToken);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.IsValid);
        }

        [Fact]
        public async Task ValidateLegacyToken_ReturnsInvalidResult_WhenApiCallFails()
        {
            // Arrange
            var legacyToken = "legacy-token";

            var mockHttpMessageHandler = SetupMockHttpMessageHandler(
                "/auth/validate",
                System.Net.HttpStatusCode.InternalServerError,
                null);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://legacy-api.example.com")
            };
            
            _mockHttpClientFactory.Setup(f => f.CreateClient("LegacyApi"))
                .Returns(httpClient);

            // Act
            var result = await _identityBridgeService.ValidateLegacyTokenAsync(legacyToken);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.IsValid);
            
            // Verify logging
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Failed to validate legacy token")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task MigrateUserAsync_ReturnsSuccess_WhenMigrationSucceeds()
        {
            // Arrange
            var legacyUserId = "legacy-user-123";
            var expectedResponse = new UserMigrationResult
            {
                Success = true,
                NewUserId = "new-user-456",
                Message = "User migrated successfully"
            };

            var mockHttpMessageHandler = SetupMockHttpMessageHandler(
                $"/users/{legacyUserId}/migrate",
                System.Net.HttpStatusCode.OK,
                expectedResponse);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://legacy-api.example.com")
            };
            
            _mockHttpClientFactory.Setup(f => f.CreateClient("LegacyApi"))
                .Returns(httpClient);

            // Act
            var result = await _identityBridgeService.MigrateUserAsync(legacyUserId);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Success);
            Assert.Equal(expectedResponse.NewUserId, result.NewUserId);
            Assert.Equal(expectedResponse.Message, result.Message);
        }

        [Fact]
        public async Task MigrateUserAsync_ReturnsFailure_WhenMigrationFails()
        {
            // Arrange
            var legacyUserId = "legacy-user-123";
            var expectedResponse = new UserMigrationResult
            {
                Success = false,
                ErrorMessage = "User already migrated"
            };

            var mockHttpMessageHandler = SetupMockHttpMessageHandler(
                $"/users/{legacyUserId}/migrate",
                System.Net.HttpStatusCode.BadRequest,
                expectedResponse);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://legacy-api.example.com")
            };
            
            _mockHttpClientFactory.Setup(f => f.CreateClient("LegacyApi"))
                .Returns(httpClient);

            // Act
            var result = await _identityBridgeService.MigrateUserAsync(legacyUserId);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.Success);
            Assert.Equal(expectedResponse.ErrorMessage, result.ErrorMessage);
        }

        [Fact]
        public async Task GetUserAsync_ReturnsUser_WhenUserExists()
        {
            // Arrange
            var legacyUserId = "legacy-user-123";
            var expectedResponse = new User
            {
                Id = legacyUserId,
                Username = "testuser",
                Email = "testuser@example.com",
                FirstName = "Test",
                LastName = "User",
                Roles = new System.Collections.Generic.List<string> { "RN" }
            };

            var mockHttpMessageHandler = SetupMockHttpMessageHandler(
                $"/users/{legacyUserId}",
                System.Net.HttpStatusCode.OK,
                expectedResponse);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://legacy-api.example.com")
            };
            
            _mockHttpClientFactory.Setup(f => f.CreateClient("LegacyApi"))
                .Returns(httpClient);

            // Act
            var result = await _identityBridgeService.GetUserAsync(legacyUserId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedResponse.Id, result.Id);
            Assert.Equal(expectedResponse.Username, result.Username);
            Assert.Equal(expectedResponse.Email, result.Email);
            Assert.Equal(expectedResponse.FirstName, result.FirstName);
            Assert.Equal(expectedResponse.LastName, result.LastName);
            Assert.Equal(expectedResponse.Roles, result.Roles);
        }

        [Fact]
        public async Task GetUserAsync_ReturnsNull_WhenUserDoesNotExist()
        {
            // Arrange
            var legacyUserId = "nonexistent-user";

            var mockHttpMessageHandler = SetupMockHttpMessageHandler(
                $"/users/{legacyUserId}",
                System.Net.HttpStatusCode.NotFound,
                null);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://legacy-api.example.com")
            };
            
            _mockHttpClientFactory.Setup(f => f.CreateClient("LegacyApi"))
                .Returns(httpClient);

            // Act
            var result = await _identityBridgeService.GetUserAsync(legacyUserId);

            // Assert
            Assert.Null(result);
            
            // Verify logging
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("User not found")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        // TODO: Add integration tests with actual HTTP calls to legacy system

        private Mock<HttpMessageHandler> SetupMockHttpMessageHandler<T>(
            string requestUrl,
            System.Net.HttpStatusCode responseStatusCode,
            T responseContent)
        {
            var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            
            mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => req.RequestUri.PathAndQuery.Contains(requestUrl)),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = responseStatusCode,
                    Content = responseContent != null
                        ? new StringContent(System.Text.Json.JsonSerializer.Serialize(responseContent))
                        : null
                });

            return mockHttpMessageHandler;
        }
    }
}
