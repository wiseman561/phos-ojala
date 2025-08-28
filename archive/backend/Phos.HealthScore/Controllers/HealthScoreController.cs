using Microsoft.AspNetCore.Mvc;
using Phos.HealthScore.Models;
using Phos.HealthScore.Services;

namespace Phos.HealthScore.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthScoreController : ControllerBase
{
    private readonly IHealthScoreCalculator _calculator;
    private readonly ILogger<HealthScoreController> _logger;
    private readonly string _connectionString;

    public HealthScoreController(
        IHealthScoreCalculator calculator,
        ILogger<HealthScoreController> logger,
        IConfiguration configuration)
    {
        _calculator = calculator;
        _logger = logger;
        
        // Get connection string from environment variable or configuration
        _connectionString = Environment.GetEnvironmentVariable("HEALTHSCORE_DB_CONN") ?? 
                          configuration.GetConnectionString("HealthScoreDatabase") ?? 
                          "Server=localhost;Database=HealthScore;Trusted_Connection=True;";
        
        _logger.LogInformation("HealthScore service initialized with connection string");
    }

    [HttpPost]
    [Route("/health-score")]
    [ProducesResponseType(typeof(HealthScoreResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CalculateHealthScore([FromBody] HealthScoreRequest request)
    {
        if (request == null)
        {
            return BadRequest("Request body cannot be null");
        }

        try
        {
            _logger.LogInformation("Processing health score calculation request");
            var response = _calculator.CalculateScore(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating health score");
            return BadRequest($"Error calculating health score: {ex.Message}");
        }
    }
} 