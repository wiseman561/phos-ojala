using Phos.Contracts.DTOs;
using Phos.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Phos.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Phos.Data.Entities;
using AutoMapper;

namespace Phos.Services.Implementations
{
    public class HealthcarePlanService : IHealthcarePlanService
    {
        private readonly PhosDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly ILogger<HealthcarePlanService> _logger;

        public HealthcarePlanService(
            PhosDbContext dbContext,
            IMapper mapper,
            ILogger<HealthcarePlanService> logger)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<IEnumerable<HealthcarePlanDto>> GetAllPlansAsync()
        {
            return await GetAllHealthcarePlansAsync();
        }

        public async Task<HealthcarePlanDto> GetPlanByIdAsync(string id)
        {
            return await GetHealthcarePlanByIdAsync(id);
        }

        public async Task<IEnumerable<HealthcarePlanDto>> GetPlansByPatientIdAsync(string patientId)
        {
            try
            {
                var plans = await _dbContext.HealthcarePlans
                    .AsNoTracking()
                    .Include(p => p.Patient)
                    .Where(p => p.PatientId == patientId)
                    .ToListAsync();

                return _mapper.Map<IEnumerable<HealthcarePlanDto>>(plans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving healthcare plans for patient {Patient}", patientId);
                throw;
            }
        }

        public async Task<int> GetActivePlansCountAsync()
        {
            try
            {
                return await _dbContext.HealthcarePlans
                    .AsNoTracking()
                    .Where(p => p.Status == "Active")
                    .CountAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error counting active healthcare plans");
                throw;
            }
        }

        public async Task<int> GetProviderActivePlansCountAsync(string providerId)
        {
            try
            {
                if (int.TryParse(providerId, out int pid))
                {
                    return await _dbContext.HealthcarePlans
                        .AsNoTracking()
                        .Include(p => p.Patient)
                        .Where(p => p.Status == "Active" && p.Patient != null && p.Patient.ProviderId == pid)
                        .CountAsync();
                }

                _logger.LogWarning("Invalid provider ID {ProviderId}", providerId);
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error counting active plans for provider {Provider}", providerId);
                throw;
            }
        }

        public async Task<IEnumerable<HealthcarePlanDto>> GetAllHealthcarePlansAsync()
        {
            try
            {
                var plans = await _dbContext.HealthcarePlans
                    .AsNoTracking()
                    .Include(p => p.Patient)
                    .ToListAsync();

                return _mapper.Map<IEnumerable<HealthcarePlanDto>>(plans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all healthcare plans");
                throw;
            }
        }

        public async Task<HealthcarePlanDto> GetHealthcarePlanByIdAsync(string id)
        {
            try
            {
                var plan = await _dbContext.HealthcarePlans
                    .AsNoTracking()
                    .Include(p => p.Patient)
                    .FirstOrDefaultAsync(p => p.Id == id);

                return _mapper.Map<HealthcarePlanDto>(plan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving plan {PlanId}", id);
                throw;
            }
        }

        public async Task<HealthcarePlanDto> GetHealthcarePlanByPatientIdAsync(string patientId)
        {
            try
            {
                var plan = await _dbContext.HealthcarePlans
                    .AsNoTracking()
                    .Include(p => p.Patient)
                    .FirstOrDefaultAsync(p => p.PatientId == patientId);

                return _mapper.Map<HealthcarePlanDto>(plan);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving plan for patient {Patient}", patientId);
                throw;
            }
        }

        public async Task<HealthcarePlanDto> CreateHealthcarePlanAsync(HealthcarePlanCreateDto planDto)
        {
            try
            {
                var plan = _mapper.Map<HealthcarePlan>(planDto);
                plan.Id = Guid.NewGuid().ToString();
                plan.CreatedAt = DateTime.UtcNow;
                plan.UpdatedAt = DateTime.UtcNow;

                await _dbContext.HealthcarePlans.AddAsync(plan);
                await _dbContext.SaveChangesAsync();

                var created = await _dbContext.HealthcarePlans
                    .Include(p => p.Patient)
                    .FirstOrDefaultAsync(p => p.Id == plan.Id);

                return _mapper.Map<HealthcarePlanDto>(created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating healthcare plan");
                throw;
            }
        }

        public async Task<bool> UpdateHealthcarePlanAsync(HealthcarePlanUpdateDto planDto)
        {
            try
            {
                var existing = await _dbContext.HealthcarePlans
                    .FirstOrDefaultAsync(p => p.Id == planDto.Id);

                if (existing == null) return false;

                _mapper.Map(planDto, existing);
                existing.UpdatedAt = DateTime.UtcNow;

                _dbContext.HealthcarePlans.Update(existing);
                await _dbContext.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating healthcare plan {PlanId}", planDto.Id);
                throw;
            }
        }

        public async Task<bool> DeleteHealthcarePlanAsync(string id)
        {
            try
            {
                var existing = await _dbContext.HealthcarePlans
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (existing == null) return false;

                _dbContext.HealthcarePlans.Remove(existing);
                await _dbContext.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting healthcare plan {PlanId}", id);
                throw;
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // Implementations for the interface methods that were missing:
        // ─────────────────────────────────────────────────────────────────

        public async Task<bool> UpdatePlanAsync(HealthcarePlanDto planDto)
        {
            // Map the DTO to the UpdateDto and call the existing method
            var updateDto = _mapper.Map<HealthcarePlanUpdateDto>(planDto);
            return await UpdateHealthcarePlanAsync(updateDto);
        }

        public async Task<bool> DeletePlanAsync(string id)
        {
            return await DeleteHealthcarePlanAsync(id);
        }

        public Task GetAvailablePlansAsync()
        {
            // TODO: implement actual logic (e.g. filter by some criteria)
            // For now, return a completed task so the interface is satisfied.
            return Task.CompletedTask;
        }

        public async Task<bool> AssignPlanToPatientAsync(string planId, string patientId)
        {
            var plan = await _dbContext.HealthcarePlans
                .FirstOrDefaultAsync(p => p.Id == planId);

            if (plan == null) return false;

            plan.PatientId = patientId;
            plan.UpdatedAt = DateTime.UtcNow;
            _dbContext.HealthcarePlans.Update(plan);
            await _dbContext.SaveChangesAsync();
            return true;
        }
    }
}
