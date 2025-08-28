
using System;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using Phos.Data;
using Phos.Data.Models;
using Phos.Contracts.Interfaces; 

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

        [HttpPost("escalate")]
        [Authorize(Roles = "nurse,system")]
        public async Task<IActionResult> EscalateAlert([FromBody] EscalatedAlertRequest alert)
        {
            if (alert == null ||
                string.IsNullOrWhiteSpace(alert.PatientId) ||
                string.IsNullOrWhiteSpace(alert.DeviceId) ||
                string.IsNullOrWhiteSpace(alert.Metric))
            {
                return BadRequest(new { error = "Invalid alert data" });
            }

            var escalatedAlert = new EscalatedAlert
            {
                Id = Guid.NewGuid(),
                PatientId = alert.PatientId,
                DeviceId = alert.DeviceId,
                Metric = alert.Metric,
                Value = alert.Value,
                Timestamp = alert.Timestamp,
                Severity = alert.Severity!,
                Message = alert.Message!,
                CreatedAt = DateTime.UtcNow,
                IsAcknowledged = false
            };

            _dbContext.EscalatedAlerts.Add(escalatedAlert);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation(
                "Emergency alert escalated for patient {PatientId}, metric {Metric}, value {Value}",
                Clean(alert.PatientId),
                Clean(alert.Metric),
                Clean(alert.Value.ToString()));

            await _notificationService.NotifyOnCallMDsAsync(
                $"EMERGENCY: Patient {alert.PatientId} - {alert.Message}",
                $"Emergency alert for metric {alert.Metric} with value {alert.Value}. Please check the dashboard immediately.");

            var db = _redis.GetDatabase();
            await db.PublishAsync("emergency-alerts", JsonSerializer.Serialize(new
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
            }));

            return StatusCode(201, new { id = escalatedAlert.Id });
        }

        [HttpPost("{alertId}/acknowledge")]
        [Authorize(Roles = "doctor,nurse")]
        public async Task<IActionResult> AcknowledgeAlert(Guid alertId)
        {
            var alert = await _dbContext.EscalatedAlerts.FindAsync(alertId);
            if (alert == null) return NotFound(new { error = "Alert not found" });

            alert.IsAcknowledged = true;
            alert.AcknowledgedAt = DateTime.UtcNow;
            alert.AcknowledgedBy = User.Identity?.Name ?? "<unknown>";
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation(
                "Alert {AlertId} acknowledged by {User}",
                Clean(alertId.ToString()),
                Clean(alert.AcknowledgedBy));

            var db = _redis.GetDatabase();
            await db.PublishAsync("alert-acknowledgments", JsonSerializer.Serialize(new
            {
                id = alert.Id,
                acknowledgedBy = alert.AcknowledgedBy,
                acknowledgedAt = alert.AcknowledgedAt
            }));

            return Ok(new { success = true });
        }

        [HttpGet("active")]
        [Authorize(Roles = "doctor,nurse")]
        public async Task<IActionResult> GetActiveAlerts() =>
            Ok(await _dbContext.EscalatedAlerts
                .Where(a => !a.IsAcknowledged)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync());

        [HttpGet]
        [Authorize(Roles = "doctor,nurse")]
        public async Task<IActionResult> GetAllAlerts([FromQuery] int limit = 100) =>
            Ok(await _dbContext.EscalatedAlerts
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .ToListAsync());

        public class EscalatedAlertRequest
        {
            public string? PatientId { get; set; }
            public string? DeviceId { get; set; }
            public string? Metric { get; set; }
            public double Value { get; set; }
            public DateTime Timestamp { get; set; }
            public string? Severity { get; set; }
            public string? Message { get; set; }
        }


        private static readonly Regex _logBreaks = new(@"[\r\n]+", RegexOptions.Compiled);

        private static string Clean(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return "<empty>";

            var sanitized = _logBreaks.Replace(input, string.Empty)
                                      .Replace("\t", "\\t")
                                      .Replace("\\", "\\\\")
                                      .Replace("\"", "\\\"")
                                      .Replace("{", "\\{")
                                      .Replace("}", "\\}");

            return sanitized;
        }
    }
}
