using System;
using System.Collections.Generic;

namespace Phos.Contracts.Models
{
    // AI Engine Models
   
        public class HealthScoreComponent
    {
        public string Name { get; set; } = null!;
        public double Value { get; set; }
        public double Weight { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class RiskAssessment
    {
        public string PatientId { get; set; } = null!;
        public double RiskScore { get; set; }
        public string RiskLevel { get; set; } = null!;
        public List<RiskFactor> RiskFactors { get; set; } = new List<RiskFactor>();
        public DateTime AssessedAt { get; set; }
    }

    public class RiskFactor
    {
        public string Name { get; set; } = null!;
        public double Contribution { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool IsModifiable { get; set; }
    }

    public class ForecastData
    {
        public string PatientId { get; set; } = null!;
        public DateTime ForecastDate { get; set; }
        public List<MetricForecast> Metrics { get; set; } = new List<MetricForecast>();
    }

    public class MetricForecast
    {
        public string MetricName { get; set; } = null!;
        public double CurrentValue { get; set; }
        public double PredictedValue { get; set; }
        public double ConfidenceInterval { get; set; }
        public string Trend { get; set; } = null!;
    }
}
