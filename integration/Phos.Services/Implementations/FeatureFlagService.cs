using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Phos.Services.Implementations
{
    /// <summary>
    /// Implementation of feature flag service using Redis
    /// </summary>
    public class FeatureFlagService : IFeatureFlagService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly ILogger<FeatureFlagService> _logger;
        private readonly string _keyPrefix;
        private readonly bool _fallbackValue;

        public FeatureFlagService(
            IConnectionMultiplexer redis,
            ILogger<FeatureFlagService> logger,
            IConfiguration configuration)
        {
            _redis = redis;
            _logger = logger;
            _keyPrefix = configuration["FeatureFlags:KeyPrefix"] ?? "feature:";
            _fallbackValue = bool.TryParse(configuration["FeatureFlags:DefaultValue"], out bool defaultValue) ? defaultValue : false;
        }

        /// <inheritdoc />
        public async Task<bool> IsEnabledAsync(string featureName)
        {
            try
            {
                var db = _redis.GetDatabase();
                string key = $"{_keyPrefix}{featureName}";
                
                RedisValue value = await db.StringGetAsync(key);
                
                if (value.IsNull)
                {
                    _logger.LogInformation("Feature flag {FeatureName} not found, using fallback value {FallbackValue}", 
                        featureName, _fallbackValue);
                    return _fallbackValue;
                }
                
                if (bool.TryParse(value, out bool enabled))
                {
                    return enabled;
                }
                
                _logger.LogWarning("Feature flag {FeatureName} has invalid value {Value}, using fallback value {FallbackValue}", 
                    featureName, value, _fallbackValue);
                return _fallbackValue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking feature flag {FeatureName}, using fallback value {FallbackValue}", 
                    featureName, _fallbackValue);
                return _fallbackValue;
            }
        }

        /// <inheritdoc />
        public async Task<bool> IsEnabledForUserAsync(string featureName, string userId)
        {
            try
            {
                // First check if the feature is globally enabled
                if (await IsEnabledAsync(featureName))
                {
                    return true;
                }
                
                // Then check if it's enabled for this specific user
                var db = _redis.GetDatabase();
                string key = $"{_keyPrefix}{featureName}:users";
                
                bool isMember = await db.SetContainsAsync(key, userId);
                
                return isMember;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking feature flag {FeatureName} for user {UserId}, using fallback value {FallbackValue}", 
                    featureName, userId, _fallbackValue);
                return _fallbackValue;
            }
        }

        /// <inheritdoc />
        public async Task<bool> IsEnabledForRoleAsync(string featureName, string role)
        {
            try
            {
                // First check if the feature is globally enabled
                if (await IsEnabledAsync(featureName))
                {
                    return true;
                }
                
                // Then check if it's enabled for this specific role
                var db = _redis.GetDatabase();
                string key = $"{_keyPrefix}{featureName}:roles";
                
                bool isMember = await db.SetContainsAsync(key, role);
                
                return isMember;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking feature flag {FeatureName} for role {Role}, using fallback value {FallbackValue}", 
                    featureName, role, _fallbackValue);
                return _fallbackValue;
            }
        }

        /// <inheritdoc />
        public async Task<Dictionary<string, bool>> GetAllFlagsAsync()
        {
            try
            {
                var db = _redis.GetDatabase();
                var result = new Dictionary<string, bool>();
                
                var server = _redis.GetServer(_redis.GetEndPoints()[0]);
                var keys = server.Keys(pattern: $"{_keyPrefix}*");
                
                foreach (var key in keys)
                {
                    string keyString = key.ToString();
                    
                    // Skip user and role specific keys
                    if (keyString.Contains(":users") || keyString.Contains(":roles"))
                    {
                        continue;
                    }
                    
                    string featureName = keyString.Substring(_keyPrefix.Length);
                    RedisValue value = await db.StringGetAsync(keyString);
                    
                    if (!value.IsNull && bool.TryParse(value, out bool enabled))
                    {
                        result[featureName] = enabled;
                    }
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all feature flags");
                return new Dictionary<string, bool>();
            }
        }

        /// <inheritdoc />
        public async Task SetFlagAsync(string featureName, bool enabled)
        {
            try
            {
                var db = _redis.GetDatabase();
                string key = $"{_keyPrefix}{featureName}";
                
                await db.StringSetAsync(key, enabled.ToString());
                
                _logger.LogInformation("Feature flag {FeatureName} set to {Enabled}", featureName, enabled);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting feature flag {FeatureName} to {Enabled}", featureName, enabled);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task EnableForUserAsync(string featureName, string userId)
        {
            try
            {
                var db = _redis.GetDatabase();
                string key = $"{_keyPrefix}{featureName}:users";
                
                await db.SetAddAsync(key, userId);
                
                _logger.LogInformation("Feature flag {FeatureName} enabled for user {UserId}", featureName, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enabling feature flag {FeatureName} for user {UserId}", featureName, userId);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task DisableForUserAsync(string featureName, string userId)
        {
            try
            {
                var db = _redis.GetDatabase();
                string key = $"{_keyPrefix}{featureName}:users";
                
                await db.SetRemoveAsync(key, userId);
                
                _logger.LogInformation("Feature flag {FeatureName} disabled for user {UserId}", featureName, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disabling feature flag {FeatureName} for user {UserId}", featureName, userId);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task EnableForRoleAsync(string featureName, string role)
        {
            try
            {
                var db = _redis.GetDatabase();
                string key = $"{_keyPrefix}{featureName}:roles";
                
                await db.SetAddAsync(key, role);
                
                _logger.LogInformation("Feature flag {FeatureName} enabled for role {Role}", featureName, role);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enabling feature flag {FeatureName} for role {Role}", featureName, role);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task DisableForRoleAsync(string featureName, string role)
        {
            try
            {
                var db = _redis.GetDatabase();
                string key = $"{_keyPrefix}{featureName}:roles";
                
                await db.SetRemoveAsync(key, role);
                
                _logger.LogInformation("Feature flag {FeatureName} disabled for role {Role}", featureName, role);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disabling feature flag {FeatureName} for role {Role}", featureName, role);
                throw;
            }
        }
    }
}
