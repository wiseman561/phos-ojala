using System;
using System.Threading.Tasks;

namespace Phos.Services.Interfaces
{
    /// <summary>
    /// Interface for feature flag service that determines if features are enabled
    /// </summary>
    public interface IFeatureFlagService
    {
        /// <summary>
        /// Determines if a feature is enabled
        /// </summary>
        /// <param name="featureName">The name of the feature to check</param>
        /// <returns>True if the feature is enabled, false otherwise</returns>
        Task<bool> IsEnabled(string featureName);

        /// <summary>
        /// Determines if a feature is enabled for a specific user
        /// </summary>
        /// <param name="featureName">The name of the feature to check</param>
        /// <param name="userId">The ID of the user</param>
        /// <returns>True if the feature is enabled for the user, false otherwise</returns>
        Task<bool> IsEnabledForUser(string featureName, string userId);

        /// <summary>
        /// Enables a feature
        /// </summary>
        /// <param name="featureName">The name of the feature to enable</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task EnableFeature(string featureName);

        /// <summary>
        /// Disables a feature
        /// </summary>
        /// <param name="featureName">The name of the feature to disable</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task DisableFeature(string featureName);

        /// <summary>
        /// Enables a feature for a specific user
        /// </summary>
        /// <param name="featureName">The name of the feature to enable</param>
        /// <param name="userId">The ID of the user</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task EnableFeatureForUser(string featureName, string userId);

        /// <summary>
        /// Disables a feature for a specific user
        /// </summary>
        /// <param name="featureName">The name of the feature to disable</param>
        /// <param name="userId">The ID of the user</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task DisableFeatureForUser(string featureName, string userId);
    }
}
