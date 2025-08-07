using System;
using System.Collections.Generic;

namespace Phos.Contracts.Models
{
    // Nurse Assistant Models
    public class ClinicalAlert
    {
        public string AlertId { get; set; } = null!;
        public string PatientId { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public AlertSeverity Severity { get; set; }
        public AlertStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? ResolvedBy { get; set; }
        public string? ResolutionNotes { get; set; }
        public List<string> RelatedMetrics { get; set; } = new List<string>();
    }

    public enum AlertSeverity
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum AlertStatus
    {
        New,
        Acknowledged,
        InProgress,
        Resolved,
        Dismissed
    }

    public class NurseAssistantRecommendation
    {
        public string RecommendationId { get; set; } = null!;
        public string PatientId { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Rationale { get; set; } = null!;
        public List<string> SupportingEvidence { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; }
        public RecommendationStatus Status { get; set; }
        public string? ReviewedBy { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewNotes { get; set; }
    }

    public enum RecommendationStatus
    {
        Pending,
        Approved,
        Rejected,
        Implemented
    }

    public class VitalSignsData
    {
        public string PatientId { get; set; } = null!;
        public DateTime RecordedAt { get; set; }
        public double? HeartRate { get; set; }
        public double? BloodPressureSystolic { get; set; }
        public double? BloodPressureDiastolic { get; set; }
        public double? RespiratoryRate { get; set; }
        public double? OxygenSaturation { get; set; }
        public double? Temperature { get; set; }
        public double? Pain { get; set; }
        public string? RecordedBy { get; set; }
        public string? Notes { get; set; }
    }
}
