using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using Phos.Services.Implementations;
using Phos.Services.Interfaces;
using StackExchange.Redis;

namespace Phos.Tests.Unit
{
    /// <summary>
    /// Unit tests for the FeatureFlagService
    /// </summary>
    public class FeatureFlagServiceTests
    {
        private readonly Mock<IConnectionMultiplexer> _mockRedis;
        private readonly Mock<IDatabase> _mockDatabase;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ILogger<RedisFeatureFlagService>> _mockLogger;

        public FeatureFlagServiceTests()
        {
            _mockRedis = new Mock<IConnectionMultiplexer>();
            _mockDatabase = new Mock<IDatabase>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockLogger = new Mock<ILogger<RedisFeatureFlagService>>();

            _mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(_mockDatabase.Object);
            _mockConfiguration.Setup(c => c["FeatureFlags:KeyPrefix"]).Returns("test:feature:");
        }

        [Fact]
        public async Task IsEnabled_ReturnsTrueWhenFeatureIsEnabled()
        {
            // Arrange
            const string featureName = "UseNewApi";
            _mockDatabase
                .Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()))
                .ReturnsAsync("1");

            var service = new RedisFeatureFlagService(_mockRedis.Object, _mockConfiguration.Object, _mockLogger.Object);

            // Act
            var result = await service.IsEnabled(featureName);

            // Assert
            Assert.True(result);
            _mockDatabase.Verify(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()), Times.Once);
        }

        [Fact]
        public async Task IsEnabled_ReturnsFalseWhenFeatureIsDisabled()
        {
            // Arrange
            const string featureName = "UseNewApi";
            _mockDatabase
                .Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()))
                .ReturnsAsync("0");

            var service = new RedisFeatureFlagService(_mockRedis.Object, _mockConfiguration.Object, _mockLogger.Object);

            // Act
            var result = await service.IsEnabled(featureName);

            // Assert
            Assert.False(result);
            _mockDatabase.Verify(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()), Times.Once);
        }

        [Fact]
        public async Task IsEnabled_ReturnsFalseWhenFeatureDoesNotExist()
        {
            // Arrange
            const string featureName = "NonExistentFeature";
            _mockDatabase
                .Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:NonExistentFeature"), It.IsAny<CommandFlags>()))
                .ReturnsAsync(RedisValue.Null);

            var service = new RedisFeatureFlagService(_mockRedis.Object, _mockConfiguration.Object, _mockLogger.Object);

            // Act
            var result = await service.IsEnabled(featureName);

            // Assert
            Assert.False(result);
            _mockDatabase.Verify(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:NonExistentFeature"), It.IsAny<CommandFlags>()), Times.Once);
        }

        [Fact]
        public async Task IsEnabledForUser_ReturnsTrueWhenFeatureIsEnabledGlobally()
        {
            // Arrange
            const string featureName = "UseNewApi";
            const string userId = "user123";
            
            _mockDatabase
                .Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()))
                .ReturnsAsync("1");

            var service = new RedisFeatureFlagService(_mockRedis.Object, _mockConfiguration.Object, _mockLogger.Object);

            // Act
            var result = await service.IsEnabledForUser(featureName, userId);

            // Assert
            Assert.True(result);
            _mockDatabase.Verify(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()), Times.Once);
            // Should not check user-specific flag if global flag is enabled
            _mockDatabase.Verify(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:user:user123:UseNewApi"), It.IsAny<CommandFlags>()), Times.Never);
        }

        [Fact]
        public async Task IsEnabledForUser_ReturnsTrueWhenFeatureIsEnabledForUser()
        {
            // Arrange
            const string featureName = "UseNewApi";
            const string userId = "user123";
            
            _mockDatabase
                .Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()))
                .ReturnsAsync("0");
                
            _mockDatabase
                .Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:user:user123:UseNewApi"), It.IsAny<CommandFlags>()))
                .ReturnsAsync("1");

            var service = new RedisFeatureFlagService(_mockRedis.Object, _mockConfiguration.Object, _mockLogger.Object);

            // Act
            var result = await service.IsEnabledForUser(featureName, userId);

            // Assert
            Assert.True(result);
            _mockDatabase.Verify(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()), Times.Once);
            _mockDatabase.Verify(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:user:user123:UseNewApi"), It.IsAny<CommandFlags>()), Times.Once);
        }

        [Fact]
        public async Task IsEnabledForUser_ReturnsFalseWhenFeatureIsDisabledForUserAndGlobally()
        {
            // Arrange
            const string featureName = "UseNewApi";
            const string userId = "user123";
            
            _mockDatabase
                .Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()))
                .ReturnsAsync("0");
                
            _mockDatabase
                .Setup(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:user:user123:UseNewApi"), It.IsAny<CommandFlags>()))
                .ReturnsAsync("0");

            var service = new RedisFeatureFlagService(_mockRedis.Object, _mockConfiguration.Object, _mockLogger.Object);

            // Act
            var result = await service.IsEnabledForUser(featureName, userId);

            // Assert
            Assert.False(result);
            _mockDatabase.Verify(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"), It.IsAny<CommandFlags>()), Times.Once);
            _mockDatabase.Verify(db => db.StringGetAsync(It.Is<RedisKey>(k => k == "test:feature:user:user123:UseNewApi"), It.IsAny<CommandFlags>()), Times.Once);
        }

        [Fact]
        public async Task EnableFeature_SetsFeatureToEnabled()
        {
            // Arrange
            const string featureName = "UseNewApi";
            
            _mockDatabase
                .Setup(db => db.StringSetAsync(
                    It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"),
                    It.Is<RedisValue>(v => v == "1"),
                    null,
                    It.IsAny<CommandFlags>()))
                .ReturnsAsync(true);

            var service = new RedisFeatureFlagService(_mockRedis.Object, _mockConfiguration.Object, _mockLogger.Object);

            // Act
            await service.EnableFeature(featureName);

            // Assert
            _mockDatabase.Verify(db => db.StringSetAsync(
                It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"),
                It.Is<RedisValue>(v => v == "1"),
                null,
                It.IsAny<CommandFlags>()), 
                Times.Once);
        }

        [Fact]
        public async Task DisableFeature_SetsFeatureToDisabled()
        {
            // Arrange
            const string featureName = "UseNewApi";
            
            _mockDatabase
                .Setup(db => db.StringSetAsync(
                    It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"),
                    It.Is<RedisValue>(v => v == "0"),
                    null,
                    It.IsAny<CommandFlags>()))
                .ReturnsAsync(true);

            var service = new RedisFeatureFlagService(_mockRedis.Object, _mockConfiguration.Object, _mockLogger.Object);

            // Act
            await service.DisableFeature(featureName);

            // Assert
            _mockDatabase.Verify(db => db.StringSetAsync(
                It.Is<RedisKey>(k => k == "test:feature:global:UseNewApi"),
                It.Is<RedisValue>(v => v == "0"),
                null,
                It.IsAny<CommandFlags>()), 
                Times.Once);
        }
    }
}
