using System;
using System.Collections.Generic;
using Phos.Contracts.DTOs;

namespace Phos.Contracts.Models
{
    public class PatientMedicalHistoryDto
    {
        public string? PatientId { get; set; }
        public string? PatientName { get; set; }
        public List<MedicalRecordDto> MedicalRecords { get; set; } = new List<MedicalRecordDto>();
        public List<AppointmentDto> Appointments { get; set; } = new List<AppointmentDto>();
        public List<PrescriptionDto> Prescriptions { get; set; } = new List<PrescriptionDto>();
        public List<string> Allergies { get; set; } = new List<string>();
        public List<string> ChronicConditions { get; set; } = new List<string>();
        public List<VaccinationDto> Vaccinations { get; set; } = new List<VaccinationDto>();
        public List<VitalSignsDto> VitalSigns { get; set; } = new List<VitalSignsDto>();
    }

    public class VaccinationDto
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public string? VaccineName { get; set; }
        public DateTime AdministrationDate { get; set; }
        public string? AdministeredBy { get; set; }
        public string? Manufacturer { get; set; }
        public string? LotNumber { get; set; }
        public DateTime? ExpirationDate { get; set; }
        public string? Notes { get; set; }
    }

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
    }
}
