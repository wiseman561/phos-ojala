using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Phos.Services.Interfaces;
using Phos.Services.Models;
using System.Threading.Tasks;

namespace Phos.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ApiVersion("1.0")]
    public class AiIntegrationController : ControllerBase
    {
        private readonly IAIEngineClient _aiEngineClient;
        private readonly IFeatureFlagService _featureFlagService;

        public AiIntegrationController(
            IAIEngineClient aiEngineClient,
            IFeatureFlagService featureFlagService)
        {
            _aiEngineClient = aiEngineClient;
            _featureFlagService = featureFlagService;
        }

        /// <summary>
        /// Gets the health score for a patient
        /// </summary>
        /// <param name="patientId">Patient ID</param>
        /// <returns>Health score information</returns>
        [HttpGet("healthscore/{patientId}")]
        [Authorize(Policy = "RequireRNRole")]
        public async Task<IActionResult> GetHealthScore(string patientId)
        {
            // Check if we should use the new implementation
            bool useNewImplementation = await _featureFlagService.IsEnabledAsync("UseNewHealthScoreModel");
            
            if (useNewImplementation)
            {
                // In a real implementation, this would call the new health score service
                // For now, we'll still use the legacy system but log the intent
                return await GetLegacyHealthScore(patientId);
            }
            
            return await GetLegacyHealthScore(patientId);
        }

        private async Task<IActionResult> GetLegacyHealthScore(string patientId)
        {
            var result = await _aiEngineClient.GetHealthScore(patientId);
            
            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }
            
            return Ok(result);
        }

        /// <summary>
        /// Gets the risk assessment for a patient
        /// </summary>
        /// <param name="patientId">Patient ID</param>
        /// <returns>Risk assessment information</returns>
        [HttpGet("risk/{patientId}")]
        [Authorize(Policy = "RequireRNRole")]
        public async Task<IActionResult> GetRiskAssessment(string patientId)
        {
            // Check if we should use the new implementation
            bool useNewImplementation = await _featureFlagService.IsEnabledAsync("UseNewRiskModel");
            
            if (useNewImplementation)
            {
                // In a real implementation, this would call the new risk assessment service
                // For now, we'll still use the legacy system but log the intent
                return await GetLegacyRiskAssessment(patientId);
            }
            
            return await GetLegacyRiskAssessment(patientId);
        }

        private async Task<IActionResult> GetLegacyRiskAssessment(string patientId)
        {
            var result = await _aiEngineClient.GetRiskAssessment(patientId);
            
            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }
            
            return Ok(result);
        }

        /// <summary>
        /// Gets a forecast for a specific metric for a patient
        /// </summary>
        /// <param name="patientId">Patient ID</param>
        /// <param name="metricType">Type of metric to forecast</param>
        /// <param name="daysAhead">Number of days to forecast ahead</param>
        /// <returns>Forecast information</returns>
        [HttpGet("forecast/{patientId}")]
        [Authorize(Policy = "RequireRNRole")]
        public async Task<IActionResult> GetForecast(string patientId, [FromQuery] string metricType, [FromQuery] int daysAhead = 30)
        {
            // Check if we should use the new implementation
            bool useNewImplementation = await _featureFlagService.IsEnabledAsync("UseNewForecastModel");
            
            if (useNewImplementation)
            {
                // In a real implementation, this would call the new forecasting service
                // For now, we'll still use the legacy system but log the intent
                return await GetLegacyForecast(patientId, metricType, daysAhead);
            }
            
            return await GetLegacyForecast(patientId, metricType, daysAhead);
        }

        private async Task<IActionResult> GetLegacyForecast(string patientId, string metricType, int daysAhead)
        {
            var result = await _aiEngineClient.GetForecast(patientId, metricType, daysAhead);
            
            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }
            
            return Ok(result);
        }
    }
}
