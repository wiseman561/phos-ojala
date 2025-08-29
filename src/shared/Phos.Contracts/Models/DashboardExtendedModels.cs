using System;
using System.Collections.Generic;

namespace Phos.Contracts.Models
{
    // Dashboard Models for the new frontend services
    public class RNDashboardData
    {
        public List<ClinicalAlert> ActiveAlerts { get; set; } = new List<ClinicalAlert>();
        public List<NurseAssistantRecommendation> PendingRecommendations { get; set; } = new List<NurseAssistantRecommendation>();
        public List<PatientVitalsSnapshot> PatientVitals { get; set; } = new List<PatientVitalsSnapshot>();
        public HealthScoreDistribution HealthScoreDistribution { get; set; } = new HealthScoreDistribution();
        public SystemStatus SystemStatus { get; set; } = new SystemStatus();
    }

    public class PatientVitalsSnapshot
    {
        public string PatientId { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public VitalSignsData LatestVitals { get; set; } = null!;
        public bool HasAbnormalValues { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class HealthScoreDistribution
    {
        public int HighRiskCount { get; set; }
        public int MediumRiskCount { get; set; }
        public int LowRiskCount { get; set; }
        public List<ChartData> DistributionData { get; set; } = new List<ChartData>();
    }

    public class SystemStatus
    {
        public bool AllSystemsOperational { get; set; }
        public List<ServiceStatus> Services { get; set; } = new List<ServiceStatus>();
        public DateTime LastUpdated { get; set; }
    }

    public class ServiceStatus
    {
        public string ServiceName { get; set; } = null!;
        public bool IsOperational { get; set; }
        public string StatusMessage { get; set; } = string.Empty;
    }

    public class EmployerDashboardData
    {
        public CostSavingsAnalysis CostSavings { get; set; } = new CostSavingsAnalysis();
        public ProgramEffectiveness ProgramEffectiveness { get; set; } = new ProgramEffectiveness();
        public List<UserActivity> RecentActivity { get; set; } = new List<UserActivity>();
        public List<TelehealthSession> UpcomingSessions { get; set; } = new List<TelehealthSession>();
    }

    public class CostSavingsAnalysis
    {
        public double TotalSavingsYTD { get; set; }
        public double ProjectedAnnualSavings { get; set; }
        public double SavingsPerEmployee { get; set; }
        public List<ChartData> SavingsByCategory { get; set; } = new List<ChartData>();
        public List<ChartData> SavingsTrend { get; set; } = new List<ChartData>();
    }

    public class ProgramEffectiveness
    {
        public double EngagementRate { get; set; }
        public double HealthScoreImprovement { get; set; }
        public double PreventiveVisitIncrease { get; set; }
        public double EmergencyVisitReduction { get; set; }
        public List<ChartData> EffectivenessMetrics { get; set; } = new List<ChartData>();
    }

    public class UserActivity
    {
        public string UserId { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public string ActivityType { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime Timestamp { get; set; }
    }

    public class TelehealthSession
    {
        public string SessionId { get; set; } = null!;
        public string ProviderName { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public DateTime ScheduledTime { get; set; }
        public int DurationMinutes { get; set; }
        public string SessionType { get; set; } = null!;
        public string Status { get; set; } = null!;
    }
}
