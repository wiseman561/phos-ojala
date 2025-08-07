using System;
using System.Collections.Generic;

namespace Phos.Services.Models
{
    /// <summary>
    /// Model classes for the integration services
    /// </summary>
    
    // Authentication Models
    public class LegacyAuthRequest
    {
        public string LegacyToken { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class LegacyTokenValidationRequest
    {
        public string LegacyToken { get; set; }
    }

    public class UserMigrationRequest
    {
        public string LegacyUserId { get; set; }
    }

    public class LegacyAuthValidationResult
    {
        public bool IsValid { get; set; }
        public string UserId { get; set; }
        public Dictionary<string, string> UserClaims { get; set; } = new Dictionary<string, string>();
    }

    public class UserMigrationResult
    {
        public bool Success { get; set; }
        public string NewUserId { get; set; }
        public string Message { get; set; }
        public string ErrorMessage { get; set; }
    }

    public class User
    {
        public string Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string LegacyUserId { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }

    // AI Engine Models
    public class HealthScoreResult
    {
        public bool Success { get; set; }
        public string PatientId { get; set; }
        public double Score { get; set; }
        public DateTime ScoreDate { get; set; }
        public string[] Factors { get; set; }
        public string Trend { get; set; }
        public string[] RecommendedActions { get; set; }
        public string ErrorMessage { get; set; }
    }

    public class RiskAssessmentResult
    {
        public bool Success { get; set; }
        public string PatientId { get; set; }
        public string OverallRisk { get; set; }
        public Dictionary<string, string> RiskCategories { get; set; }
        public DateTime AssessmentDate { get; set; }
        public DateTime NextAssessmentDue { get; set; }
        public string[] PreventiveActions { get; set; }
        public string ErrorMessage { get; set; }
    }

    public class ForecastResult
    {
        public bool Success { get; set; }
        public string PatientId { get; set; }
        public string MetricType { get; set; }
        public DateTime ForecastDate { get; set; }
        public Dictionary<string, double> ForecastValues { get; set; }
        public double Confidence { get; set; }
        public string[] Alerts { get; set; }
        public string ErrorMessage { get; set; }
    }
}
