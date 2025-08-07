using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using Phos.Api;
using Phos.Services.Models;
using System.Net;
using System.Collections.Generic;

namespace Phos.Api.Tests
{
    /// <summary>
    /// Integration tests for the AuthBridgeController using WebApplicationFactory
    /// </summary>
    public class AuthBridgeControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public AuthBridgeControllerTests(WebApplicationFactory<Program> factory)
        {
            // TODO: Configure test services with mock dependencies for isolated testing
            _factory = factory
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        // Configure test services here
                    });
                });
            
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task BridgeLogin_WithValidCredentials_ReturnsToken()
        {
            // Arrange
            var request = new LegacyAuthRequest
            {
                Username = "testuser",
                Password = "testpassword"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/authbridge/bridge-login", content);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<TokenResponse>(responseString, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(result);
            Assert.NotNull(result.Token);
            Assert.NotEmpty(result.Token);
            Assert.NotNull(result.UserId);
            Assert.NotEmpty(result.UserId);
        }

        [Fact]
        public async Task BridgeLogin_WithInvalidCredentials_Returns401Unauthorized()
        {
            // Arrange
            var request = new LegacyAuthRequest
            {
                Username = "invaliduser",
                Password = "invalidpassword"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/authbridge/bridge-login", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            var responseString = await response.Content.ReadAsStringAsync();
            var error = JsonSerializer.Deserialize<ErrorResponse>(responseString,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            Assert.NotNull(error);
            Assert.Equal("Invalid credentials", error.Message);
        }

        [Fact]
        public async Task ValidateLegacyToken_WithValidToken_ReturnsUserInfo()
        {
            // Arrange
            var request = new LegacyTokenValidationRequest
            {
                LegacyToken = "valid-legacy-token"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/authbridge/validate-legacy-token", content);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ValidationResponse>(responseString, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(result);
            Assert.True(result.IsValid);
            Assert.NotNull(result.UserId);
            Assert.NotEmpty(result.UserId);
        }

        [Fact]
        public async Task ValidateLegacyToken_WithInvalidToken_Returns401Unauthorized()
        {
            // Arrange
            var request = new LegacyTokenValidationRequest
            {
                LegacyToken = "invalid-legacy-token"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/authbridge/validate-legacy-token", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            var responseString = await response.Content.ReadAsStringAsync();
            var error = JsonSerializer.Deserialize<ErrorResponse>(responseString,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            Assert.NotNull(error);
            Assert.Equal("Invalid token", error.Message);
        }

        [Fact]
        public async Task MigrateUser_WithValidUserId_ReturnsSuccess()
        {
            // Arrange
            var request = new UserMigrationRequest
            {
                LegacyUserId = "legacy-user-123"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Set up authentication for admin role
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer admin-test-token");

            // Act
            var response = await _client.PostAsync("/api/authbridge/migrate-user", content);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<MigrationResponse>(responseString, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(result);
            Assert.True(result.Success);
            Assert.NotNull(result.NewUserId);
            Assert.NotEmpty(result.NewUserId);
        }

        [Fact]
        public async Task MigrateUser_WithoutAdminRole_Returns403Forbidden()
        {
            // Arrange
            var request = new UserMigrationRequest
            {
                LegacyUserId = "legacy-user-123"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Set up authentication with non-admin token
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer user-test-token");

            // Act
            var response = await _client.PostAsync("/api/authbridge/migrate-user", content);

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
            var responseString = await response.Content.ReadAsStringAsync();
            var error = JsonSerializer.Deserialize<ErrorResponse>(responseString,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            Assert.NotNull(error);
            Assert.Equal("Insufficient permissions", error.Message);
        }

        [Fact]
        public async Task AuthFlow_ValidLegacyToken_ConvertsToNewJwt()
        {
            // Arrange - First validate a legacy token
            var validationRequest = new LegacyTokenValidationRequest
            {
                LegacyToken = "valid-legacy-token"
            };

            var validationContent = new StringContent(
                JsonSerializer.Serialize(validationRequest),
                Encoding.UTF8,
                "application/json");

            // Act - Part 1: Validate the legacy token
            var validationResponse = await _client.PostAsync("/api/authbridge/validate-legacy-token", validationContent);
            
            // Assert - Part 1: Validation successful
            validationResponse.EnsureSuccessStatusCode();
            var validationResult = JsonSerializer.Deserialize<ValidationResponse>(
                await validationResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            Assert.NotNull(validationResult);
            Assert.True(validationResult.IsValid);
            
            // Act - Part 2: Use the validation result to get a new JWT
            var tokenRequest = new TokenRequest
            {
                UserId = validationResult.UserId,
                Claims = validationResult.Claims
            };
            
            var tokenContent = new StringContent(
                JsonSerializer.Serialize(tokenRequest),
                Encoding.UTF8,
                "application/json");
                
            var tokenResponse = await _client.PostAsync("/api/authbridge/issue-token", tokenContent);
            
            // Assert - Part 2: New JWT issued successfully
            tokenResponse.EnsureSuccessStatusCode();
            var tokenResult = JsonSerializer.Deserialize<TokenResponse>(
                await tokenResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            Assert.NotNull(tokenResult);
            Assert.NotNull(tokenResult.Token);
            Assert.NotEmpty(tokenResult.Token);
            Assert.Equal(validationResult.UserId, tokenResult.UserId);
        }

        // Helper classes for deserialization
        private class TokenResponse
        {
            public string Token { get; set; }
            public string UserId { get; set; }
            public string Username { get; set; }
            public string[] Roles { get; set; }
        }

        private class ValidationResponse
        {
            public bool IsValid { get; set; }
            public string UserId { get; set; }
            public Dictionary<string, string> Claims { get; set; }
        }

        private class MigrationResponse
        {
            public bool Success { get; set; }
            public string NewUserId { get; set; }
            public string Message { get; set; }
        }

        private class ErrorResponse
        {
            public string Message { get; set; }
            public string Code { get; set; }
        }

        private class TokenRequest
        {
            public string UserId { get; set; }
            public Dictionary<string, string> Claims { get; set; }
        }
    }
}
