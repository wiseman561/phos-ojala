using System;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Phos.Api.Services.Implementations;
using Phos.Services.Interfaces;
using Phos.Services.Models;
using Xunit;

namespace Phos.Tests.Unit
{
    /// <summary>
    /// Unit tests for the AIEngineClient
    /// </summary>
    public class AIEngineClientTests
    {
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<ILogger<AIEngineClient>> _mockLogger;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
        private readonly HttpClient _httpClient;

        public AIEngineClientTests()
        {
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockLogger = new Mock<ILogger<AIEngineClient>>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            
            _httpClient = new HttpClient(_mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://ai-engine.phos-healthcare.com/api")
            };
            
            // TODO: Replace mock URL with secrets from Vault
            _mockConfiguration.Setup(c => c["AIEngine:BaseUrl"]).Returns("https://ai-engine.phos-healthcare.com/api");
            _mockConfiguration.Setup(c => c["AIEngine:ApiKey"]).Returns("test-api-key");
            
            _mockHttpClientFactory.Setup(f => f.CreateClient("AIEngine")).Returns(_httpClient);
        }

        [Fact]
        public async Task GetHealthScoreAsync_ReturnsHealthScore_WhenApiCallSucceeds()
        {
            // Arrange
            var patientId = "patient-123";
            var expectedResponse = new HealthScoreResult
            {
                PatientId = patientId,
                Score = 85.5,
                ScoreDate = DateTime.UtcNow,
                Factors = new System.Collections.Generic.List<string>
                {
                    "Regular medication adherence",
                    "Consistent exercise routine"
                },
                Trend = "Improving",
                RecommendedActions = new System.Collections.Generic.List<string>
                {
                    "Continue current medication regimen",
                    "Increase water intake"
                }
            };
            
            SetupMockHttpMessageHandler(
                HttpMethod.Get,
                $"/v1/health-score/{patientId}",
                HttpStatusCode.OK,
                expectedResponse);
            
            var client = new AIEngineClient(
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object,
                _mockLogger.Object);
            
            // Act
            var result = await client.GetHealthScoreAsync(patientId);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(patientId, result.PatientId);
            Assert.Equal(expectedResponse.Score, result.Score);
            Assert.Equal(expectedResponse.Trend, result.Trend);
            Assert.Equal(expectedResponse.Factors.Count, result.Factors.Count);
            Assert.Equal(expectedResponse.RecommendedActions.Count, result.RecommendedActions.Count);
        }

        [Fact]
        public async Task GetHealthScoreAsync_ThrowsAIEngineException_WhenApiCallFails()
        {
            // Arrange
            var patientId = "patient-123";
            
            SetupMockHttpMessageHandler(
                HttpMethod.Get,
                $"/v1/health-score/{patientId}",
                HttpStatusCode.InternalServerError,
                null);
            
            var client = new AIEngineClient(
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object,
                _mockLogger.Object);
            
            // Act & Assert
            var exception = await Assert.ThrowsAsync<AIEngineException>(
                () => client.GetHealthScoreAsync(patientId));
            
            Assert.Contains("Failed to retrieve health score", exception.Message);
        }

        [Fact]
        public async Task GetRiskAssessmentAsync_ReturnsRiskAssessment_WhenApiCallSucceeds()
        {
            // Arrange
            var patientId = "patient-123";
            var expectedResponse = new RiskAssessmentResult
            {
                PatientId = patientId,
                OverallRisk = "Medium",
                RiskCategories = new System.Collections.Generic.Dictionary<string, string>
                {
                    { "Cardiovascular", "Low" },
                    { "Diabetes", "Medium" },
                    { "Respiratory", "Low" }
                },
                AssessmentDate = DateTime.UtcNow,
                NextAssessmentDue = DateTime.UtcNow.AddMonths(3),
                PreventiveActions = new System.Collections.Generic.List<string>
                {
                    "Regular blood glucose monitoring",
                    "Maintain healthy diet and exercise"
                }
            };
            
            SetupMockHttpMessageHandler(
                HttpMethod.Get,
                $"/v1/risk-assessment/{patientId}",
                HttpStatusCode.OK,
                expectedResponse);
            
            var client = new AIEngineClient(
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object,
                _mockLogger.Object);
            
            // Act
            var result = await client.GetRiskAssessmentAsync(patientId);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(patientId, result.PatientId);
            Assert.Equal(expectedResponse.OverallRisk, result.OverallRisk);
            Assert.Equal(expectedResponse.RiskCategories.Count, result.RiskCategories.Count);
            Assert.Equal(expectedResponse.PreventiveActions.Count, result.PreventiveActions.Count);
        }

        [Fact]
        public async Task GetRiskAssessmentAsync_ThrowsAIEngineException_WhenApiCallFails()
        {
            // Arrange
            var patientId = "patient-123";
            
            SetupMockHttpMessageHandler(
                HttpMethod.Get,
                $"/v1/risk-assessment/{patientId}",
                HttpStatusCode.InternalServerError,
                null);
            
            var client = new AIEngineClient(
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object,
                _mockLogger.Object);
            
            // Act & Assert
            var exception = await Assert.ThrowsAsync<AIEngineException>(
                () => client.GetRiskAssessmentAsync(patientId));
            
            Assert.Contains("Failed to retrieve risk assessment", exception.Message);
        }

        [Fact]
        public async Task GetCarePlanRecommendationsAsync_ReturnsRecommendations_WhenApiCallSucceeds()
        {
            // Arrange
            var patientId = "patient-123";
            var expectedResponse = new CarePlanRecommendationResult
            {
                PatientId = patientId,
                Title = "Diabetes Management Plan",
                Description = "Comprehensive plan for managing Type 2 Diabetes",
                Goals = new System.Collections.Generic.List<CarePlanGoal>
                {
                    new CarePlanGoal
                    {
                        Description = "Reduce HbA1c to below 7.0%",
                        TargetDate = DateTime.UtcNow.AddMonths(3),
                        Priority = "High"
                    }
                },
                Tasks = new System.Collections.Generic.List<CarePlanTask>
                {
                    new CarePlanTask
                    {
                        Title = "Weekly blood glucose monitoring",
                        Description = "Check and record blood glucose levels 3 times per week",
                        Assignee = "RN",
                        Frequency = "Weekly"
                    }
                },
                ClinicalReasoning = "Based on recent lab results and patient history",
                GeneratedDate = DateTime.UtcNow
            };
            
            SetupMockHttpMessageHandler(
                HttpMethod.Get,
                $"/v1/care-plan-recommendations/{patientId}",
                HttpStatusCode.OK,
                expectedResponse);
            
            var client = new AIEngineClient(
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object,
                _mockLogger.Object);
            
            // Act
            var result = await client.GetCarePlanRecommendationsAsync(patientId);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(patientId, result.PatientId);
            Assert.Equal(expectedResponse.Title, result.Title);
            Assert.Equal(expectedResponse.Description, result.Description);
            Assert.Equal(expectedResponse.Goals.Count, result.Goals.Count);
            Assert.Equal(expectedResponse.Tasks.Count, result.Tasks.Count);
        }

        [Fact]
        public async Task AnalyzePatientDataAsync_ReturnsAnalysis_WhenApiCallSucceeds()
        {
            // Arrange
            var patientId = "patient-123";
            var dataType = "vitals";
            var startDate = DateTime.UtcNow.AddMonths(-3);
            var endDate = DateTime.UtcNow;
            
            var expectedResponse = new PatientDataAnalysisResult
            {
                PatientId = patientId,
                DataType = dataType,
                StartDate = startDate,
                EndDate = endDate,
                Trends = new System.Collections.Generic.List<DataTrend>
                {
                    new DataTrend
                    {
                        Name = "Blood Pressure Trend",
                        Description = "Gradual improvement in blood pressure readings",
                        Significance = "High",
                        DataPoints = new System.Collections.Generic.Dictionary<string, double>
                        {
                            { "2025-01-15", 140.0 },
                            { "2025-02-15", 135.0 },
                            { "2025-03-15", 130.0 }
                        }
                    }
                },
                Insights = new System.Collections.Generic.List<string>
                {
                    "Medication appears to be effective in controlling blood pressure",
                    "Exercise regimen shows positive impact on vital signs"
                },
                AnalysisDate = DateTime.UtcNow
            };
            
            SetupMockHttpMessageHandler(
                HttpMethod.Post,
                "/v1/analyze-patient-data",
                HttpStatusCode.OK,
                expectedResponse);
            
            var client = new AIEngineClient(
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object,
                _mockLogger.Object);
            
            // Act
            var result = await client.AnalyzePatientDataAsync(patientId, dataType, startDate, endDate);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(patientId, result.PatientId);
            Assert.Equal(dataType, result.DataType);
            Assert.Equal(expectedResponse.Trends.Count, result.Trends.Count);
            Assert.Equal(expectedResponse.Insights.Count, result.Insights.Count);
        }

        private void SetupMockHttpMessageHandler<T>(
            HttpMethod method,
            string requestUrl,
            HttpStatusCode responseStatusCode,
            T responseContent)
        {
            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => 
                        req.Method == method && 
                        req.RequestUri.PathAndQuery.Contains(requestUrl)),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = responseStatusCode,
                    Content = responseContent != null
                        ? new StringContent(JsonSerializer.Serialize(responseContent))
                        : null
                });
        }
    }
}
