using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Phos.Services.Interfaces;
using Phos.Services.Models;

namespace Phos.Api.Services.Implementations
{
    /// <summary>
    /// Client for interacting with the AI Engine API
    /// </summary>
    public class AIEngineClient : IAIEngineClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AIEngineClient> _logger;
        private readonly string _baseUrl;
        private readonly string _apiKey;

        /// <summary>
        /// Initializes a new instance of the <see cref="AIEngineClient"/> class.
        /// </summary>
        /// <param name="httpClientFactory">The HTTP client factory.</param>
        /// <param name="configuration">The configuration.</param>
        /// <param name="logger">The logger.</param>
        public AIEngineClient(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<AIEngineClient> logger)
        {
            _httpClient = httpClientFactory.CreateClient("AIEngine");
            _logger = logger;
            
            _baseUrl = configuration["AIEngine:BaseUrl"];
            _apiKey = configuration["AIEngine:ApiKey"];

            if (string.IsNullOrEmpty(_baseUrl))
            {
                throw new InvalidOperationException("AI Engine BaseUrl is not configured. Please provide AIEngine:BaseUrl via configuration.");
            }
            if (string.IsNullOrEmpty(_apiKey))
            {
                // In production, this should throw an exception or log a critical error.
                // Throwing an exception ensures configuration is explicitly provided.
                throw new InvalidOperationException("AI Engine API Key is not configured. Please provide AIEngine:ApiKey via configuration (e.g., Vault).");
            }
            
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", _apiKey);
            _httpClient.BaseAddress = new Uri(_baseUrl);
        }

        /// <summary>
        /// Gets the health score for a patient.
        /// </summary>
        /// <param name="patientId">The patient identifier.</param>
        /// <returns>The health score result.</returns>
        public async Task<HealthScoreResult> GetHealthScoreAsync(string patientId)
        {
            try
            {
                _logger.LogInformation("Requesting health score for patient {PatientId}", patientId);
                
                var response = await _httpClient.GetAsync($"/v1/health-score/{patientId}");
                
                response.EnsureSuccessStatusCode();
                
                var result = await response.Content.ReadFromJsonAsync<HealthScoreResult>();
                
                if (result == null)
                {
                    throw new InvalidOperationException("Received null response from AI Engine");
                }
                
                _logger.LogInformation("Successfully retrieved health score for patient {PatientId}", patientId);
                
                return result;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error calling AI Engine health score API for patient {PatientId}", patientId);
                throw new AIEngineException("Failed to retrieve health score from AI Engine", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting health score for patient {PatientId}", patientId);
                throw new AIEngineException("An unexpected error occurred while retrieving health score", ex);
            }
        }

        /// <summary>
        /// Gets the risk assessment for a patient.
        /// </summary>
        /// <param name="patientId">The patient identifier.</param>
        /// <returns>The risk assessment result.</returns>
        public async Task<RiskAssessmentResult> GetRiskAssessmentAsync(string patientId)
        {
            try
            {
                _logger.LogInformation("Requesting risk assessment for patient {PatientId}", patientId);
                
                var response = await _httpClient.GetAsync($"/v1/risk-assessment/{patientId}");
                
                response.EnsureSuccessStatusCode();
                
                var result = await response.Content.ReadFromJsonAsync<RiskAssessmentResult>();
                
                if (result == null)
                {
                    throw new InvalidOperationException("Received null response from AI Engine");
                }
                
                _logger.LogInformation("Successfully retrieved risk assessment for patient {PatientId}", patientId);
                
                return result;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error calling AI Engine risk assessment API for patient {PatientId}", patientId);
                throw new AIEngineException("Failed to retrieve risk assessment from AI Engine", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting risk assessment for patient {PatientId}", patientId);
                throw new AIEngineException("An unexpected error occurred while retrieving risk assessment", ex);
            }
        }

        /// <summary>
        /// Generates care plan recommendations for a patient.
        /// </summary>
        /// <param name="patientId">The patient identifier.</param>
        /// <returns>The care plan recommendations.</returns>
        public async Task<CarePlanRecommendationResult> GetCarePlanRecommendationsAsync(string patientId)
        {
            try
            {
                _logger.LogInformation("Requesting care plan recommendations for patient {PatientId}", patientId);
                
                var response = await _httpClient.GetAsync($"/v1/care-plan-recommendations/{patientId}");
                
                response.EnsureSuccessStatusCode();
                
                var result = await response.Content.ReadFromJsonAsync<CarePlanRecommendationResult>();
                
                if (result == null)
                {
                    throw new InvalidOperationException("Received null response from AI Engine");
                }
                
                _logger.LogInformation("Successfully retrieved care plan recommendations for patient {PatientId}", patientId);
                
                return result;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error calling AI Engine care plan recommendations API for patient {PatientId}", patientId);
                throw new AIEngineException("Failed to retrieve care plan recommendations from AI Engine", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting care plan recommendations for patient {PatientId}", patientId);
                throw new AIEngineException("An unexpected error occurred while retrieving care plan recommendations", ex);
            }
        }

        /// <summary>
        /// Analyzes patient data to identify trends and insights.
        /// </summary>
        /// <param name="patientId">The patient identifier.</param>
        /// <param name="dataType">Type of data to analyze (e.g., "vitals", "medications", "lab-results").</param>
        /// <param name="startDate">Optional start date for the analysis period.</param>
        /// <param name="endDate">Optional end date for the analysis period.</param>
        /// <returns>The analysis result.</returns>
        public async Task<PatientDataAnalysisResult> AnalyzePatientDataAsync(
            string patientId, 
            string dataType, 
            DateTime? startDate = null, 
            DateTime? endDate = null)
        {
            try
            {
                _logger.LogInformation("Requesting data analysis for patient {PatientId}, data type {DataType}", patientId, dataType);
                
                var requestData = new
                {
                    PatientId = patientId,
                    DataType = dataType,
                    StartDate = startDate?.ToString("yyyy-MM-dd"),
                    EndDate = endDate?.ToString("yyyy-MM-dd")
                };
                
                var content = new StringContent(
                    JsonSerializer.Serialize(requestData),
                    Encoding.UTF8,
                    "application/json");
                
                var response = await _httpClient.PostAsync("/v1/analyze-patient-data", content);
                
                response.EnsureSuccessStatusCode();
                
                var result = await response.Content.ReadFromJsonAsync<PatientDataAnalysisResult>();
                
                if (result == null)
                {
                    throw new InvalidOperationException("Received null response from AI Engine");
                }
                
                _logger.LogInformation("Successfully retrieved data analysis for patient {PatientId}, data type {DataType}", patientId, dataType);
                
                return result;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error calling AI Engine data analysis API for patient {PatientId}, data type {DataType}", patientId, dataType);
                throw new AIEngineException("Failed to retrieve data analysis from AI Engine", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting data analysis for patient {PatientId}, data type {DataType}", patientId, dataType);
                throw new AIEngineException("An unexpected error occurred while retrieving data analysis", ex);
            }
        }
    }

    /// <summary>
    /// Exception thrown when an error occurs while interacting with the AI Engine.
    /// </summary>
    public class AIEngineException : Exception
    {
        public AIEngineException(string message) : base(message)
        {
        }

        public AIEngineException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
