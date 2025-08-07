using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Phos.Data;
using Phos.Data.Models;
using StackExchange.Redis;
using System.Text.Json;
using Phos.Api.Services;

namespace Phos.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class AlertsController : ControllerBase
    {
        private readonly ILogger<AlertsController> _logger;
        private readonly PhosDbContext _dbContext;
        private readonly IConnectionMultiplexer _redis;
        private readonly INotificationService _notificationService;

        public AlertsController(
            ILogger<AlertsController> logger,
            PhosDbContext dbContext,
            IConnectionMultiplexer redis,
            INotificationService notificationService)
        {
            _logger = logger;
            _dbContext = dbContext;
            _redis = redis;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Escalates an emergency alert to on-call MDs
        /// </summary>
        /// <param name="alert">The alert data</param>
        /// <returns>The created alert ID</returns>
        [HttpPost("escalate")]
        [Authorize(Roles = "nurse,system")]
        public async Task<IActionResult> EscalateAlert([FromBody] EscalatedAlertRequest alert)
        {
            try
            {
                // Validate request
                if (alert == null || string.IsNullOrEmpty(alert.PatientId) || 
                    string.IsNullOrEmpty(alert.DeviceId) || string.IsNullOrEmpty(alert.Metric))
                {
                    return BadRequest(new { error = "Invalid alert data" });
                }

                // Create escalated alert record
                var escalatedAlert = new EscalatedAlert
                {
                    Id = Guid.NewGuid(),
                    PatientId = alert.PatientId,
                    DeviceId = alert.DeviceId,
                    Metric = alert.Metric,
                    Value = alert.Value,
                    Timestamp = alert.Timestamp,
                    Severity = alert.Severity,
                    Message = alert.Message,
                    CreatedAt = DateTime.UtcNow,
                    IsAcknowledged = false
                };

                // Save to database
                _dbContext.EscalatedAlerts.Add(escalatedAlert);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation(
                    "Emergency alert escalated for patient {PatientId}, metric {Metric}, value {Value}", 
                    alert.PatientId, alert.Metric, alert.Value);

                // Notify on-call MDs
                await _notificationService.NotifyOnCallMDsAsync(
                    $"EMERGENCY: Patient {alert.PatientId} - {alert.Message}",
                    $"Emergency alert for metric {alert.Metric} with value {alert.Value}. Please check the dashboard immediately."
                );

                // Publish to Redis for real-time streaming
                var db = _redis.GetDatabase();
                var alertJson = JsonSerializer.Serialize(new
                {
                    id = escalatedAlert.Id,
                    patientId = escalatedAlert.PatientId,
                    deviceId = escalatedAlert.DeviceId,
                    metric = escalatedAlert.Metric,
                    value = escalatedAlert.Value,
                    timestamp = escalatedAlert.Timestamp,
                    severity = escalatedAlert.Severity,
                    message = escalatedAlert.Message,
                    createdAt = escalatedAlert.CreatedAt
                });

                await db.PublishAsync("emergency-alerts", alertJson);

                return StatusCode(201, new { id = escalatedAlert.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error escalating alert");
                return StatusCode(500, new { error = "Failed to escalate alert", message = ex.Message });
            }
        }

        /// <summary>
        /// Acknowledges an escalated alert
        /// </summary>
        /// <param name="alertId">The alert ID</param>
        /// <returns>Success status</returns>
        [HttpPost("{alertId}/acknowledge")]
        [Authorize(Roles = "doctor,nurse")]
        public async Task<IActionResult> AcknowledgeAlert(Guid alertId)
        {
            try
            {
                var alert = await _dbContext.EscalatedAlerts.FindAsync(alertId);
                
                if (alert == null)
                {
                    return NotFound(new { error = "Alert not found" });
                }

                // Update alert status
                alert.IsAcknowledged = true;
                alert.AcknowledgedAt = DateTime.UtcNow;
                alert.AcknowledgedBy = User.Identity.Name;

                await _dbContext.SaveChangesAsync();

                _logger.LogInformation(
                    "Alert {AlertId} acknowledged by {User}", 
                    alertId, User.Identity.Name);

                // Publish acknowledgment to Redis
                var db = _redis.GetDatabase();
                var ackJson = JsonSerializer.Serialize(new
                {
                    id = alert.Id,
                    acknowledgedBy = alert.AcknowledgedBy,
                    acknowledgedAt = alert.AcknowledgedAt
                });

                await db.PublishAsync("alert-acknowledgments", ackJson);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging alert {AlertId}", alertId);
                return StatusCode(500, new { error = "Failed to acknowledge alert", message = ex.Message });
            }
        }

        /// <summary>
        /// Gets all active (unacknowledged) escalated alerts
        /// </summary>
        /// <returns>List of active alerts</returns>
        [HttpGet("active")]
        [Authorize(Roles = "doctor,nurse")]
        public async Task<IActionResult> GetActiveAlerts()
        {
            try
            {
                var activeAlerts = await _dbContext.EscalatedAlerts
                    .Where(a => !a.IsAcknowledged)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                return Ok(activeAlerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active alerts");
                return StatusCode(500, new { error = "Failed to retrieve active alerts", message = ex.Message });
            }
        }

        /// <summary>
        /// Gets all alerts (active and acknowledged)
        /// </summary>
        /// <param name="limit">Maximum number of alerts to return</param>
        /// <returns>List of alerts</returns>
        [HttpGet]
        [Authorize(Roles = "doctor,nurse")]
        public async Task<IActionResult> GetAllAlerts([FromQuery] int limit = 100)
        {
            try
            {
                var alerts = await _dbContext.EscalatedAlerts
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(limit)
                    .ToListAsync();

                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alerts");
                return StatusCode(500, new { error = "Failed to retrieve alerts", message = ex.Message });
            }
        }
    }

    public class EscalatedAlertRequest
    {
        public string PatientId { get; set; }
        public string DeviceId { get; set; }
        public string Metric { get; set; }
        public double Value { get; set; }
        public DateTime Timestamp { get; set; }
        public string Severity { get; set; }
        public string Message { get; set; }
    }
}
