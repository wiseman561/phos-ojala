using System;
using System.Threading.Tasks;
using Phos.Services.Models;

namespace Phos.Services.Interfaces
{
    /// <summary>
    /// Interface for interacting with the AI Engine API
    /// </summary>
    public interface IAIEngineClient
    {
        /// <summary>
        /// Gets the health score for a patient.
        /// </summary>
        /// <param name="patientId">The patient identifier.</param>
        /// <returns>The health score result.</returns>
        Task<HealthScoreResult> GetHealthScoreAsync(string patientId);

        /// <summary>
        /// Gets the risk assessment for a patient.
        /// </summary>
        /// <param name="patientId">The patient identifier.</param>
        /// <returns>The risk assessment result.</returns>
        Task<RiskAssessmentResult> GetRiskAssessmentAsync(string patientId);

        /// <summary>
        /// Generates care plan recommendations for a patient.
        /// </summary>
        /// <param name="patientId">The patient identifier.</param>
        /// <returns>The care plan recommendations.</returns>
        Task<CarePlanRecommendationResult> GetCarePlanRecommendationsAsync(string patientId);

        /// <summary>
        /// Analyzes patient data to identify trends and insights.
        /// </summary>
        /// <param name="patientId">The patient identifier.</param>
        /// <param name="dataType">Type of data to analyze (e.g., "vitals", "medications", "lab-results").</param>
        /// <param name="startDate">Optional start date for the analysis period.</param>
        /// <param name="endDate">Optional end date for the analysis period.</param>
        /// <returns>The analysis result.</returns>
        Task<PatientDataAnalysisResult> AnalyzePatientDataAsync(
            string patientId, 
            string dataType, 
            DateTime? startDate = null, 
            DateTime? endDate = null);
    }
}
