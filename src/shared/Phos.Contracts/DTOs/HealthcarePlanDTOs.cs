using System;

namespace Phos.Contracts.DTOs
{
    public class HealthcarePlanDto
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public string? PatientName { get; set; }
        public string? PlanName { get; set; }
        public string? PlanType { get; set; }
        public string? CoverageDetails { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal MonthlyCost { get; set; }
        public decimal AnnualDeductible { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class HealthcarePlanCreateDto
    {
        public string? PatientId { get; set; }
        public string? PlanName { get; set; }
        public string? PlanType { get; set; }
        public string? CoverageDetails { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal MonthlyCost { get; set; }
        public decimal AnnualDeductible { get; set; }
    }

    public class HealthcarePlanUpdateDto
    {
        public string? Id { get; set; }
        public string? PlanName { get; set; }
        public string? PlanType { get; set; }
        public string? CoverageDetails { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal MonthlyCost { get; set; }
        public decimal AnnualDeductible { get; set; }
    }
}
