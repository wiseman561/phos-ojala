using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using Phos.Api.Controllers;
using Phos.Data;
using Phos.Data.Models;
using StackExchange.Redis;
using Phos.Api.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using System.Linq;
using Phos.Contracts.Interfaces;
using static Phos.Api.Controllers.AlertsController;

namespace Phos.Tests.Unit.Controllers
{
    public class AlertsControllerTests
    {
        private readonly Mock<ILogger<AlertsController>> _loggerMock;
        private readonly Mock<IConnectionMultiplexer> _redisMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly Mock<IDatabase> _databaseMock;
        private readonly DbContextOptions<PhosDbContext> _dbOptions;

        public AlertsControllerTests()
        {
            _loggerMock = new Mock<ILogger<AlertsController>>();
            _redisMock = new Mock<IConnectionMultiplexer>();
            _notificationServiceMock = new Mock<INotificationService>();
            _databaseMock = new Mock<IDatabase>();

            // Setup Redis mock
            _redisMock.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
                .Returns(_databaseMock.Object);

            // Setup in-memory database
            _dbOptions = new DbContextOptionsBuilder<PhosDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public async Task EscalateAlert_ValidRequest_Returns201WithId()
        {
            // Arrange
            using var context = new PhosDbContext(_dbOptions);

            var controller = new AlertsController(
                _loggerMock.Object,
                context,
                _redisMock.Object,
                _notificationServiceMock.Object
            );

            // Setup controller context with authenticated user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
                    {
                        new Claim(ClaimTypes.Name, "test-user"),
                        new Claim(ClaimTypes.Role, "nurse")
                    }, "mock"))
                }
            };

            var alertRequest = new EscalatedAlertRequest
            {
                PatientId = "P12345",
                DeviceId = "D6789",
                Metric = "heartRate",
                Value = 125,
                Timestamp = DateTime.UtcNow,
                Severity = "Emergency",
                Message = "EMERGENCY: Heart rate reading of 125 bpm is outside normal range"
            };

            // Act
            var result = await controller.EscalateAlert(alertRequest);

            // Assert
            var createdResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(201, createdResult.StatusCode);
            Assert.NotNull(createdResult.Value);

            // Verify alert was saved to database
            var savedAlert = await context.EscalatedAlerts.FirstOrDefaultAsync();
            Assert.NotNull(savedAlert);
            Assert.Equal(alertRequest.PatientId, savedAlert.PatientId);
            Assert.Equal(alertRequest.Metric, savedAlert.Metric);
            Assert.Equal(alertRequest.Value, savedAlert.Value);
            Assert.Equal(alertRequest.Severity, savedAlert.Severity);
            Assert.False(savedAlert.IsAcknowledged);

            // Verify notification service was called
            _notificationServiceMock.Verify(
                n => n.NotifyOnCallMDsAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>()
                ),
                Times.Once
            );

            // Verify Redis publish was called
            _databaseMock.Verify(
                d => d.PublishAsync(
                    RedisChannel.Literal("emergency-alerts"),
                    It.IsAny<RedisValue>(),
                    CommandFlags.None
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task EscalateAlert_InvalidRequest_ReturnsBadRequest()
        {
            // Arrange
            using var context = new PhosDbContext(_dbOptions);

            var controller = new AlertsController(
                _loggerMock.Object,
                context,
                _redisMock.Object,
                _notificationServiceMock.Object
            );

            // Setup controller context with authenticated user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
                    {
                        new Claim(ClaimTypes.Name, "test-user"),
                        new Claim(ClaimTypes.Role, "nurse")
                    }, "mock"))
                }
            };

            // Invalid request (missing required fields)
            var alertRequest = new EscalatedAlertRequest
            {
                PatientId = null, // Missing PatientId
                DeviceId = "D6789",
                Metric = "heartRate",
                Value = 125,
                Timestamp = DateTime.UtcNow,
                Severity = "Emergency",
                Message = "Test message"
            };
            controller.ModelState.AddModelError("PatientId", "PatientId is required");

            // Act
            var result = await controller.EscalateAlert(alertRequest);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequestResult.StatusCode);

            // Verify database was not updated
            var alertCount = await context.EscalatedAlerts.CountAsync();
            Assert.Equal(0, alertCount);

            // Verify notification service was not called
            _notificationServiceMock.Verify(
                n => n.NotifyOnCallMDsAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>()
                ),
                Times.Never
            );

            // Verify Redis publish was not called
            _databaseMock.Verify(
                d => d.PublishAsync(
                    It.IsAny<RedisChannel>(),
                    It.IsAny<RedisValue>(),
                    CommandFlags.None
                ),
                Times.Never
            );
        }

        [Fact]
        public async Task AcknowledgeAlert_ValidRequest_ReturnsOk()
        {
            // Arrange
            using var context = new PhosDbContext(_dbOptions);

            // Add a test alert to the database
            var alertId = Guid.NewGuid();
            context.EscalatedAlerts.Add(new EscalatedAlert
            {
                Id = alertId,
                PatientId = "P12345",
                DeviceId = "D6789",
                Metric = "heartRate",
                Value = 125,
                Timestamp = DateTime.UtcNow,
                Severity = "Emergency",
                Message = "EMERGENCY: Heart rate reading of 125 bpm is outside normal range",
                CreatedAt = DateTime.UtcNow,
                IsAcknowledged = false
            });
            await context.SaveChangesAsync();

            var controller = new AlertsController(
                _loggerMock.Object,
                context,
                _redisMock.Object,
                _notificationServiceMock.Object
            );

            // Setup controller context with authenticated user
            var userName = "test-doctor";
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
                    {
                        new Claim(ClaimTypes.Name, userName),
                        new Claim(ClaimTypes.Role, "doctor")
                    }, "mock"))
                }
            };

            // Act
            var result = await controller.AcknowledgeAlert(alertId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);

            // Verify alert was updated in database
            var updatedAlert = await context.EscalatedAlerts.FindAsync(alertId);
            Assert.NotNull(updatedAlert);
            Assert.True(updatedAlert.IsAcknowledged);
            Assert.Equal(userName, updatedAlert.AcknowledgedBy);
            Assert.NotNull(updatedAlert.AcknowledgedAt);

            // Verify Redis publish was called
            _databaseMock.Verify(
                d => d.PublishAsync(
                    "alert-acknowledgments",
                    It.IsAny<RedisValue>(),
                    CommandFlags.None
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task AcknowledgeAlert_NonExistentAlert_ReturnsNotFound()
        {
            // Arrange
            using var context = new PhosDbContext(_dbOptions);

            var controller = new AlertsController(
                _loggerMock.Object,
                context,
                _redisMock.Object,
                _notificationServiceMock.Object
            );

            // Setup controller context with authenticated user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
                    {
                        new Claim(ClaimTypes.Name, "test-doctor"),
                        new Claim(ClaimTypes.Role, "doctor")
                    }, "mock"))
                }
            };

            // Non-existent alert ID
            var nonExistentAlertId = Guid.NewGuid();

            // Act
            var result = await controller.AcknowledgeAlert(nonExistentAlertId);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal(404, notFoundResult.StatusCode);

            // Verify Redis publish was not called
            _databaseMock.Verify(
                d => d.PublishAsync(
                    It.IsAny<RedisChannel>(),
                    It.IsAny<RedisValue>(),
                    CommandFlags.None
                ),
                Times.Never
            );
        }

        [Fact]
        public async Task GetActiveAlerts_ReturnsActiveAlerts()
        {
            // Arrange
            using var context = new PhosDbContext(_dbOptions);

            // Add test alerts to the database
            var activeAlertId = Guid.NewGuid();
            var acknowledgedAlertId = Guid.NewGuid();

            context.EscalatedAlerts.AddRange(
                new EscalatedAlert
                {
                    Id = activeAlertId,
                    PatientId = "P12345",
                    DeviceId = "D6789",
                    Metric = "heartRate",
                    Value = 125,
                    Timestamp = DateTime.UtcNow,
                    Severity = "Emergency",
                    Message = "EMERGENCY: Heart rate reading of 125 bpm is outside normal range",
                    CreatedAt = DateTime.UtcNow,
                    IsAcknowledged = false
                },
                new EscalatedAlert
                {
                    Id = acknowledgedAlertId,
                    PatientId = "P67890",
                    DeviceId = "D12345",
                    Metric = "oxygenSaturation",
                    Value = 83,
                    Timestamp = DateTime.UtcNow.AddMinutes(-10),
                    Severity = "Emergency",
                    Message = "EMERGENCY: Oxygen saturation reading of 83% is outside normal range",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-10),
                    IsAcknowledged = true,
                    AcknowledgedAt = DateTime.UtcNow.AddMinutes(-5),
                    AcknowledgedBy = "test-doctor"
                }
            );
            await context.SaveChangesAsync();

            var controller = new AlertsController(
                _loggerMock.Object,
                context,
                _redisMock.Object,
                _notificationServiceMock.Object
            );

            // Setup controller context with authenticated user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
                    {
                        new Claim(ClaimTypes.Name, "test-doctor"),
                        new Claim(ClaimTypes.Role, "doctor")
                    }, "mock"))
                }
            };

            // Act
            var result = await controller.GetActiveAlerts();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);

            var alerts = Assert.IsAssignableFrom<List<EscalatedAlert>>(okResult.Value);
            Assert.Single(alerts);
            Assert.Equal(activeAlertId, alerts[0].Id);
            Assert.False(alerts[0].IsAcknowledged);
        }

        [Fact]
        public async Task GetAllAlerts_ReturnsAllAlerts()
        {
            // Arrange
            using var context = new PhosDbContext(_dbOptions);

            // Add test alerts to the database
            var activeAlertId = Guid.NewGuid();
            var acknowledgedAlertId = Guid.NewGuid();

            context.EscalatedAlerts.AddRange(
                new EscalatedAlert
                {
                    Id = activeAlertId,
                    PatientId = "P12345",
                    DeviceId = "D6789",
                    Metric = "heartRate",
                    Value = 125,
                    Timestamp = DateTime.UtcNow,
                    Severity = "Emergency",
                    Message = "EMERGENCY: Heart rate reading of 125 bpm is outside normal range",
                    CreatedAt = DateTime.UtcNow,
                    IsAcknowledged = false
                },
                new EscalatedAlert
                {
                    Id = acknowledgedAlertId,
                    PatientId = "P67890",
                    DeviceId = "D12345",
                    Metric = "oxygenSaturation",
                    Value = 83,
                    Timestamp = DateTime.UtcNow.AddMinutes(-10),
                    Severity = "Emergency",
                    Message = "EMERGENCY: Oxygen saturation reading of 83% is outside normal range",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-10),
                    IsAcknowledged = true,
                    AcknowledgedAt = DateTime.UtcNow.AddMinutes(-5),
                    AcknowledgedBy = "test-doctor"
                }
            );
            await context.SaveChangesAsync();

            var controller = new AlertsController(
                _loggerMock.Object,
                context,
                _redisMock.Object,
                _notificationServiceMock.Object
            );

            // Setup controller context with authenticated user
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
                    {
                        new Claim(ClaimTypes.Name, "test-doctor"),
                        new Claim(ClaimTypes.Role, "doctor")
                    }, "mock"))
                }
            };

            // Act
            var result = await controller.GetAllAlerts(); // Using default limit

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);

            var alerts = Assert.IsAssignableFrom<List<EscalatedAlert>>(okResult.Value);
            Assert.Equal(2, alerts.Count); // Should return both alerts
            Assert.Contains(alerts, a => a.Id == activeAlertId);
            Assert.Contains(alerts, a => a.Id == acknowledgedAlertId);
            // Verify order (most recent first)
            Assert.Equal(activeAlertId, alerts[0].Id);
            Assert.Equal(acknowledgedAlertId, alerts[1].Id);
        }

        [Fact]
        public async Task GetAllAlerts_WithLimit_ReturnsLimitedAlerts()
        {
            // Arrange
            using var context = new PhosDbContext(_dbOptions);

            // Add multiple test alerts
            context.EscalatedAlerts.AddRange(
                new EscalatedAlert { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddMinutes(-1), IsAcknowledged = false, PatientId = "P1", DeviceId = "D1", Metric = "M1", Value = 1, Timestamp = DateTime.UtcNow.AddMinutes(-1) },
                new EscalatedAlert { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddMinutes(-2), IsAcknowledged = true, PatientId = "P2", DeviceId = "D2", Metric = "M2", Value = 2, Timestamp = DateTime.UtcNow.AddMinutes(-2) },
                new EscalatedAlert { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddMinutes(-3), IsAcknowledged = false, PatientId = "P3", DeviceId = "D3", Metric = "M3", Value = 3, Timestamp = DateTime.UtcNow.AddMinutes(-3) }
            );
            await context.SaveChangesAsync();

            var controller = new AlertsController(
                _loggerMock.Object,
                context,
                _redisMock.Object,
                _notificationServiceMock.Object
            );

            // Setup controller context
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(new Claim[] { new Claim(ClaimTypes.Role, "doctor") }, "mock")) }
            };

            int limit = 2;

            // Act
            var result = await controller.GetAllAlerts(limit);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);

            var alerts = Assert.IsAssignableFrom<List<EscalatedAlert>>(okResult.Value);
            Assert.Equal(limit, alerts.Count); // Should return only the specified limit
            // Verify order (most recent first)
            Assert.True(alerts[0].CreatedAt > alerts[1].CreatedAt);
        }

        // Add more tests for edge cases, error handling, authorization etc. if needed
    }
}

