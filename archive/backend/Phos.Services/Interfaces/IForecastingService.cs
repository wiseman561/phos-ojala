using System;
using System.Collections.Generic;
using Phos.Contracts.Models;

namespace Phos.Services.Interfaces
{
    public interface IForecastingService
    {
        ForecastData GetForecast(string patientId);
        IEnumerable<MetricForecast> GetMetricForecasts(string patientId, IEnumerable<string> metricNames);
        ForecastData GetForecastWithTimeframe(string patientId, int daysAhead);
    }
}
