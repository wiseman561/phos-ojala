using System;
using System.Collections.Generic;

namespace Phos.Contracts.DTOs
{
    /// <summary>
    /// Full patient details
    /// </summary>
    public class PatientDto
    {
        public string? Id { get; set; }

        /// <summary>
        /// Tests expect a single Name property
        /// </summary>
        public string? Name { get; set; }

        // You can still keep FirstName/LastName if you need them internally—
        // but your tests will be targeting Name.
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<AppointmentDto>? Appointments { get; set; }
        public List<MedicalRecordDto>? MedicalRecords { get; set; }
        public HealthcarePlanDto? ActivePlan { get; set; }
    }

    /// <summary>
    /// DTO used when creating a new patient
    /// </summary>
    public class PatientCreateDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
    }

    /// <summary>
    /// DTO used when updating an existing patient
    /// </summary>
    public class PatientUpdateDto
    {
        public string? Id { get; set; }

        /// <summary>
        /// Tests expect this property on your update DTO
        /// </summary>
        public string? Name { get; set; }

        // You can still include FirstName/LastName if you like,
        // but your controller only needs Name to satisfy the tests.
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
    }
}
