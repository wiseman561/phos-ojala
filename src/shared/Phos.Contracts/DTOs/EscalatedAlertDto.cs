using System;

namespace Phos.Contracts.DTOs
{
    public class EscalatedAlertDto
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public string? DeviceId { get; set; } = string.Empty;
        public string? Metric { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public double Value { get; set; }
        public string? Severity { get; set; } = string.Empty;
        public string? Message { get; set; } = string.Empty;
    }
}
