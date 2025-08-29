using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Phos.Contracts.DTOs;
using Phos.Services.Interfaces;
using Phos.Contracts.Models;
using System.Threading.Tasks;

namespace Phos.Api.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IPatientService _patientService;
        private readonly IAppointmentService _appointmentService;
        private readonly IMedicalRecordService _medicalRecordService;
        private readonly IHealthcarePlanService _healthcarePlanService;

        public DashboardController(
            IPatientService patientService,
            IAppointmentService appointmentService,
            IMedicalRecordService medicalRecordService,
            IHealthcarePlanService healthcarePlanService)
        {
            _patientService = patientService;
            _appointmentService = appointmentService;
            _medicalRecordService = medicalRecordService;
            _healthcarePlanService = healthcarePlanService;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardData()
        {
            // Get counts for dashboard stats
            var totalPatients = await _patientService.GetTotalPatientsCountAsync();
            var appointmentsToday = await _appointmentService.GetTodayAppointmentsCountAsync();
            var pendingRecords = await _medicalRecordService.GetPendingRecordsCountAsync();
            var activePlans = await _healthcarePlanService.GetActivePlansCountAsync();

            // Get data for charts
            var patientsByAge = await _patientService.GetPatientsByAgeGroupAsync();
            var appointmentsByMonth = await _appointmentService.GetAppointmentsByMonthAsync();
            var recordsByType = await _medicalRecordService.GetRecordsByTypeAsync();

            // Construct dashboard data
            var dashboardData = new Phos.Contracts.DTOs.DashboardData
            {
                Stats = new DashboardStats
                {
                    TotalPatients = totalPatients,
                    AppointmentsToday = appointmentsToday,
                    PendingRecords = pendingRecords,
                    ActivePlans = activePlans
                },
                PatientsByAge = patientsByAge,
                AppointmentsByMonth = appointmentsByMonth,
                RecordsByType = recordsByType
            };

            return Ok(dashboardData);
        }

        // GET api/dashboard/provider/{providerId}
        [HttpGet("provider/{providerId}")]
        [Authorize(Roles = "Provider,Admin")]
        public async Task<IActionResult> GetProviderDashboardData(string providerId)
        {
            var currentUser = User.FindFirst("sub")?.Value;
            if (User.IsInRole("Provider") && currentUser != providerId)
                return Forbid();

            // Get provider-specific dashboard data
            var totalPatients = await _patientService.GetProviderPatientsCountAsync(providerId);
            var appointmentsToday = await _appointmentService.GetProviderTodayAppointmentsCountAsync(providerId);
            var pendingRecords = await _medicalRecordService.GetProviderPendingRecordsCountAsync(providerId);
            var activePlans = await _healthcarePlanService.GetProviderActivePlansCountAsync(providerId);

            // Get data for charts
            int providerIdInt;
            if (int.TryParse(providerId, out providerIdInt))
            {
                var patientsByAge = await _patientService.GetProviderPatientsByAgeGroupAsync(providerId);
                var appointmentsByMonth = await _appointmentService.GetProviderAppointmentsByMonthAsync(providerId);
                var recordsByType = await _medicalRecordService.GetProviderRecordsByTypeAsync(providerId);

                // Construct dashboard data
                var dashboardData = new Phos.Contracts.DTOs.DashboardData
                {
                    Stats = new DashboardStats
                    {
                        TotalPatients = totalPatients,
                        AppointmentsToday = appointmentsToday,
                        PendingRecords = pendingRecords,
                        ActivePlans = activePlans
                    },
                    PatientsByAge = patientsByAge,
                    AppointmentsByMonth = appointmentsByMonth,
                    RecordsByType = recordsByType
                };

                return Ok(dashboardData);
            }

            return BadRequest("Invalid provider ID format");
        }

        // GET api/dashboard/patient/{patientId}
        [HttpGet("patient/{patientId}")]
        [Authorize(Roles = "Patient,Provider,Admin")]
        public async Task<IActionResult> GetPatientDashboardData(string patientId)
        {
            var currentUser = User.FindFirst("sub")?.Value;
            if (User.IsInRole("Patient") && currentUser != patientId)
                return Forbid();

            // Get patient-specific dashboard data
            var patient = await _patientService.GetPatientByIdAsync(patientId);
            if (patient == null)
                return NotFound("Patient not found");

            var appointments = await _appointmentService.GetPatientAppointmentsAsync(patientId);
            var medicalRecords = await _medicalRecordService.GetPatientMedicalRecordsAsync(patientId);
            var healthcarePlans = await _healthcarePlanService.GetPatientHealthcarePlansAsync(patientId);

            var patientDashboardData = new Phos.Contracts.DTOs.PatientDashboardData
            {
                Patient = patient,
                Appointments = appointments,
                MedicalRecords = medicalRecords,
                HealthcarePlans = healthcarePlans
            };

            return Ok(patientDashboardData);
        }
    }
}
