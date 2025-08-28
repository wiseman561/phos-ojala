using System;
using Microsoft.EntityFrameworkCore;

namespace Phos.Data.Models
{
    public class EscalatedAlert
    {
        public Guid Id { get; set; }
        public string PatientId { get; set; }
        public string DeviceId { get; set; }
        public string Metric { get; set; }
        public double Value { get; set; }
        public DateTime Timestamp { get; set; }
        public string Severity { get; set; }
        public string Message { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
        public string AcknowledgedBy { get; set; }
    }
}
