using System;
using System.Collections.Generic;
using System.Linq;
using Phos.Contracts.Models;
using Phos.Services.Interfaces;

namespace Phos.Services.Implementations
{
    public class HealthScoreService : IHealthScoreService
    {
        private readonly IAIEngineClient _aiEngineClient;

        public HealthScoreService(IAIEngineClient aiEngineClient)
        {
            _aiEngineClient = aiEngineClient;
        }

        public HealthScoreData GetHealthScore(string patientId)
        {
            // Synchronous wrapper for async AIEngineClient call
            var result = _aiEngineClient.GetHealthScoreAsync(patientId).GetAwaiter().GetResult();
            return new HealthScoreData
            {
                PatientId = result.PatientId,
                Score = result.Score,
                Status = result.Trend ?? "Unknown",
                DateRecorded = result.ScoreDate
            };
        }

        public IEnumerable<ChartData> GetHealthScoreDistribution()
        {
            // Example: Aggregate mock data for distribution (replace with real aggregation if available)
            // In production, this should call an AI Engine endpoint or aggregate from patient data
            var distribution = new List<ChartData>
            {
                new ChartData { Label = "0-20", Value = 5 },
                new ChartData { Label = "21-40", Value = 15 },
                new ChartData { Label = "41-60", Value = 35 },
                new ChartData { Label = "61-80", Value = 30 },
                new ChartData { Label = "81-100", Value = 15 }
            };
            return distribution;
        }

        public IEnumerable<HealthScoreData> GetHealthScoreHistory(string patientId, DateTime startDate, DateTime endDate)
        {
            // Example: Return a list of scores over time (replace with real data if available)
            // In production, this should call an AI Engine endpoint or aggregate from patient data
            var history = new List<HealthScoreData>();
            var random = new Random(patientId.GetHashCode());
            var days = (endDate - startDate).Days;
            for (int i = 0; i <= days; i++)
            {
                var date = startDate.AddDays(i);
                history.Add(new HealthScoreData
                {
                    PatientId = patientId,
                    Score = 50 + random.NextDouble() * 50, // Random score between 50-100
                    Status = "Stable",
                    DateRecorded = date
                });
            }
            return history;
        }
    }
}
