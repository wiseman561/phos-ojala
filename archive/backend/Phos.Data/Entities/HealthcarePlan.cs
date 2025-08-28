using System;

namespace Phos.Data.Entities
{
    public class HealthcarePlan
    {
        public string? Id { get; set; }
        public string? PatientId { get; set; }
        public string? PlanName { get; set; }
        public string? PlanType { get; set; }
        public string? CoverageDetails { get; set; }
        public string? Status { get; set; } // Added for GetActivePlansCountAsync
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal MonthlyCost { get; set; }
        public decimal AnnualDeductible { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual Patient? Patient { get; set; }
    }
}
