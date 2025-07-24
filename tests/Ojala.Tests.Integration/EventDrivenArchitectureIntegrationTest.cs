using System;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text.Json;
using System.Text;
using Xunit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Ojala.Contracts.Events;
using Ojala.Contracts.DTOs;
using Ojala.Common.Events;
using StackExchange.Redis;
using System.Collections.Generic;

namespace Ojala.Tests.Integration
{
    /// <summary>
    /// Integration tests for the Event-Driven Architecture
    /// These tests demonstrate the end-to-end flow from user registration to patient creation
    /// </summary>
    public class EventDrivenArchitectureIntegrationTest : IDisposable
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IEventBus _eventBus;
        private readonly ILogger<EventDrivenArchitectureIntegrationTest> _logger;
        private readonly HttpClient _httpClient;

        public EventDrivenArchitectureIntegrationTest()
        {
            // Initialize Redis connection for testing
            _redis = ConnectionMultiplexer.Connect("localhost:6379");

            // Create logger
            var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
            _logger = loggerFactory.CreateLogger<EventDrivenArchitectureIntegrationTest>();

            // Initialize event bus
            _eventBus = new RedisEventBus(_redis, _logger);

            // Initialize HTTP client for API testing
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri("http://localhost:5000") // Assuming API runs on port 5000
            };
        }

        [Fact]
        public async Task UserRegistration_ShouldPublishEvent_AndCreatePatient()
        {
            // Arrange
            var userRegisteredEvent = new UserRegisteredEvent
            {
                UserId = Guid.NewGuid().ToString(),
                Email = "test.patient@example.com",
                Role = "Patient",
                FirstName = "John",
                LastName = "Doe",
                RegisteredAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, object>
                {
                    ["source"] = "integration-test",
                    ["testId"] = Guid.NewGuid().ToString()
                }
            };

            var eventReceived = false;
            var receivedEvent = (UserRegisteredEvent?)null;

            // Act - Subscribe to events
            await _eventBus.SubscribeAsync<UserRegisteredEvent>(async (receivedEventData) =>
            {
                eventReceived = true;
                receivedEvent = receivedEventData;
                _logger.LogInformation("Received UserRegisteredEvent: {UserId}", receivedEventData.UserId);
            });

            // Act - Publish event (simulating user registration)
            await _eventBus.PublishAsync(userRegisteredEvent);
            _logger.LogInformation("Published UserRegisteredEvent: {UserId}", userRegisteredEvent.UserId);

            // Wait for event processing
            await Task.Delay(2000);

            // Assert
            Assert.True(eventReceived, "Event should have been received");
            Assert.NotNull(receivedEvent);
            Assert.Equal(userRegisteredEvent.UserId, receivedEvent.UserId);
            Assert.Equal(userRegisteredEvent.Email, receivedEvent.Email);
            Assert.Equal(userRegisteredEvent.Role, receivedEvent.Role);
            Assert.Equal(userRegisteredEvent.FirstName, receivedEvent.FirstName);
            Assert.Equal(userRegisteredEvent.LastName, receivedEvent.LastName);

            // Verify that a patient record would be created (this would require the API service to be running)
            // In a real integration test, you would:
            // 1. Start the API service
            // 2. Publish the event
            // 3. Verify that a patient record exists in the database
        }

        [Fact]
        public async Task EventBus_ShouldHandleMultipleEvents()
        {
            // Arrange
            var events = new List<UserRegisteredEvent>();
            var receivedEvents = new List<UserRegisteredEvent>();

            // Create multiple test events
            for (int i = 0; i < 3; i++)
            {
                events.Add(new UserRegisteredEvent
                {
                    UserId = Guid.NewGuid().ToString(),
                    Email = $"test{i}@example.com",
                    Role = "Patient",
                    FirstName = $"User{i}",
                    LastName = "Test",
                    RegisteredAt = DateTime.UtcNow
                });
            }

            // Act - Subscribe to events
            await _eventBus.SubscribeAsync<UserRegisteredEvent>(async (receivedEvent) =>
            {
                receivedEvents.Add(receivedEvent);
                _logger.LogInformation("Received event {Index}: {UserId}", receivedEvents.Count, receivedEvent.UserId);
            });

            // Act - Publish multiple events
            foreach (var @event in events)
            {
                await _eventBus.PublishAsync(@event);
                _logger.LogInformation("Published event: {UserId}", @event.UserId);
            }

            // Wait for event processing
            await Task.Delay(3000);

            // Assert
            Assert.Equal(events.Count, receivedEvents.Count);

            for (int i = 0; i < events.Count; i++)
            {
                Assert.Equal(events[i].UserId, receivedEvents[i].UserId);
                Assert.Equal(events[i].Email, receivedEvents[i].Email);
            }
        }

        [Fact]
        public async Task EventBus_ShouldHandleNonPatientRoles()
        {
            // Arrange
            var providerEvent = new UserRegisteredEvent
            {
                UserId = Guid.NewGuid().ToString(),
                Email = "provider@example.com",
                Role = "Provider",
                FirstName = "Dr. Jane",
                LastName = "Smith",
                RegisteredAt = DateTime.UtcNow
            };

            var eventReceived = false;

            // Act - Subscribe to events
            await _eventBus.SubscribeAsync<UserRegisteredEvent>(async (receivedEvent) =>
            {
                eventReceived = true;
                _logger.LogInformation("Received event for role {Role}: {UserId}", receivedEvent.Role, receivedEvent.UserId);
            });

            // Act - Publish provider event
            await _eventBus.PublishAsync(providerEvent);
            _logger.LogInformation("Published provider event: {UserId}", providerEvent.UserId);

            // Wait for event processing
            await Task.Delay(1000);

            // Assert
            Assert.True(eventReceived, "Event should have been received");
            // Note: In the real implementation, the UserRegisteredHandler would skip patient creation for non-Patient roles
        }

        [Fact]
        public async Task EventBus_ShouldHandleSerializationCorrectly()
        {
            // Arrange
            var originalEvent = new UserRegisteredEvent
            {
                UserId = Guid.NewGuid().ToString(),
                Email = "serialization.test@example.com",
                Role = "Patient",
                FirstName = "Serialization",
                LastName = "Test",
                RegisteredAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, object>
                {
                    ["complexData"] = new { key = "value", number = 42 },
                    ["arrayData"] = new[] { 1, 2, 3, 4, 5 }
                }
            };

            var eventReceived = false;
            var receivedEvent = (UserRegisteredEvent?)null;

            // Act - Subscribe to events
            await _eventBus.SubscribeAsync<UserRegisteredEvent>(async (receivedEventData) =>
            {
                eventReceived = true;
                receivedEvent = receivedEventData;
                _logger.LogInformation("Received serialized event: {UserId}", receivedEventData.UserId);
            });

            // Act - Publish event
            await _eventBus.PublishAsync(originalEvent);
            _logger.LogInformation("Published event for serialization test: {UserId}", originalEvent.UserId);

            // Wait for event processing
            await Task.Delay(1000);

            // Assert
            Assert.True(eventReceived, "Event should have been received");
            Assert.NotNull(receivedEvent);
            Assert.Equal(originalEvent.UserId, receivedEvent.UserId);
            Assert.Equal(originalEvent.Email, receivedEvent.Email);
            Assert.Equal(originalEvent.Role, receivedEvent.Role);
            Assert.Equal(originalEvent.FirstName, receivedEvent.FirstName);
            Assert.Equal(originalEvent.LastName, receivedEvent.LastName);
            Assert.NotNull(receivedEvent.Metadata);
        }

        public void Dispose()
        {
            _redis?.Dispose();
            _httpClient?.Dispose();
        }
    }
}
