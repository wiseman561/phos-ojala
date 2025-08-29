using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Phos.Services.Models
{
    /// <summary>
    /// Represents a health score result from the AI Engine
    /// </summary>
    public class HealthScoreResult
    {
        /// <summary>
        /// Gets or sets the patient identifier.
        /// </summary>
        [JsonPropertyName("patientId")]
        public string PatientId { get; set; }

        /// <summary>
        /// Gets or sets the health score value (0-100).
        /// </summary>
        [JsonPropertyName("score")]
        public double Score { get; set; }

        /// <summary>
        /// Gets or sets the date and time when the score was calculated.
        /// </summary>
        [JsonPropertyName("scoreDate")]
        public DateTime ScoreDate { get; set; }

        /// <summary>
        /// Gets or sets the factors contributing to the health score.
        /// </summary>
        [JsonPropertyName("factors")]
        public List<string> Factors { get; set; } = new List<string>();

        /// <summary>
        /// Gets or sets the trend of the health score (Improving, Declining, Stable).
        /// </summary>
        [JsonPropertyName("trend")]
        public string Trend { get; set; }

        /// <summary>
        /// Gets or sets the recommended actions based on the health score.
        /// </summary>
        [JsonPropertyName("recommendedActions")]
        public List<string> RecommendedActions { get; set; } = new List<string>();
    }

    /// <summary>
    /// Represents a risk assessment result from the AI Engine
    /// </summary>
    public class RiskAssessmentResult
    {
        /// <summary>
        /// Gets or sets the patient identifier.
        /// </summary>
        [JsonPropertyName("patientId")]
        public string PatientId { get; set; }

        /// <summary>
        /// Gets or sets the overall risk level (Low, Medium, High, Critical).
        /// </summary>
        [JsonPropertyName("overallRisk")]
        public string OverallRisk { get; set; }

        /// <summary>
        /// Gets or sets the risk categories and their respective risk levels.
        /// </summary>
        [JsonPropertyName("riskCategories")]
        public Dictionary<string, string> RiskCategories { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Gets or sets the date and time when the assessment was performed.
        /// </summary>
        [JsonPropertyName("assessmentDate")]
        public DateTime AssessmentDate { get; set; }

        /// <summary>
        /// Gets or sets the date and time when the next assessment is due.
        /// </summary>
        [JsonPropertyName("nextAssessmentDue")]
        public DateTime NextAssessmentDue { get; set; }

        /// <summary>
        /// Gets or sets the preventive actions recommended based on the risk assessment.
        /// </summary>
        [JsonPropertyName("preventiveActions")]
        public List<string> PreventiveActions { get; set; } = new List<string>();
    }

    /// <summary>
    /// Represents care plan recommendations from the AI Engine
    /// </summary>
    public class CarePlanRecommendationResult
    {
        /// <summary>
        /// Gets or sets the patient identifier.
        /// </summary>
        [JsonPropertyName("patientId")]
        public string PatientId { get; set; }

        /// <summary>
        /// Gets or sets the recommended care plan title.
        /// </summary>
        [JsonPropertyName("title")]
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the recommended care plan description.
        /// </summary>
        [JsonPropertyName("description")]
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the recommended goals for the care plan.
        /// </summary>
        [JsonPropertyName("goals")]
        public List<CarePlanGoal> Goals { get; set; } = new List<CarePlanGoal>();

        /// <summary>
        /// Gets or sets the recommended tasks for the care plan.
        /// </summary>
        [JsonPropertyName("tasks")]
        public List<CarePlanTask> Tasks { get; set; } = new List<CarePlanTask>();

        /// <summary>
        /// Gets or sets the clinical reasoning behind the recommendations.
        /// </summary>
        [JsonPropertyName("clinicalReasoning")]
        public string ClinicalReasoning { get; set; }

        /// <summary>
        /// Gets or sets the date and time when the recommendations were generated.
        /// </summary>
        [JsonPropertyName("generatedDate")]
        public DateTime GeneratedDate { get; set; }
    }

    /// <summary>
    /// Represents a care plan goal recommendation
    /// </summary>
    public class CarePlanGoal
    {
        /// <summary>
        /// Gets or sets the goal description.
        /// </summary>
        [JsonPropertyName("description")]
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the target date for achieving the goal.
        /// </summary>
        [JsonPropertyName("targetDate")]
        public DateTime? TargetDate { get; set; }

        /// <summary>
        /// Gets or sets the priority of the goal (High, Medium, Low).
        /// </summary>
        [JsonPropertyName("priority")]
        public string Priority { get; set; }
    }

    /// <summary>
    /// Represents a care plan task recommendation
    /// </summary>
    public class CarePlanTask
    {
        /// <summary>
        /// Gets or sets the task title.
        /// </summary>
        [JsonPropertyName("title")]
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the task description.
        /// </summary>
        [JsonPropertyName("description")]
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the recommended assignee role (RN, MD, Patient, etc.).
        /// </summary>
        [JsonPropertyName("assignee")]
        public string Assignee { get; set; }

        /// <summary>
        /// Gets or sets the frequency of the task (Daily, Weekly, Monthly, etc.).
        /// </summary>
        [JsonPropertyName("frequency")]
        public string Frequency { get; set; }
    }

    /// <summary>
    /// Represents a patient data analysis result from the AI Engine
    /// </summary>
    public class PatientDataAnalysisResult
    {
        /// <summary>
        /// Gets or sets the patient identifier.
        /// </summary>
        [JsonPropertyName("patientId")]
        public string PatientId { get; set; }

        /// <summary>
        /// Gets or sets the type of data that was analyzed.
        /// </summary>
        [JsonPropertyName("dataType")]
        public string DataType { get; set; }

        /// <summary>
        /// Gets or sets the start date of the analysis period.
        /// </summary>
        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// Gets or sets the end date of the analysis period.
        /// </summary>
        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Gets or sets the identified trends in the data.
        /// </summary>
        [JsonPropertyName("trends")]
        public List<DataTrend> Trends { get; set; } = new List<DataTrend>();

        /// <summary>
        /// Gets or sets the insights derived from the data.
        /// </summary>
        [JsonPropertyName("insights")]
        public List<string> Insights { get; set; } = new List<string>();

        /// <summary>
        /// Gets or sets the date and time when the analysis was performed.
        /// </summary>
        [JsonPropertyName("analysisDate")]
        public DateTime AnalysisDate { get; set; }
    }

    /// <summary>
    /// Represents a trend identified in patient data
    /// </summary>
    public class DataTrend
    {
        /// <summary>
        /// Gets or sets the name of the trend.
        /// </summary>
        [JsonPropertyName("name")]
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the description of the trend.
        /// </summary>
        [JsonPropertyName("description")]
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the significance of the trend (High, Medium, Low).
        /// </summary>
        [JsonPropertyName("significance")]
        public string Significance { get; set; }

        /// <summary>
        /// Gets or sets the data points supporting the trend.
        /// </summary>
        [JsonPropertyName("dataPoints")]
        public Dictionary<string, double> DataPoints { get; set; } = new Dictionary<string, double>();
    }
}
