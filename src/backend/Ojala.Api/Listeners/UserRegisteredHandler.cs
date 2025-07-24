using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Ojala.Contracts.DTOs;
using Ojala.Contracts.Events;
using Ojala.Services.Interfaces;

namespace Ojala.Api.Listeners
{
    /// <summary>
    /// Handles UserRegistered events and creates corresponding patient records
    /// </summary>
    public class UserRegisteredHandler : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<UserRegisteredHandler> _logger;

        public UserRegisteredHandler(
            IServiceProvider serviceProvider,
            ILogger<UserRegisteredHandler> logger)
        {
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var eventBus = scope.ServiceProvider.GetRequiredService<IEventBus>();

                await eventBus.SubscribeAsync<UserRegisteredEvent>(HandleUserRegisteredAsync);

                _logger.LogInformation("UserRegisteredHandler started and listening for events");

                // Keep the service running
                while (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in UserRegisteredHandler");
                throw;
            }
        }

        /// <summary>
        /// Handles UserRegistered events and creates patient records for users with "Patient" role
        /// </summary>
        private async Task HandleUserRegisteredAsync(UserRegisteredEvent @event)
        {
            try
            {
                _logger.LogInformation(
                    "Processing UserRegistered event for user {UserId} with role {Role}",
                    @event.UserId,
                    @event.Role);

                // Only create patient records for users with "Patient" role
                if (!string.Equals(@event.Role, "Patient", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation(
                        "Skipping patient creation for user {UserId} with role {Role}",
                        @event.UserId,
                        @event.Role);
                    return;
                }

                using var scope = _serviceProvider.CreateScope();
                var patientService = scope.ServiceProvider.GetRequiredService<IPatientService>();

                // Create patient record
                var patientCreateDto = new PatientCreateDto
                {
                    FirstName = @event.FirstName,
                    LastName = @event.LastName,
                    Email = @event.Email,
                    DateOfBirth = DateTime.UtcNow.AddYears(-18), // Default to 18 years old, should be updated by user
                    Gender = "Unknown", // Default value, should be updated by user
                    Address = string.Empty, // Default empty, should be updated by user
                    PhoneNumber = string.Empty, // Default empty, should be updated by user
                    EmergencyContactName = string.Empty, // Default empty, should be updated by user
                    EmergencyContactPhone = string.Empty // Default empty, should be updated by user
                };

                var createdPatient = await patientService.CreatePatientAsync(patientCreateDto);

                _logger.LogInformation(
                    "Successfully created patient record {PatientId} for user {UserId}",
                    createdPatient.Id,
                    @event.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to handle UserRegistered event for user {UserId}",
                    @event.UserId);

                // Don't throw here - we want to continue processing other events
                // The failed event can be retried or handled through other mechanisms
            }
        }
    }
}
