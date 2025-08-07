using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Phos.Services.Interfaces;
using Phos.Services.Models;

namespace Phos.Services.Implementations
{
    /// <summary>
    /// Implementation of the identity bridge service that connects legacy and new authentication systems
    /// </summary>
    public class IdentityBridgeService : IIdentityBridgeService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IUserService _userService;
        private readonly ILogger<IdentityBridgeService> _logger;
        private readonly IConfiguration _configuration;

        public IdentityBridgeService(
            IHttpClientFactory httpClientFactory,
            IUserService userService,
            ILogger<IdentityBridgeService> logger,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _userService = userService;
            _logger = logger;
            _configuration = configuration;
        }

        /// <inheritdoc />
        public async Task<LegacyAuthValidationResult> ValidateLegacyAuth(string legacyToken, string username, string password)
        {
            try
            {
                // If token is provided, validate it
                if (!string.IsNullOrEmpty(legacyToken))
                {
                    return await ValidateLegacyToken(legacyToken);
                }

                // Otherwise, validate with username and password
                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    return new LegacyAuthValidationResult { IsValid = false };
                }

                var client = _httpClientFactory.CreateClient("LegacyApi");
                
                var content = new StringContent(
                    JsonSerializer.Serialize(new { username, password }),
                    Encoding.UTF8,
                    "application/json");

                var response = await client.PostAsync("/api/auth/login", content);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to validate legacy credentials for user {Username}", username);
                    return new LegacyAuthValidationResult { IsValid = false };
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var authResult = JsonSerializer.Deserialize<LegacyAuthResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (authResult == null || string.IsNullOrEmpty(authResult.Token))
                {
                    return new LegacyAuthValidationResult { IsValid = false };
                }

                // Now validate the token we just received
                return await ValidateLegacyToken(authResult.Token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating legacy authentication");
                return new LegacyAuthValidationResult { IsValid = false };
            }
        }

        /// <inheritdoc />
        public async Task<LegacyAuthValidationResult> ValidateLegacyToken(string legacyToken)
        {
            try
            {
                if (string.IsNullOrEmpty(legacyToken))
                {
                    return new LegacyAuthValidationResult { IsValid = false };
                }

                var client = _httpClientFactory.CreateClient("LegacyApi");
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {legacyToken}");

                var response = await client.GetAsync("/api/auth/validate");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to validate legacy token");
                    return new LegacyAuthValidationResult { IsValid = false };
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var validationResult = JsonSerializer.Deserialize<LegacyTokenValidationResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (validationResult == null || string.IsNullOrEmpty(validationResult.UserId))
                {
                    return new LegacyAuthValidationResult { IsValid = false };
                }

                return new LegacyAuthValidationResult
                {
                    IsValid = true,
                    UserId = validationResult.UserId,
                    UserClaims = validationResult.Claims ?? new Dictionary<string, string>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating legacy token");
                return new LegacyAuthValidationResult { IsValid = false };
            }
        }

        /// <inheritdoc />
        public async Task<User> GetOrCreateUserFromLegacy(string legacyUserId, Dictionary<string, string> userClaims)
        {
            try
            {
                // Check if user already exists in new system
                var existingUser = await _userService.GetUserByLegacyId(legacyUserId);
                if (existingUser != null)
                {
                    _logger.LogInformation("Found existing user for legacy ID {LegacyUserId}", legacyUserId);
                    return existingUser;
                }

                // User doesn't exist, create a new one
                _logger.LogInformation("Creating new user for legacy ID {LegacyUserId}", legacyUserId);

                // Extract user information from claims
                string username = userClaims.TryGetValue("username", out var un) ? un : $"legacy_{legacyUserId}";
                string email = userClaims.TryGetValue("email", out var em) ? em : null;
                string firstName = userClaims.TryGetValue("firstName", out var fn) ? fn : null;
                string lastName = userClaims.TryGetValue("lastName", out var ln) ? ln : null;

                // Extract and map roles
                var legacyRoles = new List<string>();
                if (userClaims.TryGetValue("roles", out var rolesString))
                {
                    legacyRoles = new List<string>(rolesString.Split(','));
                }
                var newRoles = MapLegacyRolesToNewRoles(legacyRoles);

                // Create user in new system
                var newUser = new User
                {
                    Username = username,
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    LegacyUserId = legacyUserId,
                    Roles = new List<string>(newRoles)
                };

                var createdUser = await _userService.CreateUser(newUser);
                return createdUser;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting or creating user from legacy ID {LegacyUserId}", legacyUserId);
                return null;
            }
        }

        /// <inheritdoc />
        public async Task<UserMigrationResult> MigrateUserFromLegacy(string legacyUserId)
        {
            try
            {
                // Check if user already exists in new system
                var existingUser = await _userService.GetUserByLegacyId(legacyUserId);
                if (existingUser != null)
                {
                    return new UserMigrationResult
                    {
                        Success = true,
                        NewUserId = existingUser.Id,
                        Message = "User already migrated"
                    };
                }

                // Get user details from legacy system
                var client = _httpClientFactory.CreateClient("LegacyApi");
                var response = await client.GetAsync($"/api/users/{legacyUserId}");

                if (!response.IsSuccessStatusCode)
                {
                    return new UserMigrationResult
                    {
                        Success = false,
                        ErrorMessage = $"Failed to retrieve user from legacy system: {response.StatusCode}"
                    };
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var legacyUser = JsonSerializer.Deserialize<LegacyUser>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (legacyUser == null)
                {
                    return new UserMigrationResult
                    {
                        Success = false,
                        ErrorMessage = "Failed to deserialize legacy user data"
                    };
                }

                // Map legacy user to new user
                var userClaims = new Dictionary<string, string>
                {
                    { "username", legacyUser.Username },
                    { "email", legacyUser.Email },
                    { "firstName", legacyUser.FirstName },
                    { "lastName", legacyUser.LastName },
                    { "roles", string.Join(",", legacyUser.Roles) }
                };

                var newUser = await GetOrCreateUserFromLegacy(legacyUserId, userClaims);

                if (newUser == null)
                {
                    return new UserMigrationResult
                    {
                        Success = false,
                        ErrorMessage = "Failed to create user in new system"
                    };
                }

                return new UserMigrationResult
                {
                    Success = true,
                    NewUserId = newUser.Id,
                    Message = "User successfully migrated"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error migrating user from legacy ID {LegacyUserId}", legacyUserId);
                return new UserMigrationResult
                {
                    Success = false,
                    ErrorMessage = $"Exception during migration: {ex.Message}"
                };
            }
        }

        /// <inheritdoc />
        public IEnumerable<string> MapLegacyRolesToNewRoles(IEnumerable<string> legacyRoles)
        {
            var roleMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "admin", "Admin" },
                { "administrator", "Admin" },
                { "nurse", "RN" },
                { "rn", "RN" },
                { "doctor", "MD" },
                { "physician", "MD" },
                { "md", "MD" },
                { "employer", "Employer" },
                { "company", "Employer" },
                { "patient", "Patient" },
                { "user", "Patient" }
            };

            var newRoles = new List<string>();
            
            foreach (var legacyRole in legacyRoles)
            {
                if (roleMapping.TryGetValue(legacyRole, out var newRole))
                {
                    newRoles.Add(newRole);
                }
                else
                {
                    // If no mapping exists, keep the original role
                    newRoles.Add(legacyRole);
                }
            }

            // Ensure at least one role is assigned
            if (newRoles.Count == 0)
            {
                newRoles.Add("Patient"); // Default role
            }

            return newRoles;
        }

        // Helper classes for deserialization
        private class LegacyAuthResponse
        {
            public string Token { get; set; }
            public string UserId { get; set; }
        }

        private class LegacyTokenValidationResponse
        {
            public bool IsValid { get; set; }
            public string UserId { get; set; }
            public Dictionary<string, string> Claims { get; set; }
        }

        private class LegacyUser
        {
            public string Id { get; set; }
            public string Username { get; set; }
            public string Email { get; set; }
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public List<string> Roles { get; set; }
        }
    }
}
