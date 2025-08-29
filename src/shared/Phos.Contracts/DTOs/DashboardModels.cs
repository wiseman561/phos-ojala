using System;
using System.Collections.Generic;
using Phos.Contracts.Models;

namespace Phos.Contracts.DTOs
{
    /// <summary>
    /// Represents summary data for provider dashboards.
    /// TODO: Interim shape to match controller expectations; extend with richer types later.
    /// </summary>
    public class DashboardData
    {
        /// <summary>
        /// Aggregate counts/metrics for dashboard quick stats.
        /// </summary>
        public DashboardStats? Stats { get; set; } = new DashboardStats();

        /// <summary>
        /// Patients grouped by age, for charting.
        /// </summary>
        public IEnumerable<ChartData> PatientsByAge { get; set; } = Array.Empty<ChartData>();

        /// <summary>
        /// Appointments aggregated by month, for charting.
        /// </summary>
        public IEnumerable<ChartData> AppointmentsByMonth { get; set; } = Array.Empty<ChartData>();

        /// <summary>
        /// Medical records grouped by type, for charting.
        /// </summary>
        public IEnumerable<ChartData> RecordsByType { get; set; } = Array.Empty<ChartData>();
    }

    /// <summary>
    /// Represents summary data for patient dashboards.
    /// TODO: Interim shape to match controller expectations; extend with richer types later.
    /// </summary>
    public class PatientDashboardData
    {
        /// <summary>
        /// The patient profile for this dashboard.
        /// </summary>
        public PatientDto? Patient { get; set; }

        /// <summary>
        /// Appointments relevant to the patient dashboard view.
        /// </summary>
        public IEnumerable<AppointmentDto> Appointments { get; set; } = Array.Empty<AppointmentDto>();

        /// <summary>
        /// Medical records relevant to the patient dashboard view.
        /// </summary>
        public IEnumerable<MedicalRecordDto> MedicalRecords { get; set; } = Array.Empty<MedicalRecordDto>();

        /// <summary>
        /// Healthcare plans associated with the patient.
        /// </summary>
        public IEnumerable<HealthcarePlanDto> HealthcarePlans { get; set; } = Array.Empty<HealthcarePlanDto>();
    }
}
