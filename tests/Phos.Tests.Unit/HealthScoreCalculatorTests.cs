using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Newtonsoft.Json;
using Phos.HealthScore.Models;
using Phos.HealthScore.Services;
using System.IO;
using Xunit;

namespace Phos.Tests.Unit;

public class HealthScoreCalculatorTests
{
    private readonly Mock<ILogger<HealthScoreCalculator>> _loggerMock;
    private readonly Mock<IConfiguration> _configMock;
    private readonly HealthScoreCalculator _calculator;

    public HealthScoreCalculatorTests()
    {
        _loggerMock = new Mock<ILogger<HealthScoreCalculator>>();
        _configMock = new Mock<IConfiguration>();
        _calculator = new HealthScoreCalculator(_loggerMock.Object, _configMock.Object);
    }

    private HealthScoreRequest LoadTestFixture(string fixtureName)
    {
        string path = Path.Combine("tests", "TestData", "health-score", $"{fixtureName}.json");
        string json = File.ReadAllText(path);
        return JsonConvert.DeserializeObject<HealthScoreRequest>(json) ?? new HealthScoreRequest();
    }

    [Fact]
    public void CalculateScore_LowRiskPatient_ReturnsLowRisk()
    {
        // Arrange
        var request = LoadTestFixture("low-risk");

        // Act
        var response = _calculator.CalculateScore(request);

        // Assert
        Assert.NotNull(response);
        Assert.Equal(RiskTier.Low, response.RiskTier);
        Assert.True(response.Score < 20);
    }

    [Fact]
    public void CalculateScore_MediumRiskPatient_ReturnsMediumRisk()
    {
        // Arrange
        var request = LoadTestFixture("medium-risk");

        // Act
        var response = _calculator.CalculateScore(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.RiskTier == RiskTier.Moderate || response.RiskTier == RiskTier.High);
        Assert.True(response.Score >= 20 && response.Score < 60);
    }
    
    [Fact]
    public void CalculateScore_HighRiskPatient_ReturnsHighRisk()
    {
        // Arrange
        var request = LoadTestFixture("high-risk");

        // Act
        var response = _calculator.CalculateScore(request);

        // Assert
        Assert.NotNull(response);
        Assert.True(response.RiskTier >= RiskTier.High);
        Assert.True(response.Score >= 60);
    }
    
    [Fact]
    public void CalculateScore_RiskFactors_ReturnsCorrectContributors()
    {
        // Arrange
        var request = LoadTestFixture("medium-risk");

        // Act
        var response = _calculator.CalculateScore(request);

        // Assert
        Assert.NotNull(response);
        Assert.Contains(response.RiskFactors, rf => rf.Name.Contains("Systolic BP"));
        Assert.Contains(response.RiskFactors, rf => rf.Name == "Diabetes");
        Assert.Contains(response.RiskFactors, rf => rf.Name.Contains("Hemoglobin A1c"));
    }
    
    [Fact]
    public void CalculateScore_EmptyRequest_ReturnsValidResponse()
    {
        // Arrange
        var request = new HealthScoreRequest();

        // Act
        var response = _calculator.CalculateScore(request);

        // Assert
        Assert.NotNull(response);
        Assert.Equal(RiskTier.Low, response.RiskTier);
        Assert.Equal(0, response.Score);
    }
} 