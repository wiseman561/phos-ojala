using Phos.HealthScore.Models;

namespace Phos.HealthScore.Services;

public interface IHealthScoreCalculator
{
    HealthScoreResponse CalculateScore(HealthScoreRequest request);
} 