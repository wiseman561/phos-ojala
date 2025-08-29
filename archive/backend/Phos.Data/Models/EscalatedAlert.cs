using System;
using Microsoft.EntityFrameworkCore;

namespace Phos.Data.Models
{
    public class EscalatedAlert
    {
        public Guid Id { get; set; }
        public string PatientId { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public string Metric { get; set; } = string.Empty;
        public double Value { get; set; }
        public DateTime Timestamp { get; set; }
        public string Severity { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
        public string AcknowledgedBy { get; set; } = string.Empty;
    }
}
