using System;

namespace Phos.Data.Entities
{
    public class Prescription
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public string? ProviderId { get; set; }
        public string? MedicationId { get; set; }
        public DateTime PrescriptionDate { get; set; }
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public string? Duration { get; set; }
        public int Refills { get; set; }
        public bool IsActive { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual Patient? Patient { get; set; }
        public virtual Provider? Provider { get; set; }
        public virtual Medication? Medication { get; set; }
    }
}
