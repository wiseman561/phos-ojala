using System;
using System.IO;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Moq;
using Phos.HealthScore.Models;
using Phos.HealthScore.Services;
using Xunit;

namespace Phos.HealthScore.Tests
{
    public class HealthScoreTestDataTests
    {
        private readonly Mock<ILogger<HealthScoreCalculator>> _loggerMock;
        private readonly HealthScoreCalculator _calculator;

        public HealthScoreTestDataTests()
        {
            _loggerMock = new Mock<ILogger<HealthScoreCalculator>>();
            _calculator = new HealthScoreCalculator(_loggerMock.Object);
        }

        [Fact]
        public void LowRiskPatientFile_ReturnsLowRiskTier()
        {
            // Arrange
            var request = LoadHealthScoreRequestFromTestData("low-risk.json");

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.Equal(RiskTier.Low, result.RiskTier);
            Assert.True(result.Score < 34);
        }

        [Fact]
        public void MediumRiskPatientFile_ReturnsMediumRiskTier()
        {
            // Arrange
            var request = LoadHealthScoreRequestFromTestData("medium-risk.json");

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.Equal(RiskTier.Medium, result.RiskTier);
            Assert.True(result.Score >= 34 && result.Score < 67);
        }

        [Fact]
        public void HighRiskPatientFile_ReturnsHighRiskTier()
        {
            // Arrange
            var request = LoadHealthScoreRequestFromTestData("high-risk.json");

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.Equal(RiskTier.High, result.RiskTier);
            Assert.True(result.Score >= 67);
        }

        private HealthScoreRequest LoadHealthScoreRequestFromTestData(string fileName)
        {
            string filePath = Path.Combine("TestData", "health-score", fileName);
            
            // Adjust path if running from bin directory
            if (!File.Exists(filePath))
            {
                filePath = Path.Combine("..", "..", "..", "..", filePath);
            }

            string jsonContent = File.ReadAllText(filePath);
            var jsonDoc = JsonDocument.Parse(jsonContent);
            var root = jsonDoc.RootElement;

            // Convert the test data format to our HealthScoreRequest format
            var request = new HealthScoreRequest();

            // Parse demographics
            if (root.TryGetProperty("demographics", out var demographics))
            {
                request.PatientDemographics = new PatientDemographics();
                
                if (demographics.TryGetProperty("age", out var age))
                    request.PatientDemographics.Age = age.GetInt32();
                
                if (demographics.TryGetProperty("gender", out var gender))
                    request.PatientDemographics.Gender = gender.GetString() ?? string.Empty;
                
                // Parse comorbidities
                if (demographics.TryGetProperty("comorbidities", out var comorbidities))
                {
                    foreach (var comorbidity in comorbidities.EnumerateArray())
                    {
                        string condition = comorbidity.GetString()?.ToLowerInvariant() ?? string.Empty;
                        
                        if (condition.Contains("diabet"))
                            request.PatientDemographics.HasDiabetes = true;
                        else if (condition.Contains("heart") || condition.Contains("chf") || condition.Contains("cad"))
                            request.PatientDemographics.HasHeartDisease = true;
                        else if (condition.Contains("hypertension") || condition.Contains("htn"))
                            request.PatientDemographics.HasHypertension = true;
                        
                        // Add more mappings as needed
                    }
                }
            }

            // Parse vitals
            if (root.TryGetProperty("vitals", out var vitals))
            {
                request.VitalSigns = new System.Collections.Generic.List<VitalSign>();
                
                if (vitals.TryGetProperty("heartRate", out var heartRate))
                    request.VitalSigns.Add(new VitalSign { Name = "Heart Rate", Value = heartRate.GetDouble(), Unit = "bpm" });
                
                if (vitals.TryGetProperty("systolicBP", out var systolicBP))
                    request.VitalSigns.Add(new VitalSign { Name = "Systolic Blood Pressure", Value = systolicBP.GetDouble(), Unit = "mmHg" });
                
                if (vitals.TryGetProperty("diastolicBP", out var diastolicBP))
                    request.VitalSigns.Add(new VitalSign { Name = "Diastolic Blood Pressure", Value = diastolicBP.GetDouble(), Unit = "mmHg" });
                
                if (vitals.TryGetProperty("oxygenSat", out var oxygenSat))
                    request.VitalSigns.Add(new VitalSign { Name = "SpO2", Value = oxygenSat.GetDouble(), Unit = "%" });
                
                if (vitals.TryGetProperty("temperature", out var temperature))
                    request.VitalSigns.Add(new VitalSign { Name = "Temperature", Value = temperature.GetDouble(), Unit = "C" });
            }

            // Parse labs
            if (root.TryGetProperty("labs", out var labs))
            {
                request.LabResults = new System.Collections.Generic.List<LabResult>();
                
                // Add normal ranges based on typical clinical values
                if (labs.TryGetProperty("wbc", out var wbc))
                    request.LabResults.Add(new LabResult { TestName = "WBC", Value = wbc.GetDouble(), MinNormalValue = 4, MaxNormalValue = 11, Unit = "K/uL" });
                
                if (labs.TryGetProperty("hgb", out var hgb))
                    request.LabResults.Add(new LabResult { TestName = "Hemoglobin", Value = hgb.GetDouble(), MinNormalValue = 12, MaxNormalValue = 16, Unit = "g/dL" });
                
                if (labs.TryGetProperty("bun", out var bun))
                    request.LabResults.Add(new LabResult { TestName = "BUN", Value = bun.GetDouble(), MinNormalValue = 7, MaxNormalValue = 20, Unit = "mg/dL" });
                
                if (labs.TryGetProperty("creatinine", out var creatinine))
                    request.LabResults.Add(new LabResult { TestName = "Creatinine", Value = creatinine.GetDouble(), MinNormalValue = 0.6, MaxNormalValue = 1.2, Unit = "mg/dL" });
                
                if (labs.TryGetProperty("glucose", out var glucose))
                    request.LabResults.Add(new LabResult { TestName = "Glucose", Value = glucose.GetDouble(), MinNormalValue = 70, MaxNormalValue = 110, Unit = "mg/dL" });
            }

            // Parse medications
            if (root.TryGetProperty("medications", out var medications))
            {
                request.Medications = new System.Collections.Generic.List<Medication>();
                
                foreach (var med in medications.EnumerateArray())
                {
                    string medName = med.GetString() ?? string.Empty;
                    bool isHighRisk = IsHighRiskMedication(medName);
                    
                    request.Medications.Add(new Medication
                    {
                        Name = medName,
                        IsHighRisk = isHighRisk
                    });
                }
            }

            return request;
        }

        private bool IsHighRiskMedication(string medicationName)
        {
            // List of high-risk medications for readmission
            string[] highRiskMeds = new[]
            {
                "warfarin", "coumadin", "heparin", "digoxin", "insulin", 
                "methotrexate", "morphine", "oxycodone", "fentanyl",
                "prednisone", "tacrolimus", "cyclosporine"
            };

            foreach (var med in highRiskMeds)
            {
                if (medicationName.ToLowerInvariant().Contains(med))
                {
                    return true;
                }
            }

            return false;
        }
    }
} 