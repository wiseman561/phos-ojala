using System;
using System.Threading.Tasks;
using Phos.Contracts.Models;
using Phos.Services.Interfaces;

namespace Phos.Services.Implementations
{
    public class ForecastingService : IForecastingService
    {
        public ForecastingService()
        {
            // TODO: Inject any required dependencies
        }

        public ForecastData GetForecast(string patientId)
        {
            throw new NotImplementedException();
        }

        public ForecastData GetForecastWithTimeframe(string patientId, int daysAhead)
        {
            throw new NotImplementedException();
        }

        public IEnumerable<MetricForecast> GetMetricForecasts(string patientId, IEnumerable<string> metricNames)
        {
            throw new NotImplementedException();
        }

        // TODO: Implement IForecastingService methods
        // public Task<ForecastResultDto> GetForecastAsync(ForecastRequestDto request)
        // {
        //     throw new NotImplementedException();
        // }
    }
}
