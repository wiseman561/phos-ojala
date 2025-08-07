using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Phos.Services.Implementations
{
    /// <summary>
    /// LaunchDarkly-based implementation of the feature flag service
    /// </summary>
    public class LaunchDarklyFeatureFlagService : IFeatureFlagService
    {
        private readonly ILogger<LaunchDarklyFeatureFlagService> _logger;
        private readonly string _sdkKey;
        private readonly LaunchDarkly.Client.LdClient _ldClient;

        /// <summary>
        /// Initializes a new instance of the <see cref="LaunchDarklyFeatureFlagService"/> class.
        /// </summary>
        /// <param name="configuration">The configuration.</param>
        /// <param name="logger">The logger.</param>
        public LaunchDarklyFeatureFlagService(
            IConfiguration configuration,
            ILogger<LaunchDarklyFeatureFlagService> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            
            _sdkKey = configuration["LaunchDarkly:SdkKey"];

            if (string.IsNullOrEmpty(_sdkKey))
            {
                // In production, this should throw an exception or log a critical error.
                // Throwing an exception ensures configuration is explicitly provided.
                throw new InvalidOperationException("LaunchDarkly SDK Key is not configured. Please provide LaunchDarkly:SdkKey via configuration (e.g., Vault).");
            }
            
            _ldClient = new LaunchDarkly.Client.LdClient(_sdkKey);
        }

        /// <summary>
        /// Determines if a feature is enabled
        /// </summary>
        /// <param name="featureName">The name of the feature to check</param>
        /// <returns>True if the feature is enabled, false otherwise</returns>
        public Task<bool> IsEnabled(string featureName)
        {
            try
            {
                if (string.IsNullOrEmpty(featureName))
                {
                    throw new ArgumentException("Feature name cannot be null or empty", nameof(featureName));
                }

                // Create a default user context for global checks
                var user = LaunchDarkly.Client.User.WithKey("default-user");
                
                var result = _ldClient.BoolVariation(featureName, user, false);
                
                _logger.LogDebug("Feature flag {FeatureName} is {Status}", featureName, result ? "enabled" : "disabled");
                
                return Task.FromResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if feature {FeatureName} is enabled", featureName);
                return Task.FromResult(false); // Default to disabled on error
            }
        }

        /// <summary>
        /// Determines if a feature is enabled for a specific user
        /// </summary>
        /// <param name="featureName">The name of the feature to check</param>
        /// <param name="userId">The ID of the user</param>
        /// <returns>True if the feature is enabled for the user, false otherwise</returns>
        public Task<bool> IsEnabledForUser(string featureName, string userId)
        {
            try
            {
                if (string.IsNullOrEmpty(featureName))
                {
                    throw new ArgumentException("Feature name cannot be null or empty", nameof(featureName));
                }

                if (string.IsNullOrEmpty(userId))
                {
                    throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
                }

                // Create a user context for the specific user
                var user = LaunchDarkly.Client.User.WithKey(userId);
                
                var result = _ldClient.BoolVariation(featureName, user, false);
                
                _logger.LogDebug("Feature flag {FeatureName} for user {UserId} is {Status}", 
                    featureName, userId, result ? "enabled" : "disabled");
                
                return Task.FromResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if feature {FeatureName} is enabled for user {UserId}", featureName, userId);
                return Task.FromResult(false); // Default to disabled on error
            }
        }

        /// <summary>
        /// Enables a feature
        /// </summary>
        /// <param name="featureName">The name of the feature to enable</param>
        /// <returns>Task representing the asynchronous operation</returns>
        public Task EnableFeature(string featureName)
        {
            _logger.LogWarning("EnableFeature is not supported in LaunchDarkly implementation. Use LaunchDarkly dashboard to enable features.");
            return Task.CompletedTask;
        }

        /// <summary>
        /// Disables a feature
        /// </summary>
        /// <param name="featureName">The name of the feature to disable</param>
        /// <returns>Task representing the asynchronous operation</returns>
        public Task DisableFeature(string featureName)
        {
            _logger.LogWarning("DisableFeature is not supported in LaunchDarkly implementation. Use LaunchDarkly dashboard to disable features.");
            return Task.CompletedTask;
        }

        /// <summary>
        /// Enables a feature for a specific user
        /// </summary>
        /// <param name="featureName">The name of the feature to enable</param>
        /// <param name="userId">The ID of the user</param>
        /// <returns>Task representing the asynchronous operation</returns>
        public Task EnableFeatureForUser(string featureName, string userId)
        {
            _logger.LogWarning("EnableFeatureForUser is not supported in LaunchDarkly implementation. Use LaunchDarkly dashboard to target specific users.");
            return Task.CompletedTask;
        }

        /// <summary>
        /// Disables a feature for a specific user
        /// </summary>
        /// <param name="featureName">The name of the feature to disable</param>
        /// <param name="userId">The ID of the user</param>
        /// <returns>Task representing the asynchronous operation</returns>
        public Task DisableFeatureForUser(string featureName, string userId)
        {
            _logger.LogWarning("DisableFeatureForUser is not supported in LaunchDarkly implementation. Use LaunchDarkly dashboard to target specific users.");
            return Task.CompletedTask;
        }

        /// <summary>
        /// Disposes the LaunchDarkly client
        /// </summary>
        public void Dispose()
        {
            _ldClient?.Dispose();
        }
    }
}
