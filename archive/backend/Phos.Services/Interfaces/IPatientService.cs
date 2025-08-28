using System.Collections.Generic;
using System.Threading.Tasks;
using Phos.Contracts.DTOs;
using Phos.Contracts.Models;

namespace Phos.Services.Interfaces
{
    public interface IPatientService
    {
        // --- CRUD ---
        Task<IEnumerable<PatientDto>> GetAllPatientsAsync();
        Task<PatientDto> GetPatientByIdAsync(string id);
        Task<PatientDto> CreatePatientAsync(PatientCreateDto patientDto);
        Task<bool> UpdatePatientAsync(PatientUpdateDto patientDto);
        Task<bool> DeletePatientAsync(string id);

        // --- Dashboard / counts ---
        Task<int> GetTotalPatientsCountAsync();
        Task<IEnumerable<ChartData>> GetPatientsByAgeGroupAsync();

        // --- Provider‑scoped ---
        Task<int> GetProviderPatientsCountAsync(string providerId);
        Task<IEnumerable<ChartData>> GetProviderPatientsByAgeGroupAsync(string providerId);
        Task<IEnumerable<PatientDto>> GetPatientsByProviderIdAsync(string providerId);

        // --- Search ---
        Task<IEnumerable<PatientDto>> SearchPatientsAsync(string query);

        // --- Extended methods used by PatientsController ---
        Task<bool> AssignProviderToPatientAsync(string patientId, string providerId);
        Task<PatientMedicalHistoryDto> GetPatientMedicalHistoryAsync(string patientId);
    }
}
