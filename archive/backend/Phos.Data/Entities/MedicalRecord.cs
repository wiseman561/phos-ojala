using System;

namespace Phos.Data.Entities
{
    public class MedicalRecord
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public string? ProviderId { get; set; }
        public DateTime RecordDate { get; set; }
        public string? Diagnosis { get; set; }
        public string? Treatment { get; set; }
        public string? Notes { get; set; }
        public string? RecordType { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual Patient? Patient { get; set; }
        public virtual Provider? Provider { get; set; }
    }
}
