using Phos.Contracts.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Phos.Data;
using AutoMapper;
using Phos.Contracts.Models;
using Phos.Services.Interfaces;

namespace Phos.Services.Implementations
{
    public class MedicalRecordService : IMedicalRecordService
    {
        private readonly PhosDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<MedicalRecordService> _logger;

        public MedicalRecordService(
            PhosDbContext context,
            IMapper mapper,
            ILogger<MedicalRecordService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public Task<IEnumerable<MedicalRecordDto>> GetAllMedicalRecordsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<MedicalRecordDto>> GetAllRecordsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<MedicalRecordDto> GetMedicalRecordByIdAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<MedicalRecordDto>> GetMedicalRecordsByPatientIdAsync(string patientId)
        {
            throw new NotImplementedException();
        }

        public Task<MedicalRecordDto> CreateMedicalRecordAsync(MedicalRecordCreateDto recordDto)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Adapter overload so that controllers/tests can pass a full MedicalRecordDto.
        /// Maps it back to your existing update‐DTO and calls through.
        /// </summary>
        public async Task<bool> UpdateMedicalRecordAsync(MedicalRecordDto recordDto)
        {
            var updateDto = new MedicalRecordUpdateDto
            {
                Id = recordDto.Id,
                RecordDate = recordDto.RecordDate,
                Diagnosis = recordDto.Diagnosis,
                Treatment = recordDto.Treatment,
                Notes = recordDto.Notes
            };

            return await UpdateMedicalRecordAsync(updateDto);
        }

        public Task<bool> UpdateMedicalRecordAsync(MedicalRecordUpdateDto recordDto)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteMedicalRecordAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<ChartData>> GetRecordsByTypeAsync()
        {
            throw new NotImplementedException();
        }

        public Task<int> GetPendingRecordsCountAsync()
        {
            throw new NotImplementedException();
        }

        public Task<int> GetProviderPendingRecordsCountAsync(string providerId)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<ChartData>> GetProviderRecordsByTypeAsync(string providerId)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<MedicalRecordDto>> GetPatientRecentRecordsAsync(string patientId)
        {
            throw new NotImplementedException();
        }
    }
}
