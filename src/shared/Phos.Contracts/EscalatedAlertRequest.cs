using System;

namespace Phos.Contracts.DTOs
{
    /// <summary>
    /// Request payload for escalating an alert.
    /// </summary>
    public class EscalatedAlertRequest
    {
        /// <summary>The ID of the patient the alert pertains to.</summary>
        public string PatientId { get; set; } = default!;
        /// <summary>The ID of the device generating the alert.</summary>
        public string DeviceId { get; set; } = default!;
        /// <summary>The metric name (e.g., "heartRate").</summary>
        public string Metric { get; set; } = default!;
        /// <summary>The measured value.</summary>
        public double Value { get; set; }
        /// <summary>The timestamp of the measurement.</summary>
        public DateTime Timestamp { get; set; }
        /// <summary>The severity level (e.g., "Emergency").</summary>
        public string Severity { get; set; } = default!;
        /// <summary>A human-readable message about the alert.</summary>
        public string Message { get; set; } = default!;
    }
}
