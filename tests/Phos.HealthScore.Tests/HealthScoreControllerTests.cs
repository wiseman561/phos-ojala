using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Phos.HealthScore.Controllers;
using Phos.HealthScore.Models;
using Phos.HealthScore.Services;
using System;
using System.Collections.Generic;
using Xunit;

namespace Phos.HealthScore.Tests
{
    public class HealthScoreControllerTests
    {
        private readonly Mock<IHealthScoreCalculator> _calculatorMock;
        private readonly Mock<ILogger<HealthScoreController>> _loggerMock;
        private readonly HealthScoreController _controller;

        public HealthScoreControllerTests()
        {
            _calculatorMock = new Mock<IHealthScoreCalculator>();
            _loggerMock = new Mock<ILogger<HealthScoreController>>();
            _controller = new HealthScoreController(_calculatorMock.Object, _loggerMock.Object);
        }

        [Fact]
        public void CalculateHealthScore_ValidRequest_ReturnsOkResultWithResponse()
        {
            // Arrange
            var request = new HealthScoreRequest();
            var expectedResponse = new HealthScoreResponse
            {
                Score = 42.5,
                RiskTier = RiskTier.Medium,
                RiskFactors = new List<RiskFactor>
                {
                    new RiskFactor { Name = "Test Factor", Description = "Test Description", ContributionToScore = 10 }
                }
            };

            _calculatorMock.Setup(c => c.CalculateScore(request)).Returns(expectedResponse);

            // Act
            var result = _controller.CalculateHealthScore(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<HealthScoreResponse>(okResult.Value);
            
            Assert.Equal(expectedResponse.Score, response.Score);
            Assert.Equal(expectedResponse.RiskTier, response.RiskTier);
            Assert.Equal(expectedResponse.RiskFactors.Count, response.RiskFactors.Count);
            Assert.Equal(expectedResponse.RiskFactors[0].Name, response.RiskFactors[0].Name);
        }

        [Fact]
        public void CalculateHealthScore_NullRequest_ReturnsBadRequest()
        {
            // Act
            var result = _controller.CalculateHealthScore(null);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void CalculateHealthScore_CalculatorThrowsException_Returns500()
        {
            // Arrange
            var request = new HealthScoreRequest();
            _calculatorMock.Setup(c => c.CalculateScore(request)).Throws(new Exception("Test exception"));

            // Act
            var result = _controller.CalculateHealthScore(request);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
        }

        [Fact]
        public void CalculateHealthScore_VerifyLoggerCalls()
        {
            // Arrange
            var request = new HealthScoreRequest();
            var response = new HealthScoreResponse
            {
                Score = 42.5,
                RiskTier = RiskTier.Medium
            };

            _calculatorMock.Setup(c => c.CalculateScore(request)).Returns(response);

            // Act
            _controller.CalculateHealthScore(request);

            // Assert - Verify logger is called (we can't easily verify exact log messages due to ILogger design)
            _loggerMock.Verify(
                x => x.Log(
                    It.IsAny<LogLevel>(),
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()),
                Times.AtLeast(2));
        }

        [Fact]
        public void CalculateHealthScore_LowRiskPatient_ReturnsLowRiskTier()
        {
            // Arrange
            var request = new HealthScoreRequest();
            var response = new HealthScoreResponse
            {
                Score = 20.0,
                RiskTier = RiskTier.Low
            };

            _calculatorMock.Setup(c => c.CalculateScore(request)).Returns(response);

            // Act
            var result = _controller.CalculateHealthScore(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var responseResult = Assert.IsType<HealthScoreResponse>(okResult.Value);
            
            Assert.Equal(RiskTier.Low, responseResult.RiskTier);
            Assert.Equal(20.0, responseResult.Score);
        }

        [Fact]
        public void CalculateHealthScore_MediumRiskPatient_ReturnsMediumRiskTier()
        {
            // Arrange
            var request = new HealthScoreRequest();
            var response = new HealthScoreResponse
            {
                Score = 50.0,
                RiskTier = RiskTier.Medium
            };

            _calculatorMock.Setup(c => c.CalculateScore(request)).Returns(response);

            // Act
            var result = _controller.CalculateHealthScore(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var responseResult = Assert.IsType<HealthScoreResponse>(okResult.Value);
            
            Assert.Equal(RiskTier.Medium, responseResult.RiskTier);
            Assert.Equal(50.0, responseResult.Score);
        }

        [Fact]
        public void CalculateHealthScore_HighRiskPatient_ReturnsHighRiskTier()
        {
            // Arrange
            var request = new HealthScoreRequest();
            var response = new HealthScoreResponse
            {
                Score = 80.0,
                RiskTier = RiskTier.High
            };

            _calculatorMock.Setup(c => c.CalculateScore(request)).Returns(response);

            // Act
            var result = _controller.CalculateHealthScore(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var responseResult = Assert.IsType<HealthScoreResponse>(okResult.Value);
            
            Assert.Equal(RiskTier.High, responseResult.RiskTier);
            Assert.Equal(80.0, responseResult.Score);
        }
    }
} 