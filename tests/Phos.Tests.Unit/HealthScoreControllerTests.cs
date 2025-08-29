using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Phos.HealthScore.Controllers;
using Phos.HealthScore.Models;
using Phos.HealthScore.Services;
using Xunit;

namespace Phos.Tests.Unit;

public class HealthScoreControllerTests
{
    private readonly Mock<IHealthScoreCalculator> _calculatorMock;
    private readonly Mock<ILogger<HealthScoreController>> _loggerMock;
    private readonly IConfiguration _config;
    private readonly HealthScoreController _controller;

    public HealthScoreControllerTests()
    {
        _calculatorMock = new Mock<IHealthScoreCalculator>();
        _loggerMock = new Mock<ILogger<HealthScoreController>>();
        _config = new ConfigurationBuilder()
            .AddInMemoryCollection()
            .Build();
        _controller = new HealthScoreController(_calculatorMock.Object, _loggerMock.Object, _config);
    }

    [Fact]
    public void CalculateHealthScore_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var request = new HealthScoreRequest();
        var response = new HealthScoreResponse { Score = 25, RiskTier = RiskTier.Moderate };

        _calculatorMock.Setup(x => x.CalculateScore(It.IsAny<HealthScoreRequest>()))
            .Returns(response);

        // Act
        var result = _controller.CalculateHealthScore(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnValue = Assert.IsType<HealthScoreResponse>(okResult.Value);
        Assert.Equal(25, returnValue.Score);
        Assert.Equal(RiskTier.Moderate, returnValue.RiskTier);
    }

    [Fact]
    public void CalculateHealthScore_NullRequest_ReturnsBadRequest()
    {
        // Act
        var result = _controller.CalculateHealthScore(null);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public void CalculateHealthScore_CalculatorThrowsException_ReturnsBadRequest()
    {
        // Arrange
        var request = new HealthScoreRequest();

        _calculatorMock.Setup(x => x.CalculateScore(It.IsAny<HealthScoreRequest>()))
            .Throws(new Exception("Test exception"));

        // Act
        var result = _controller.CalculateHealthScore(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }
}