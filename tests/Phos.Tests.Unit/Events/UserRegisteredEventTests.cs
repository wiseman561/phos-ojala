using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using Phos.Contracts.Events;
using Phos.Common.Events;
using StackExchange.Redis;
using Xunit;
using System.Collections.Generic;

namespace Phos.Tests.Unit.Events
{
    public class UserRegisteredEventTests
    {
        private readonly Mock<IConnectionMultiplexer> _mockRedis;
        private readonly Mock<ISubscriber> _mockSubscriber;
        private readonly Mock<ILogger<RedisEventBus>> _mockLogger;

        public UserRegisteredEventTests()
        {
            _mockRedis = new Mock<IConnectionMultiplexer>();
            _mockSubscriber = new Mock<ISubscriber>();
            _mockLogger = new Mock<ILogger<RedisEventBus>>();

            _mockRedis.Setup(r => r.GetSubscriber()).Returns(_mockSubscriber.Object);
        }

        [Fact]
        public void UserRegisteredEvent_ShouldHaveRequiredProperties()
        {
            // Arrange & Act
            var @event = new UserRegisteredEvent
            {
                UserId = "user123",
                Email = "test@example.com",
                Role = "Patient",
                FirstName = "John",
                LastName = "Doe",
                RegisteredAt = DateTime.UtcNow
            };

            // Assert
            Assert.Equal("user123", @event.UserId);
            Assert.Equal("test@example.com", @event.Email);
            Assert.Equal("Patient", @event.Role);
            Assert.Equal("John", @event.FirstName);
            Assert.Equal("Doe", @event.LastName);
            Assert.NotNull(@event.Metadata);
        }

        [Fact]
        public async Task RedisEventBus_PublishAsync_ShouldPublishToRedis()
        {
            // Arrange
            var eventBus = new RedisEventBus(_mockRedis.Object, _mockLogger.Object);
            var @event = new UserRegisteredEvent
            {
                UserId = "user123",
                Email = "test@example.com",
                Role = "Patient",
                FirstName = "John",
                LastName = "Doe"
            };

            _mockSubscriber.Setup(s => s.PublishAsync(It.IsAny<RedisChannel>(), It.IsAny<RedisValue>(), It.IsAny<CommandFlags>()))
                .ReturnsAsync(1);

            // Act
            await eventBus.PublishAsync(@event);

            // Assert
            _mockSubscriber.Verify(s => s.PublishAsync(
                It.Is<RedisChannel>(c => c == "events:userregisteredevent"),
                It.IsAny<RedisValue>(),
                It.IsAny<CommandFlags>()), Times.Once);
        }

        [Fact]
        public async Task RedisEventBus_SubscribeAsync_ShouldSubscribeToRedis()
        {
            // Arrange
            var eventBus = new RedisEventBus(_mockRedis.Object, _mockLogger.Object);
            var handlerCalled = false;

            _mockSubscriber.Setup(s => s.SubscribeAsync(It.IsAny<RedisChannel>(), It.IsAny<Action<RedisChannel, RedisValue>>(), It.IsAny<CommandFlags>()))
                .ReturnsAsync(1);

            // Act
            await eventBus.SubscribeAsync<UserRegisteredEvent>(@event =>
            {
                handlerCalled = true;
                return Task.CompletedTask;
            });

            // Assert
            _mockSubscriber.Verify(s => s.SubscribeAsync(
                It.Is<RedisChannel>(c => c == "events:userregisteredevent"),
                It.IsAny<Action<RedisChannel, RedisValue>>(),
                It.IsAny<CommandFlags>()), Times.Once);
        }

        [Fact]
        public void UserRegisteredEvent_ShouldBeSerializable()
        {
            // Arrange
            var @event = new UserRegisteredEvent
            {
                UserId = "user123",
                Email = "test@example.com",
                Role = "Patient",
                FirstName = "John",
                LastName = "Doe",
                RegisteredAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, object>
                {
                    ["source"] = "Phos.Identity",
                    ["registrationMethod"] = "web"
                }
            };

            // Act
            var json = System.Text.Json.JsonSerializer.Serialize(@event);

            // Assert
            Assert.NotNull(json);
            Assert.Contains("user123", json);
            Assert.Contains("test@example.com", json);
            Assert.Contains("Patient", json);
        }
    }
}
