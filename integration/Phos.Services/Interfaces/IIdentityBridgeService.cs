using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Phos.Services.Models;

namespace Phos.Services.Interfaces
{
    /// <summary>
    /// Interface for the identity bridge service that connects legacy and new authentication systems
    /// </summary>
    public interface IIdentityBridgeService
    {
        /// <summary>
        /// Validates legacy authentication using token or username/password
        /// </summary>
        /// <param name="legacyToken">Legacy token (optional)</param>
        /// <param name="username">Username (optional if token provided)</param>
        /// <param name="password">Password (optional if token provided)</param>
        /// <returns>Validation result with user information if valid</returns>
        Task<LegacyAuthValidationResult> ValidateLegacyAuth(string legacyToken, string username, string password);

        /// <summary>
        /// Validates a legacy token
        /// </summary>
        /// <param name="legacyToken">Legacy token to validate</param>
        /// <returns>Validation result with user information if valid</returns>
        Task<LegacyAuthValidationResult> ValidateLegacyToken(string legacyToken);

        /// <summary>
        /// Gets or creates a user in the new system based on legacy user information
        /// </summary>
        /// <param name="legacyUserId">Legacy user ID</param>
        /// <param name="userClaims">User claims from legacy system</param>
        /// <returns>User object in the new system</returns>
        Task<User> GetOrCreateUserFromLegacy(string legacyUserId, Dictionary<string, string> userClaims);

        /// <summary>
        /// Migrates a user from the legacy system to the new system
        /// </summary>
        /// <param name="legacyUserId">Legacy user ID to migrate</param>
        /// <returns>Migration result</returns>
        Task<UserMigrationResult> MigrateUserFromLegacy(string legacyUserId);

        /// <summary>
        /// Maps legacy roles to new system roles
        /// </summary>
        /// <param name="legacyRoles">Collection of legacy role names</param>
        /// <returns>Collection of new system role names</returns>
        IEnumerable<string> MapLegacyRolesToNewRoles(IEnumerable<string> legacyRoles);
    }
}
