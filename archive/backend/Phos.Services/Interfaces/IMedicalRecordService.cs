using Phos.Contracts.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using Phos.Contracts.Models;

namespace Phos.Services.Interfaces
{
    public interface IMedicalRecordService
    {
        // Controller uses these:
        Task<IEnumerable<MedicalRecordDto>> GetAllRecordsAsync();
        Task<MedicalRecordDto> GetMedicalRecordByIdAsync(string id);
        Task<IEnumerable<MedicalRecordDto>> GetMedicalRecordsByPatientIdAsync(string patientId);
        Task<MedicalRecordDto> CreateMedicalRecordAsync(MedicalRecordCreateDto recordDto);

        // Update via the lightweight UpdateDto
        Task<bool> UpdateMedicalRecordAsync(MedicalRecordUpdateDto recordDto);

        // New overload: allow updating via the full DTO (so controller/tests can pass it directly)
        Task<bool> UpdateMedicalRecordAsync(MedicalRecordDto recordDto);

        Task<bool> DeleteMedicalRecordAsync(string id);

        // Dashboard / analytics helpers
        Task<IEnumerable<ChartData>> GetRecordsByTypeAsync();
        Task<int> GetPendingRecordsCountAsync();
        Task<int> GetProviderPendingRecordsCountAsync(string providerId);
        Task<IEnumerable<ChartData>> GetProviderRecordsByTypeAsync(string providerId);
        Task<IEnumerable<MedicalRecordDto>> GetPatientRecentRecordsAsync(string patientId);

        // Convenience aliases (optional—some tests may call these)
        Task<MedicalRecordDto> GetRecordByIdAsync(string id)
            => GetMedicalRecordByIdAsync(id);

        Task<IEnumerable<MedicalRecordDto>> GetRecordsByPatientIdAsync(string patientId)
            => GetMedicalRecordsByPatientIdAsync(patientId);

        Task<MedicalRecordDto> CreateRecordAsync(MedicalRecordCreateDto recordDto)
            => CreateMedicalRecordAsync(recordDto);

        // Alias for update via full DTO
        Task<bool> UpdateRecordAsync(MedicalRecordDto recordDto)
            => UpdateMedicalRecordAsync(recordDto);

        // Additional methods needed by controllers
        Task<IEnumerable<MedicalRecordDto>> GetRecordsByProviderIdAsync(string providerId);
        Task<bool> DeleteRecordAsync(string id);
        Task<bool> AddPrescriptionToRecordAsync(string recordId, PrescriptionDto prescription);
        Task<IEnumerable<MedicalRecordDto>> GetPendingRecordsAsync();
        Task<IEnumerable<MedicalRecordDto>> GetPatientMedicalRecordsAsync(string patientId);
    }
}
