using System;

namespace Phos.Contracts.DTOs
{
    public class AppointmentDto
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public string? PatientName { get; set; }
        public string? ProviderId { get; set; }
        public string? ProviderName { get; set; }
        public DateTime AppointmentDate { get; set; }
        public int Duration { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class AppointmentCreateDto
    {
        public string? PatientId { get; set; }
        public string? ProviderId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public int Duration { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class AppointmentUpdateDto
    {
        public string? Id { get; set; }
        public DateTime AppointmentDate { get; set; }
        public int Duration { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }
}
