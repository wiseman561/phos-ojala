using System;
using System.Collections.Generic;
using System.Linq;
using Phos.Contracts.Models;
using Phos.Services.Implementations;
using Xunit;

namespace Phos.Tests.Unit
{
    /// <summary>
    /// Unit tests for the RecommendationService.
    /// </summary>
    public class RecommendationServiceTests
    {
        /// <summary>
        /// Tests that recommendations are generated based on health score and risk factors.
        /// </summary>
        [Fact]
        public void GenerateRecommendations_ReturnsExpectedRecommendations()
        {
            // Arrange
            var service = new RecommendationService();
            var patientId = "patient-1";
            double healthScore = 55;
            var riskFactors = new List<RiskFactor>
            {
                new RiskFactor { Name = "Non-adherence", Contribution = 10, Description = "Missed doses", IsModifiable = true },
                new RiskFactor { Name = "Recent Admission", Contribution = 10, Description = "Admitted last week", IsModifiable = false },
                new RiskFactor { Name = "Abnormal Labs", Contribution = 8, Description = "High glucose", IsModifiable = true },
                new RiskFactor { Name = "Vital Instability", Contribution = 10, Description = "BP unstable", IsModifiable = true }
            };
            var recentEvents = new List<string> { "ER visit 2024-05-01" };

            // Act
            var recs = service.GenerateRecommendations(patientId, healthScore, riskFactors, recentEvents).ToList();

            // Assert
            Assert.Contains(recs, r => r.Title.Contains("Follow-up"));
            Assert.Contains(recs, r => r.Title.Contains("Medication Adherence"));
            Assert.Contains(recs, r => r.Title.Contains("Post-Discharge Care"));
            Assert.Contains(recs, r => r.Title.Contains("Abnormal Lab"));
            Assert.Contains(recs, r => r.Title.Contains("Unstable Vital"));
            Assert.All(recs, r => Assert.Contains("ER visit", r.SupportingEvidence.Last()));
        }

        /// <summary>
        /// Tests that a recommendation can be created and retrieved for a patient.
        /// </summary>
        [Fact]
        public void CreateAndRetrieveRecommendation_WorksCorrectly()
        {
            // Arrange
            var service = new RecommendationService();
            var rec = new NurseAssistantRecommendation
            {
                PatientId = "patient-2",
                Title = "Test Recommendation",
                Description = "Test description",
                Rationale = "Test rationale",
                SupportingEvidence = new List<string> { "Test evidence" }
            };

            // Act
            service.CreateRecommendation(rec);
            var retrieved = service.GetPatientRecommendations("patient-2").FirstOrDefault();

            // Assert
            Assert.NotNull(retrieved);
            Assert.Equal("Test Recommendation", retrieved.Title);
            Assert.Equal(RecommendationStatus.Pending, retrieved.Status);
        }

        /// <summary>
        /// Tests that updating a recommendation's status works as expected.
        /// </summary>
        [Fact]
        public void UpdateRecommendationStatus_UpdatesCorrectly()
        {
            // Arrange
            var service = new RecommendationService();
            var rec = new NurseAssistantRecommendation
            {
                PatientId = "patient-3",
                Title = "Status Update Test",
                Description = "Test description",
                Rationale = "Test rationale",
                SupportingEvidence = new List<string> { "Test evidence" }
            };
            service.CreateRecommendation(rec);
            var created = service.GetPatientRecommendations("patient-3").First();

            // Act
            service.UpdateRecommendationStatus(created.RecommendationId, RecommendationStatus.Approved, "Dr. Smith", "Reviewed and approved");
            var updated = service.GetRecommendation(created.RecommendationId);

            // Assert
            Assert.Equal(RecommendationStatus.Approved, updated.Status);
            Assert.Equal("Dr. Smith", updated.ReviewedBy);
            Assert.Equal("Reviewed and approved", updated.ReviewNotes);
            Assert.NotNull(updated.ReviewedAt);
        }
    }
} 