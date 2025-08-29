using System;

namespace Phos.Contracts.DTOs
{
    public class VitalSignsDto
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public DateTime RecordedDate { get; set; }
        public string? RecordedBy { get; set; }
        public decimal Temperature { get; set; }
        public int HeartRate { get; set; }
        public int RespiratoryRate { get; set; }
        public int BloodPressureSystolic { get; set; }
        public int BloodPressureDiastolic { get; set; }
        public decimal Weight { get; set; }
        public decimal Height { get; set; }
        public decimal BMI { get; set; }
        public int OxygenSaturation { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
