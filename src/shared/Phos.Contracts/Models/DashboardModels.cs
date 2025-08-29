using System.Collections.Generic;
using Phos.Contracts.DTOs;

namespace Phos.Contracts.Models
{
    public class DashboardData
    {
        public DashboardStats Stats { get; set; } = new DashboardStats();
        public List<ChartData> PatientsByAge { get; set; } = new List<ChartData>();
        public List<ChartData> AppointmentsByMonth { get; set; } = new List<ChartData>();
        public List<ChartData> RecordsByType { get; set; } = new List<ChartData>();
    }

    public class DashboardStats
    {
        public int TotalPatients { get; set; }
        public int AppointmentsToday { get; set; }
        public int PendingRecords { get; set; }
        public int ActivePlans { get; set; }
    }

    public class PatientDashboardData
    {
        public List<AppointmentDto> UpcomingAppointments { get; set; } = new List<AppointmentDto>();
        public List<MedicalRecordDto> RecentMedicalRecords { get; set; } = new List<MedicalRecordDto>();
        public HealthcarePlanDto? ActivePlan { get; set; }
    }
}
