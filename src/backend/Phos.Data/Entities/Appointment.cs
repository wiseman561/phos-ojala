using System;

namespace Phos.Data.Entities
{
    public class Appointment
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public string? ProviderId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public int Duration { get; set; } // in minutes
        public string? Status { get; set; } // Scheduled, Completed, Cancelled, etc.
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual Patient? Patient { get; set; }
        public virtual Provider? Provider { get; set; }
    }
}
