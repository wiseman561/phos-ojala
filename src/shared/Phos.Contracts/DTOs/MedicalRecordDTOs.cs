using System;

namespace Phos.Contracts.DTOs
{
    public class MedicalRecordDto
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public string? PatientName { get; set; }
        public string? ProviderId { get; set; }
        public string? ProviderName { get; set; }
        public DateTime RecordDate { get; set; }
        public string? Diagnosis { get; set; }
        public string? Treatment { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class MedicalRecordCreateDto
    {
        public string? PatientId { get; set; }
        public string? ProviderId { get; set; }
        public DateTime RecordDate { get; set; }
        public string? Diagnosis { get; set; }
        public string? Treatment { get; set; }
        public string? Notes { get; set; }
    }

    public class MedicalRecordUpdateDto
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }   // ← add
        public string? ProviderId { get; set; }   // ← add
        public DateTime RecordDate { get; set; }
        public string? Diagnosis { get; set; }
        public string? Treatment { get; set; }
        public string? Notes { get; set; }
    }
}
