using Phos.HealthScore.Models;

namespace Phos.HealthScore.Services;

public class HealthScoreCalculator : IHealthScoreCalculator
{
    private readonly ILogger<HealthScoreCalculator> _logger;
    private readonly string _aiModelPath;

    public HealthScoreCalculator(ILogger<HealthScoreCalculator> logger, IConfiguration configuration)
    {
        _logger = logger;
        _aiModelPath = Environment.GetEnvironmentVariable("AI_MODEL_PATH") ?? 
                      configuration["AIModelPath"] ?? 
                      "/models/default-model";
    }

    public HealthScoreResponse CalculateScore(HealthScoreRequest request)
    {
        _logger.LogInformation("Calculating health score");
        
        var response = new HealthScoreResponse();
        var riskFactors = new List<RiskFactor>();
        double totalScore = 0;

        // Calculate score components
        var demographicsScore = CalculateDemographicsScore(request.PatientDemographics, riskFactors);
        var vitalsScore = CalculateVitalsScore(request.VitalSigns, riskFactors);
        var labScore = CalculateLabScore(request.LabResults, riskFactors);
        var medicationScore = CalculateMedicationScore(request.Medications, riskFactors);

        // Combine scores
        totalScore = demographicsScore + vitalsScore + labScore + medicationScore;
        
        // Normalize score to 0-100 scale
        totalScore = Math.Min(100, Math.Max(0, totalScore));
        
        // Set response properties
        response.Score = Math.Round(totalScore, 1);
        response.RiskTier = DetermineRiskTier(totalScore);
        response.RiskFactors = riskFactors;
        
        _logger.LogInformation("Health score calculated: {Score}, Risk Tier: {RiskTier}", 
            response.Score, response.RiskTier);
            
        return response;
    }

    private double CalculateDemographicsScore(PatientDemographics demographics, List<RiskFactor> riskFactors)
    {
        double score = 0;
        
        // Age factor
        if (demographics.Age > 65)
        {
            var contribution = (demographics.Age - 65) * 0.5;
            score += contribution;
            riskFactors.Add(new RiskFactor
            {
                Name = "Advanced Age",
                Description = $"Patient age ({demographics.Age}) increases readmission risk",
                ContributionToScore = contribution
            });
        }
        
        // Previous hospitalizations
        if (demographics.PreviousHospitalizations > 0)
        {
            var contribution = demographics.PreviousHospitalizations * 3;
            score += contribution;
            riskFactors.Add(new RiskFactor
            {
                Name = "Previous Hospitalizations",
                Description = $"{demographics.PreviousHospitalizations} previous hospitalizations",
                ContributionToScore = contribution
            });
        }
        
        // Comorbidities
        if (demographics.HasDiabetes)
        {
            score += 10;
            riskFactors.Add(new RiskFactor
            {
                Name = "Diabetes",
                Description = "Patient has diabetes",
                ContributionToScore = 10
            });
        }
        
        if (demographics.HasHeartDisease)
        {
            score += 15;
            riskFactors.Add(new RiskFactor
            {
                Name = "Heart Disease",
                Description = "Patient has heart disease",
                ContributionToScore = 15
            });
        }
        
        if (demographics.HasHypertension)
        {
            score += 7;
            riskFactors.Add(new RiskFactor
            {
                Name = "Hypertension",
                Description = "Patient has hypertension",
                ContributionToScore = 7
            });
        }
        
        if (demographics.IsSmoker)
        {
            score += 8;
            riskFactors.Add(new RiskFactor
            {
                Name = "Smoking",
                Description = "Patient is a smoker",
                ContributionToScore = 8
            });
        }
        
        return score;
    }

    private double CalculateVitalsScore(List<VitalSign> vitalSigns, List<RiskFactor> riskFactors)
    {
        double score = 0;
        
        // Check blood pressure
        var systolicBP = vitalSigns.FirstOrDefault(v => v.Name.Equals("Systolic Blood Pressure", StringComparison.OrdinalIgnoreCase));
        var diastolicBP = vitalSigns.FirstOrDefault(v => v.Name.Equals("Diastolic Blood Pressure", StringComparison.OrdinalIgnoreCase));
        
        if (systolicBP != null && (systolicBP.Value > 140 || systolicBP.Value < 90))
        {
            var contribution = systolicBP.Value > 140 ? 
                (systolicBP.Value - 140) * 0.2 : (90 - systolicBP.Value) * 0.3;
            score += contribution;
            riskFactors.Add(new RiskFactor
            {
                Name = "Abnormal Systolic BP",
                Description = $"Systolic BP is {systolicBP.Value} mmHg (outside normal range)",
                ContributionToScore = contribution
            });
        }
        
        if (diastolicBP != null && (diastolicBP.Value > 90 || diastolicBP.Value < 60))
        {
            var contribution = diastolicBP.Value > 90 ? 
                (diastolicBP.Value - 90) * 0.2 : (60 - diastolicBP.Value) * 0.3;
            score += contribution;
            riskFactors.Add(new RiskFactor
            {
                Name = "Abnormal Diastolic BP",
                Description = $"Diastolic BP is {diastolicBP.Value} mmHg (outside normal range)",
                ContributionToScore = contribution
            });
        }
        
        // Check heart rate
        var heartRate = vitalSigns.FirstOrDefault(v => v.Name.Equals("Heart Rate", StringComparison.OrdinalIgnoreCase));
        if (heartRate != null && (heartRate.Value > 100 || heartRate.Value < 60))
        {
            var contribution = heartRate.Value > 100 ? 
                (heartRate.Value - 100) * 0.2 : (60 - heartRate.Value) * 0.2;
            score += contribution;
            riskFactors.Add(new RiskFactor
            {
                Name = "Abnormal Heart Rate",
                Description = $"Heart rate is {heartRate.Value} bpm (outside normal range)",
                ContributionToScore = contribution
            });
        }
        
        // Check blood oxygen
        var spo2 = vitalSigns.FirstOrDefault(v => v.Name.Equals("SpO2", StringComparison.OrdinalIgnoreCase));
        if (spo2 != null && spo2.Value < 95)
        {
            var contribution = (95 - spo2.Value) * 2;
            score += contribution;
            riskFactors.Add(new RiskFactor
            {
                Name = "Low Blood Oxygen",
                Description = $"Blood oxygen is {spo2.Value}% (below normal range)",
                ContributionToScore = contribution
            });
        }
        
        // Check temperature
        var temperature = vitalSigns.FirstOrDefault(v => v.Name.Equals("Temperature", StringComparison.OrdinalIgnoreCase));
        if (temperature != null)
        {
            double tempValue = temperature.Value;
            // Convert to Celsius if needed
            if (temperature.Unit.Equals("F", StringComparison.OrdinalIgnoreCase))
            {
                tempValue = (tempValue - 32) * 5 / 9;
            }
            
            if (tempValue > 37.5 || tempValue < 36)
            {
                var contribution = tempValue > 37.5 ? 
                    (tempValue - 37.5) * 3 : (36 - tempValue) * 3;
                score += contribution;
                riskFactors.Add(new RiskFactor
                {
                    Name = "Abnormal Temperature",
                    Description = $"Body temperature is {tempValue}°C (outside normal range)",
                    ContributionToScore = contribution
                });
            }
        }
        
        return score;
    }

    private double CalculateLabScore(List<LabResult> labResults, List<RiskFactor> riskFactors)
    {
        double score = 0;
        
        foreach (var lab in labResults)
        {
            // Check if the value is outside normal range
            if (lab.Value < lab.MinNormalValue || lab.Value > lab.MaxNormalValue)
            {
                // Calculate deviation percentage from normal range
                double normalRange = lab.MaxNormalValue - lab.MinNormalValue;
                double deviation;
                
                if (lab.Value < lab.MinNormalValue)
                {
                    deviation = (lab.MinNormalValue - lab.Value) / normalRange * 100;
                }
                else
                {
                    deviation = (lab.Value - lab.MaxNormalValue) / normalRange * 100;
                }
                
                // Cap deviation at 100%
                deviation = Math.Min(deviation, 100);
                
                double contribution = 0;
                
                // Assign different weights based on test importance
                switch (lab.TestName.ToLower())
                {
                    case "hemoglobin a1c":
                    case "blood glucose":
                    case "creatinine":
                    case "egfr":
                    case "troponin":
                    case "bnp":
                    case "procalcitonin":
                        contribution = deviation * 0.15;
                        break;
                    case "wbc":
                    case "sodium":
                    case "potassium":
                    case "chloride":
                    case "calcium":
                    case "bun":
                    case "albumin":
                        contribution = deviation * 0.1;
                        break;
                    default:
                        contribution = deviation * 0.05;
                        break;
                }
                
                score += contribution;
                riskFactors.Add(new RiskFactor
                {
                    Name = $"Abnormal {lab.TestName}",
                    Description = $"{lab.TestName} is {lab.Value} {lab.Unit} (outside normal range of {lab.MinNormalValue}-{lab.MaxNormalValue})",
                    ContributionToScore = contribution
                });
            }
        }
        
        return score;
    }

    private double CalculateMedicationScore(List<Medication> medications, List<RiskFactor> riskFactors)
    {
        double score = 0;
        
        // Score based on number of medications (polypharmacy risk)
        if (medications.Count > 5)
        {
            var contribution = (medications.Count - 5) * 1.5;
            score += contribution;
            riskFactors.Add(new RiskFactor
            {
                Name = "Polypharmacy",
                Description = $"Patient is on {medications.Count} medications (high medication burden)",
                ContributionToScore = contribution
            });
        }
        
        // Additional score for high-risk medications
        var highRiskMeds = medications.Where(m => m.IsHighRisk).ToList();
        if (highRiskMeds.Any())
        {
            var contribution = highRiskMeds.Count * 3;
            score += contribution;
            riskFactors.Add(new RiskFactor
            {
                Name = "High-risk Medications",
                Description = $"Patient is on {highRiskMeds.Count} high-risk medications",
                ContributionToScore = contribution
            });
        }
        
        return score;
    }

    private RiskTier DetermineRiskTier(double score)
    {
        return score switch
        {
            < 20 => RiskTier.Low,
            < 40 => RiskTier.Moderate,
            < 60 => RiskTier.High,
            < 80 => RiskTier.VeryHigh,
            _ => RiskTier.Critical
        };
    }
} 