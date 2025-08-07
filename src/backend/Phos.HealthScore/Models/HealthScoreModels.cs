namespace Phos.HealthScore.Models;

public class HealthScoreModels
{
    // Add your model classes here
}

public class HealthScoreRequest
{
    public PatientDemographics PatientDemographics { get; set; } = new();
    public List<VitalSign> VitalSigns { get; set; } = new();
    public List<LabResult> LabResults { get; set; } = new();
    public List<Medication> Medications { get; set; } = new();
}

public class HealthScoreResponse
{
    public double Score { get; set; }
    public RiskTier RiskTier { get; set; }
    public List<RiskFactor> RiskFactors { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}

public class PatientDemographics
{
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public int PreviousHospitalizations { get; set; }
    public bool HasDiabetes { get; set; }
    public bool HasHeartDisease { get; set; }
    public bool HasHypertension { get; set; }
    public bool IsSmoker { get; set; }
}

public class VitalSign
{
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
}

public class LabResult
{
    public string TestName { get; set; } = string.Empty;
    public double Value { get; set; }
    public double MinNormalValue { get; set; }
    public double MaxNormalValue { get; set; }
    public string Unit { get; set; } = string.Empty;
}

public class Medication
{
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public bool IsHighRisk { get; set; }
}

public class RiskFactor
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double ContributionToScore { get; set; }
}

public enum RiskTier
{
    Low,
    Moderate,
    High,
    VeryHigh,
    Critical
}
