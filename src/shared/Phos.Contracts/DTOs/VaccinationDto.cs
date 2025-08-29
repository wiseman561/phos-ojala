using System;

namespace Phos.Contracts.DTOs
{
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
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
