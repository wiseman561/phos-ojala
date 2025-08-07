using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Phos.Services.Interfaces;
using Phos.Services.Models;

namespace Phos.Services.Implementations
{
    /// <summary>
    /// Client for interacting with the legacy AI Engine
    /// </summary>
    public class AIEngineClient : IAIEngineClient
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<AIEngineClient> _logger;
        private readonly IConfiguration _configuration;

        public AIEngineClient(
            IHttpClientFactory httpClientFactory,
            ILogger<AIEngineClient> logger,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _configuration = configuration;
        }

        /// <inheritdoc />
        public async Task<HealthScoreResult> GetHealthScore(string patientId)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("LegacyAIEngine");
                
                var response = await client.GetAsync($"/ai-engine/health-score?patientId={patientId}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get health score for patient {PatientId}: {StatusCode}", 
                        patientId, response.StatusCode);
                    return new HealthScoreResult
                    {
                        Success = false,
                        ErrorMessage = $"Failed to get health score: {response.StatusCode}"
                    };
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var legacyResult = JsonSerializer.Deserialize<LegacyHealthScoreResponse>(responseContent, 
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (legacyResult == null)
                {
                    return new HealthScoreResult
                    {
                        Success = false,
                        ErrorMessage = "Failed to deserialize health score response"
                    };
                }

                return new HealthScoreResult
                {
                    Success = true,
                    PatientId = patientId,
                    Score = legacyResult.Score,
                    ScoreDate = legacyResult.ScoreDate,
                    Factors = legacyResult.Factors,
                    Trend = legacyResult.Trend,
                    RecommendedActions = legacyResult.RecommendedActions
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting health score for patient {PatientId}", patientId);
                return new HealthScoreResult
                {
                    Success = false,
                    ErrorMessage = $"Exception: {ex.Message}"
                };
            }
        }

        /// <inheritdoc />
        public async Task<RiskAssessmentResult> GetRiskAssessment(string patientId)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("LegacyAIEngine");
                
                var response = await client.GetAsync($"/ai-engine/risk-model?patientId={patientId}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get risk assessment for patient {PatientId}: {StatusCode}", 
                        patientId, response.StatusCode);
                    return new RiskAssessmentResult
                    {
                        Success = false,
                        ErrorMessage = $"Failed to get risk assessment: {response.StatusCode}"
                    };
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var legacyResult = JsonSerializer.Deserialize<LegacyRiskAssessmentResponse>(responseContent, 
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (legacyResult == null)
                {
                    return new RiskAssessmentResult
                    {
                        Success = false,
                        ErrorMessage = "Failed to deserialize risk assessment response"
                    };
                }

                return new RiskAssessmentResult
                {
                    Success = true,
                    PatientId = patientId,
                    OverallRisk = legacyResult.OverallRisk,
                    RiskCategories = legacyResult.RiskCategories,
                    AssessmentDate = legacyResult.AssessmentDate,
                    NextAssessmentDue = legacyResult.NextAssessmentDue,
                    PreventiveActions = legacyResult.PreventiveActions
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting risk assessment for patient {PatientId}", patientId);
                return new RiskAssessmentResult
                {
                    Success = false,
                    ErrorMessage = $"Exception: {ex.Message}"
                };
            }
        }

        /// <inheritdoc />
        public async Task<ForecastResult> GetForecast(string patientId, string metricType, int daysAhead)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("LegacyAIEngine");
                
                var response = await client.GetAsync($"/ai-engine/forecasting?patientId={patientId}&metricType={metricType}&daysAhead={daysAhead}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to get forecast for patient {PatientId}, metric {MetricType}: {StatusCode}", 
                        patientId, metricType, response.StatusCode);
                    return new ForecastResult
                    {
                        Success = false,
                        ErrorMessage = $"Failed to get forecast: {response.StatusCode}"
                    };
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var legacyResult = JsonSerializer.Deserialize<LegacyForecastResponse>(responseContent, 
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (legacyResult == null)
                {
                    return new ForecastResult
                    {
                        Success = false,
                        ErrorMessage = "Failed to deserialize forecast response"
                    };
                }

                return new ForecastResult
                {
                    Success = true,
                    PatientId = patientId,
                    MetricType = metricType,
                    ForecastDate = legacyResult.ForecastDate,
                    ForecastValues = legacyResult.ForecastValues,
                    Confidence = legacyResult.Confidence,
                    Alerts = legacyResult.Alerts
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting forecast for patient {PatientId}, metric {MetricType}", patientId, metricType);
                return new ForecastResult
                {
                    Success = false,
                    ErrorMessage = $"Exception: {ex.Message}"
                };
            }
        }

        // Helper classes for deserialization
        private class LegacyHealthScoreResponse
        {
            public double Score { get; set; }
            public DateTime ScoreDate { get; set; }
            public string[] Factors { get; set; }
            public string Trend { get; set; }
            public string[] RecommendedActions { get; set; }
        }

        private class LegacyRiskAssessmentResponse
        {
            public string OverallRisk { get; set; }
            public Dictionary<string, string> RiskCategories { get; set; }
            public DateTime AssessmentDate { get; set; }
            public DateTime NextAssessmentDue { get; set; }
            public string[] PreventiveActions { get; set; }
        }

        private class LegacyForecastResponse
        {
            public DateTime ForecastDate { get; set; }
            public Dictionary<string, double> ForecastValues { get; set; }
            public double Confidence { get; set; }
            public string[] Alerts { get; set; }
        }
    }
}
