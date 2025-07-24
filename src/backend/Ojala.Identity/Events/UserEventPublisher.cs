using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Ojala.Contracts.Events;
using Ojala.Identity.Models;
using System.Collections.Generic; // Added missing import for Dictionary

namespace Ojala.Identity.Events
{
    /// <summary>
    /// Publishes user-related events to the event bus
    /// </summary>
    public interface IUserEventPublisher
    {
        /// <summary>
        /// Publishes a UserRegistered event when a new user is created
        /// </summary>
        Task PublishUserRegisteredAsync(RegisterRequest request, string userId);
    }

    /// <summary>
    /// Implementation of user event publisher using Redis event bus
    /// </summary>
    public class UserEventPublisher : IUserEventPublisher
    {
        private readonly IEventBus _eventBus;
        private readonly ILogger<UserEventPublisher> _logger;

        public UserEventPublisher(IEventBus eventBus, ILogger<UserEventPublisher> logger)
        {
            _eventBus = eventBus ?? throw new ArgumentNullException(nameof(eventBus));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Publishes a UserRegistered event when a new user is created
        /// </summary>
        public async Task PublishUserRegisteredAsync(RegisterRequest request, string userId)
        {
            try
            {
                var userRegisteredEvent = new UserRegisteredEvent
                {
                    UserId = userId,
                    Email = request.Email,
                    Role = request.Role,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    RegisteredAt = DateTime.UtcNow,
                    Metadata = new Dictionary<string, object>
                    {
                        ["source"] = "Ojala.Identity",
                        ["registrationMethod"] = "web"
                    }
                };

                await _eventBus.PublishAsync(userRegisteredEvent);

                _logger.LogInformation(
                    "Published UserRegistered event for user {UserId} with role {Role}",
                    userId,
                    request.Role);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to publish UserRegistered event for user {UserId}",
                    userId);

                // Don't throw here - we don't want user registration to fail if event publishing fails
                // The event can be retried or handled through other mechanisms
            }
        }
    }
}
