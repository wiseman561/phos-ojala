using System;

namespace Phos.Contracts.DTOs
{
    public class PrescriptionDto
    {
        public string? Id { get; set; }
        public string? MedicationName { get; set; }
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Instructions { get; set; }
        public string? PatientId { get; set; }
        public string? ProviderId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
