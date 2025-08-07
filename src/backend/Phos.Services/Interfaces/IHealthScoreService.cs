using System;
using System.Collections.Generic;
using Phos.Contracts.Models;

namespace Phos.Services.Interfaces
{
    public interface IHealthScoreService
    {
        HealthScoreData GetHealthScore(string patientId);
        IEnumerable<HealthScoreData> GetHealthScoreHistory(string patientId, DateTime startDate, DateTime endDate);
        IEnumerable<ChartData> GetHealthScoreDistribution();

    }
}
