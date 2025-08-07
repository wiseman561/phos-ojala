using System;
using System.Threading.Tasks;
using Xunit;
using Phos.Contracts.Events;
using Phos.Common.Events;
using Microsoft.Extensions.Logging;
using Moq;
using StackExchange.Redis;
using System.Collections.Generic;

namespace Phos.Tests
{
    public class EventDrivenArchitectureTest
    {
        [Fact]
        public void UserRegisteredEvent_ShouldHaveCorrectProperties()
        {
            // Arrange
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
        public void IEventBus_ShouldDefineCorrectInterface()
        {
            // This test verifies that our interface is correctly defined
            Assert.True(typeof(IEventBus).IsInterface);

            var methods = typeof(IEventBus).GetMethods();
            Assert.Equal(2, methods.Length);

            // Check for PublishAsync method
            var publishMethod = typeof(IEventBus).GetMethod("PublishAsync");
            Assert.NotNull(publishMethod);
            Assert.True(publishMethod.IsGenericMethod);

            // Check for SubscribeAsync method
            var subscribeMethod = typeof(IEventBus).GetMethod("SubscribeAsync");
            Assert.NotNull(subscribeMethod);
            Assert.True(subscribeMethod.IsGenericMethod);
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
                    ["source"] = "test",
                    ["version"] = "1.0"
                }
            };

            // Act
            var json = System.Text.Json.JsonSerializer.Serialize(@event);
            var deserializedEvent = System.Text.Json.JsonSerializer.Deserialize<UserRegisteredEvent>(json);

            // Assert
            Assert.NotNull(deserializedEvent);
            Assert.Equal(@event.UserId, deserializedEvent.UserId);
            Assert.Equal(@event.Email, deserializedEvent.Email);
            Assert.Equal(@event.Role, deserializedEvent.Role);
            Assert.Equal(@event.FirstName, deserializedEvent.FirstName);
            Assert.Equal(@event.LastName, deserializedEvent.LastName);
        }
    }
}
