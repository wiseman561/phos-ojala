using System;
using System.Collections.Generic;
using System.Linq;
using Phos.Contracts.Models;
using Phos.Services.Interfaces;

namespace Phos.Services.Implementations
{
    /// <summary>
    /// Provides rules-based, actionable care recommendations for patients.
    /// </summary>
    public class RecommendationService : IRecommendationService
    {
        // In-memory store for demo purposes (replace with DB or API in production)
        private static readonly List<NurseAssistantRecommendation> _recommendations = new();

        /// <summary>
        /// Creates a new recommendation for a patient.
        /// </summary>
        public void CreateRecommendation(NurseAssistantRecommendation recommendation)
        {
            recommendation.RecommendationId = Guid.NewGuid().ToString();
            recommendation.CreatedAt = DateTime.UtcNow;
            recommendation.Status = RecommendationStatus.Pending;
            _recommendations.Add(recommendation);
        }

        /// <summary>
        /// Gets all recommendations for a specific patient.
        /// </summary>
        public IEnumerable<NurseAssistantRecommendation> GetPatientRecommendations(string patientId)
        {
            // In production, fetch from DB or API
            return _recommendations.Where(r => r.PatientId == patientId);
        }

        /// <summary>
        /// Gets all pending recommendations across all patients.
        /// </summary>
        public IEnumerable<NurseAssistantRecommendation> GetPendingRecommendations()
        {
            return _recommendations.Where(r => r.Status == RecommendationStatus.Pending);
        }

        /// <summary>
        /// Gets a specific recommendation by its ID.
        /// </summary>
        public NurseAssistantRecommendation GetRecommendation(string recommendationId)
        {
            return _recommendations.FirstOrDefault(r => r.RecommendationId == recommendationId);
        }

        /// <summary>
        /// Updates the status and review notes for a recommendation.
        /// </summary>
        public void UpdateRecommendationStatus(string recommendationId, RecommendationStatus status, string reviewedBy, string? notes = null)
        {
            var rec = _recommendations.FirstOrDefault(r => r.RecommendationId == recommendationId);
            if (rec != null)
            {
                rec.Status = status;
                rec.ReviewedBy = reviewedBy;
                rec.ReviewedAt = DateTime.UtcNow;
                rec.ReviewNotes = notes;
            }
        }

        /// <summary>
        /// Generates rules-based recommendations for a patient based on risk factors, health score, and recent clinical data.
        /// </summary>
        /// <remarks>
        /// This method is designed for easy extension to AI/ML-powered recommendations in the future.
        /// </remarks>
        public IEnumerable<NurseAssistantRecommendation> GenerateRecommendations(string patientId, double healthScore, List<RiskFactor> riskFactors, List<string> recentEvents)
        {
            var recs = new List<NurseAssistantRecommendation>();

            // Example: Follow-up for high risk
            if (healthScore < 60)
            {
                recs.Add(new NurseAssistantRecommendation
                {
                    PatientId = patientId,
                    Title = "Schedule Follow-up Appointment",
                    Description = "Patient's health score is below 60. Recommend scheduling a follow-up within 7 days.",
                    Rationale = "Low health score indicates increased risk of adverse events.",
                    SupportingEvidence = new List<string> { $"Health score: {healthScore}" },
                    CreatedAt = DateTime.UtcNow,
                    Status = RecommendationStatus.Pending
                });
            }

            // Example: Medication review for non-adherence
            if (riskFactors.Any(r => r.Name == "Non-adherence" && r.Contribution > 0))
            {
                recs.Add(new NurseAssistantRecommendation
                {
                    PatientId = patientId,
                    Title = "Review Medication Adherence",
                    Description = "Detected medication non-adherence. Recommend reviewing medication regimen and providing adherence support.",
                    Rationale = "Non-adherence increases risk of complications and readmission.",
                    SupportingEvidence = new List<string> { "Risk factor: Non-adherence" },
                    CreatedAt = DateTime.UtcNow,
                    Status = RecommendationStatus.Pending
                });
            }

            // Example: Care coordination for recent admission
            if (riskFactors.Any(r => r.Name == "Recent Admission" && r.Contribution > 0))
            {
                recs.Add(new NurseAssistantRecommendation
                {
                    PatientId = patientId,
                    Title = "Coordinate Post-Discharge Care",
                    Description = "Recent hospital admission detected. Recommend care coordination and follow-up to reduce readmission risk.",
                    Rationale = "Post-discharge care reduces risk of complications and readmission.",
                    SupportingEvidence = new List<string> { "Risk factor: Recent Admission" },
                    CreatedAt = DateTime.UtcNow,
                    Status = RecommendationStatus.Pending
                });
            }

            // Example: Alert for abnormal labs
            if (riskFactors.Any(r => r.Name == "Abnormal Labs" && r.Contribution > 0))
            {
                recs.Add(new NurseAssistantRecommendation
                {
                    PatientId = patientId,
                    Title = "Review Abnormal Lab Results",
                    Description = "Abnormal lab values detected. Recommend provider review and possible intervention.",
                    Rationale = "Abnormal labs may indicate acute or chronic issues requiring attention.",
                    SupportingEvidence = new List<string> { "Risk factor: Abnormal Labs" },
                    CreatedAt = DateTime.UtcNow,
                    Status = RecommendationStatus.Pending
                });
            }

            // Example: Vital sign instability
            if (riskFactors.Any(r => r.Name == "Vital Instability" && r.Contribution > 0))
            {
                recs.Add(new NurseAssistantRecommendation
                {
                    PatientId = patientId,
                    Title = "Monitor Unstable Vital Signs",
                    Description = "Unstable vital signs detected. Recommend increased monitoring and provider notification if trends worsen.",
                    Rationale = "Vital sign instability is associated with increased risk of deterioration.",
                    SupportingEvidence = new List<string> { "Risk factor: Vital Instability" },
                    CreatedAt = DateTime.UtcNow,
                    Status = RecommendationStatus.Pending
                });
            }

            // Example: Add recent events as supporting evidence
            foreach (var rec in recs)
            {
                if (recentEvents != null && recentEvents.Any())
                {
                    rec.SupportingEvidence.AddRange(recentEvents);
                }
            }

            return recs;
        }
    }
}
