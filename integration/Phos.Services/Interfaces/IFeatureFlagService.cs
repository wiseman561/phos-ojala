using System.Collections.Generic;
using System.Threading.Tasks;

namespace Phos.Services.Interfaces
{
    /// <summary>
    /// Interface for feature flag service to control rollout of new features
    /// </summary>
    public interface IFeatureFlagService
    {
        /// <summary>
        /// Checks if a feature is enabled globally
        /// </summary>
        /// <param name="featureName">Name of the feature</param>
        /// <returns>True if the feature is enabled, false otherwise</returns>
        Task<bool> IsEnabledAsync(string featureName);

        /// <summary>
        /// Checks if a feature is enabled for a specific user
        /// </summary>
        /// <param name="featureName">Name of the feature</param>
        /// <param name="userId">User ID</param>
        /// <returns>True if the feature is enabled for the user, false otherwise</returns>
        Task<bool> IsEnabledForUserAsync(string featureName, string userId);

        /// <summary>
        /// Checks if a feature is enabled for a specific role
        /// </summary>
        /// <param name="featureName">Name of the feature</param>
        /// <param name="role">Role name</param>
        /// <returns>True if the feature is enabled for the role, false otherwise</returns>
        Task<bool> IsEnabledForRoleAsync(string featureName, string role);

        /// <summary>
        /// Gets all feature flags and their values
        /// </summary>
        /// <returns>Dictionary of feature names and their enabled status</returns>
        Task<Dictionary<string, bool>> GetAllFlagsAsync();

        /// <summary>
        /// Sets a feature flag value globally
        /// </summary>
        /// <param name="featureName">Name of the feature</param>
        /// <param name="enabled">Whether the feature should be enabled</param>
        Task SetFlagAsync(string featureName, bool enabled);

        /// <summary>
        /// Enables a feature for a specific user
        /// </summary>
        /// <param name="featureName">Name of the feature</param>
        /// <param name="userId">User ID</param>
        Task EnableForUserAsync(string featureName, string userId);

        /// <summary>
        /// Disables a feature for a specific user
        /// </summary>
        /// <param name="featureName">Name of the feature</param>
        /// <param name="userId">User ID</param>
        Task DisableForUserAsync(string featureName, string userId);

        /// <summary>
        /// Enables a feature for a specific role
        /// </summary>
        /// <param name="featureName">Name of the feature</param>
        /// <param name="role">Role name</param>
        Task EnableForRoleAsync(string featureName, string role);

        /// <summary>
        /// Disables a feature for a specific role
        /// </summary>
        /// <param name="featureName">Name of the feature</param>
        /// <param name="role">Role name</param>
        Task DisableForRoleAsync(string featureName, string role);
    }
}
