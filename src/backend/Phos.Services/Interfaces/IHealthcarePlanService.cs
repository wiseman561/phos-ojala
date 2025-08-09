using Phos.Contracts.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;

namespace Phos.Services.Interfaces
{
    public interface IHealthcarePlanService
    {
        /// <summary>
        /// Gets all healthcare plans
        /// </summary>
        /// <returns>A collection of healthcare plan DTOs</returns>
        Task<IEnumerable<HealthcarePlanDto>> GetAllHealthcarePlansAsync();

        /// <summary>
        /// Gets all plans (alias for GetAllHealthcarePlansAsync)
        /// </summary>
        /// <returns>A collection of healthcare plan DTOs</returns>
        Task<IEnumerable<HealthcarePlanDto>> GetAllPlansAsync();

        /// <summary>
        /// Gets a healthcare plan by ID
        /// </summary>
        /// <param name="id">The healthcare plan ID</param>
        /// <returns>The healthcare plan DTO if found, null otherwise</returns>
        Task<HealthcarePlanDto> GetHealthcarePlanByIdAsync(string id);

        /// <summary>
        /// Gets a plan by ID (alias for GetHealthcarePlanByIdAsync)
        /// </summary>
        /// <param name="id">The healthcare plan ID</param>
        /// <returns>The healthcare plan DTO if found, null otherwise</returns>
        Task<HealthcarePlanDto> GetPlanByIdAsync(string id);

        /// <summary>
        /// Gets a healthcare plan for a specific patient
        /// </summary>
        /// <param name="patientId">The patient ID</param>
        /// <returns>The healthcare plan DTO if found, null otherwise</returns>
        Task<HealthcarePlanDto> GetHealthcarePlanByPatientIdAsync(string patientId);

        /// <summary>
        /// Gets plans for a specific patient (alias for GetHealthcarePlanByPatientIdAsync)
        /// </summary>
        /// <param name="patientId">The patient ID</param>
        /// <returns>A collection of healthcare plan DTOs</returns>
        Task<IEnumerable<HealthcarePlanDto>> GetPlansByPatientIdAsync(string patientId);

        /// <summary>
        /// Gets plans for a specific patient (alias used by DashboardController).
        /// </summary>
        /// <param name="patientId">The patient ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>A collection of healthcare plan DTOs</returns>
        Task<IEnumerable<HealthcarePlanDto>> GetPatientHealthcarePlansAsync(string patientId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Creates a new healthcare plan
        /// </summary>
        /// <param name="planDto">The healthcare plan creation DTO</param>
        /// <returns>The created healthcare plan DTO</returns>
        Task<HealthcarePlanDto> CreateHealthcarePlanAsync(HealthcarePlanCreateDto planDto);

        /// <summary>
        /// Creates a new healthcare plan (alias for CreateHealthcarePlanAsync)
        /// </summary>
        /// <param name="planDto">The healthcare plan DTO</param>
        /// <returns>The created healthcare plan DTO</returns>
        Task<HealthcarePlanDto> CreatePlanAsync(HealthcarePlanDto planDto);

        /// <summary>
        /// Updates an existing healthcare plan
        /// </summary>
        /// <param name="planDto">The healthcare plan update DTO</param>
        /// <returns>True if updated, false if not found</returns>
        Task<bool> UpdateHealthcarePlanAsync(HealthcarePlanUpdateDto planDto);

        /// <summary>
        /// Deletes a healthcare plan
        /// </summary>
        /// <param name="id">The healthcare plan ID</param>
        /// <returns>True if deleted, false if not found</returns>
        Task<bool> DeleteHealthcarePlanAsync(string id);

        /// <summary>
        /// Gets count of active plans
        /// </summary>
        /// <returns>Count of active plans</returns>
        Task<int> GetActivePlansCountAsync();

        /// <summary>
        /// Gets count of active plans for a provider
        /// </summary>
        /// <param name="providerId">Provider ID</param>
        /// <returns>Count of active plans for the provider</returns>
        Task<int> GetProviderActivePlansCountAsync(string providerId);
        Task<bool> UpdatePlanAsync(HealthcarePlanDto planDto);
        Task<bool> DeletePlanAsync(string id);
        Task<IEnumerable<HealthcarePlanDto>> GetAvailablePlansAsync();
        Task<bool> AssignPlanToPatientAsync(string planId, string patientId);
    }
}
