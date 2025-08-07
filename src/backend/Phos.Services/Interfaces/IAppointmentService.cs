using Phos.Contracts.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Phos.Contracts.Models;

namespace Phos.Services.Interfaces
{
    public interface IAppointmentService
    {
        // Basic CRUD & queries
        Task<IEnumerable<AppointmentDto>> GetAllAppointmentsAsync();
        Task<AppointmentDto?> GetAppointmentByIdAsync(string id);
        Task<IEnumerable<AppointmentDto>> GetAppointmentsByPatientIdAsync(string patientId);
        Task<IEnumerable<AppointmentDto>> GetAppointmentsByProviderIdAsync(string providerId);
        Task<IEnumerable<AppointmentDto>> GetAppointmentsByDateAsync(DateTime date);

        Task<AppointmentDto> CreateAppointmentAsync(AppointmentCreateDto appointmentDto);
        Task<bool> UpdateAppointmentAsync(AppointmentUpdateDto appointmentDto);
        Task<bool> DeleteAppointmentAsync(string id);

        // NEW: status update & availability
        Task<bool> UpdateAppointmentStatusAsync(string appointmentId, string newStatus);
        Task<IEnumerable<DateTime>> GetAvailableSlotsAsync(string providerId, DateTime date);

        // Dashboard helpers
        Task<int> GetTodayAppointmentsCountAsync();
        Task<IEnumerable<ChartData>> GetAppointmentsByMonthAsync();
        Task<int> GetProviderTodayAppointmentsCountAsync(string providerId);
        Task<IEnumerable<ChartData>> GetProviderAppointmentsByMonthAsync(string providerId);

        // Patient-specific
        Task<IEnumerable<AppointmentDto>> GetPatientUpcomingAppointmentsAsync(string patientId);
        Task<IEnumerable<AppointmentDto>> GetPatientAppointmentsAsync(string patientId);
    }
}
