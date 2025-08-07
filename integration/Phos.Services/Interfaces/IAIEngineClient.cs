using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Phos.Services.Models;

namespace Phos.Services.Interfaces
{
    /// <summary>
    /// Interface for interacting with the legacy AI Engine
    /// </summary>
    public interface IAIEngineClient
    {
        /// <summary>
        /// Gets the health score for a patient from the legacy AI Engine
        /// </summary>
        /// <param name="patientId">Patient ID</param>
        /// <returns>Health score result</returns>
        Task<HealthScoreResult> GetHealthScore(string patientId);

        /// <summary>
        /// Gets the risk assessment for a patient from the legacy AI Engine
        /// </summary>
        /// <param name="patientId">Patient ID</param>
        /// <returns>Risk assessment result</returns>
        Task<RiskAssessmentResult> GetRiskAssessment(string patientId);

        /// <summary>
        /// Gets a forecast for a specific metric for a patient from the legacy AI Engine
        /// </summary>
        /// <param name="patientId">Patient ID</param>
        /// <param name="metricType">Type of metric to forecast (e.g., "bloodPressure", "glucose")</param>
        /// <param name="daysAhead">Number of days to forecast ahead</param>
        /// <returns>Forecast result</returns>
        Task<ForecastResult> GetForecast(string patientId, string metricType, int daysAhead);
    }
}
