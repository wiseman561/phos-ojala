using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Ojala.Contracts.DTOs;
using Ojala.Contracts.Events;
using Ojala.Services.Interfaces;
using Ojala.Api.Listeners;
using Xunit;
using System.Collections.Generic;

namespace Ojala.Tests.Integration
{
    public class UserRegistrationIntegrationTests
    {
        private readonly Mock<IServiceProvider> _mockServiceProvider;
        private readonly Mock<IServiceScope> _mockServiceScope;
        private readonly Mock<IServiceScopeFactory> _mockServiceScopeFactory;
        private readonly Mock<IPatientService> _mockPatientService;
        private readonly Mock<IEventBus> _mockEventBus;
        private readonly Mock<ILogger<UserRegisteredHandler>> _mockLogger;

        public UserRegistrationIntegrationTests()
        {
            _mockServiceProvider = new Mock<IServiceProvider>();
            _mockServiceScope = new Mock<IServiceScope>();
            _mockServiceScopeFactory = new Mock<IServiceScopeFactory>();
            _mockPatientService = new Mock<IPatientService>();
            _mockEventBus = new Mock<IEventBus>();
            _mockLogger = new Mock<ILogger<UserRegisteredHandler>>();

            // Setup service provider chain
            _mockServiceScope.Setup(s => s.ServiceProvider).Returns(_mockServiceProvider.Object);
            _mockServiceScopeFactory.Setup(f => f.CreateScope()).Returns(_mockServiceScope.Object);
            _mockServiceProvider.Setup(p => p.GetService(typeof(IServiceScopeFactory)))
                .Returns(_mockServiceScopeFactory.Object);
        }

        [Fact]
        public async Task UserRegisteredHandler_ShouldCreatePatient_WhenRoleIsPatient()
        {
            // Arrange
            var userRegisteredEvent = new UserRegisteredEvent
            {
                UserId = "user123",
                Email = "patient@example.com",
                Role = "Patient",
                FirstName = "John",
                LastName = "Doe",
                RegisteredAt = DateTime.UtcNow
            };

            var expectedPatient = new PatientDto
            {
                Id = "patient456",
                FirstName = "John",
                LastName = "Doe",
                Email = "patient@example.com"
            };

            _mockServiceProvider.Setup(p => p.GetService(typeof(IEventBus)))
                .Returns(_mockEventBus.Object);
            _mockServiceProvider.Setup(p => p.GetService(typeof(IPatientService)))
                .Returns(_mockPatientService.Object);

            _mockPatientService.Setup(s => s.CreatePatientAsync(It.IsAny<PatientCreateDto>()))
                .ReturnsAsync(expectedPatient);

            var handler = new UserRegisteredHandler(_mockServiceProvider.Object, _mockLogger.Object);

            // Act
            await handler.HandleUserRegisteredAsync(userRegisteredEvent);

            // Assert
            _mockPatientService.Verify(s => s.CreatePatientAsync(It.Is<PatientCreateDto>(dto =>
                dto.FirstName == "John" &&
                dto.LastName == "Doe" &&
                dto.Email == "patient@example.com"
            )), Times.Once);
        }

        [Fact]
        public async Task UserRegisteredHandler_ShouldNotCreatePatient_WhenRoleIsNotPatient()
        {
            // Arrange
            var userRegisteredEvent = new UserRegisteredEvent
            {
                UserId = "user123",
                Email = "provider@example.com",
                Role = "Provider",
                FirstName = "Dr",
                LastName = "Smith",
                RegisteredAt = DateTime.UtcNow
            };

            _mockServiceProvider.Setup(p => p.GetService(typeof(IEventBus)))
                .Returns(_mockEventBus.Object);
            _mockServiceProvider.Setup(p => p.GetService(typeof(IPatientService)))
                .Returns(_mockPatientService.Object);

            var handler = new UserRegisteredHandler(_mockServiceProvider.Object, _mockLogger.Object);

            // Act
            await handler.HandleUserRegisteredAsync(userRegisteredEvent);

            // Assert
            _mockPatientService.Verify(s => s.CreatePatientAsync(It.IsAny<PatientCreateDto>()), Times.Never);
        }

        [Fact]
        public async Task UserRegisteredHandler_ShouldHandleExceptions_Gracefully()
        {
            // Arrange
            var userRegisteredEvent = new UserRegisteredEvent
            {
                UserId = "user123",
                Email = "patient@example.com",
                Role = "Patient",
                FirstName = "John",
                LastName = "Doe",
                RegisteredAt = DateTime.UtcNow
            };

            _mockServiceProvider.Setup(p => p.GetService(typeof(IEventBus)))
                .Returns(_mockEventBus.Object);
            _mockServiceProvider.Setup(p => p.GetService(typeof(IPatientService)))
                .Returns(_mockPatientService.Object);

            _mockPatientService.Setup(s => s.CreatePatientAsync(It.IsAny<PatientCreateDto>()))
                .ThrowsAsync(new Exception("Database connection failed"));

            var handler = new UserRegisteredHandler(_mockServiceProvider.Object, _mockLogger.Object);

            // Act & Assert - Should not throw
            await handler.HandleUserRegisteredAsync(userRegisteredEvent);

            // Verify that the exception was logged
            _mockLogger.Verify(l => l.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
        }
    }
}
