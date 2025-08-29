using System;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using Moq;
using Phos.HealthScore.Models;
using Phos.HealthScore.Services;
using Xunit;

namespace Phos.HealthScore.Tests
{
    public class HealthScoreCalculatorTests
    {
        private readonly Mock<ILogger<HealthScoreCalculator>> _loggerMock;
        private readonly HealthScoreCalculator _calculator;

        public HealthScoreCalculatorTests()
        {
            _loggerMock = new Mock<ILogger<HealthScoreCalculator>>();
            _calculator = new HealthScoreCalculator(_loggerMock.Object);
        }

        [Fact]
        public void CalculateScore_EmptyRequest_ReturnsZeroScore()
        {
            // Arrange
            var request = new HealthScoreRequest();

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.Equal(0, result.Score);
            Assert.Equal(RiskTier.Low, result.RiskTier);
            Assert.Empty(result.RiskFactors);
        }

        [Fact]
        public void CalculateScore_DemographicsOnly_ReturnsCorrectScore()
        {
            // Arrange
            var request = new HealthScoreRequest
            {
                PatientDemographics = new PatientDemographics
                {
                    Age = 75,
                    HasDiabetes = true,
                    HasHeartDisease = true,
                    PreviousHospitalizations = 2
                }
            };

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.True(result.Score > 0);
            Assert.Equal(4, result.RiskFactors.Count);
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Age 75-84");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Diabetes");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Heart Disease");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Previous Hospitalizations");
        }

        [Fact]
        public void CalculateScore_VitalsOnly_ReturnsCorrectScore()
        {
            // Arrange
            var request = new HealthScoreRequest
            {
                VitalSigns = new List<VitalSign>
                {
                    new VitalSign { Name = "Systolic Blood Pressure", Value = 180, Unit = "mmHg" },
                    new VitalSign { Name = "Diastolic Blood Pressure", Value = 100, Unit = "mmHg" },
                    new VitalSign { Name = "Heart Rate", Value = 130, Unit = "bpm" },
                    new VitalSign { Name = "SpO2", Value = 88, Unit = "%" },
                    new VitalSign { Name = "Temperature", Value = 38.5, Unit = "C" }
                }
            };

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.True(result.Score > 0);
            Assert.Equal(5, result.RiskFactors.Count);
            Assert.Contains(result.RiskFactors, rf => rf.Name == "High Systolic BP");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "High Diastolic BP");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Tachycardia");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Low Blood Oxygen");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Fever");
        }

        [Fact]
        public void CalculateScore_LabsOnly_ReturnsCorrectScore()
        {
            // Arrange
            var request = new HealthScoreRequest
            {
                LabResults = new List<LabResult>
                {
                    new LabResult { TestName = "Glucose", Value = 250, MinNormalValue = 70, MaxNormalValue = 110, Unit = "mg/dL" },
                    new LabResult { TestName = "Hemoglobin", Value = 9, MinNormalValue = 12, MaxNormalValue = 16, Unit = "g/dL" },
                    new LabResult { TestName = "Creatinine", Value = 2.2, MinNormalValue = 0.6, MaxNormalValue = 1.2, Unit = "mg/dL" },
                    new LabResult { TestName = "Potassium", Value = 5.8, MinNormalValue = 3.5, MaxNormalValue = 5.0, Unit = "mmol/L" }
                }
            };

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.True(result.Score > 0);
            Assert.Equal(4, result.RiskFactors.Count);
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Abnormal Glucose");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Abnormal Hemoglobin");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Abnormal Creatinine");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Abnormal Potassium");
        }

        [Fact]
        public void CalculateScore_MedicationsOnly_ReturnsCorrectScore()
        {
            // Arrange
            var request = new HealthScoreRequest
            {
                Medications = new List<Medication>
                {
                    new Medication { Name = "Lisinopril", Dosage = "10mg", Frequency = "daily" },
                    new Medication { Name = "Metoprolol", Dosage = "25mg", Frequency = "twice daily" },
                    new Medication { Name = "Furosemide", Dosage = "40mg", Frequency = "daily" },
                    new Medication { Name = "Digoxin", Dosage = "0.125mg", Frequency = "daily", IsHighRisk = true },
                    new Medication { Name = "Warfarin", Dosage = "5mg", Frequency = "daily", IsHighRisk = true },
                    new Medication { Name = "Aspirin", Dosage = "81mg", Frequency = "daily" }
                }
            };

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.True(result.Score > 0);
            Assert.Equal(2, result.RiskFactors.Count);
            Assert.Contains(result.RiskFactors, rf => rf.Name == "Polypharmacy");
            Assert.Contains(result.RiskFactors, rf => rf.Name == "High-Risk Medications");
        }

        [Fact]
        public void CalculateScore_LowRisk_ReturnsLowRiskTier()
        {
            // Arrange
            var request = new HealthScoreRequest
            {
                PatientDemographics = new PatientDemographics
                {
                    Age = 45,
                    Gender = "Male"
                },
                VitalSigns = new List<VitalSign>
                {
                    new VitalSign { Name = "Systolic Blood Pressure", Value = 120, Unit = "mmHg" },
                    new VitalSign { Name = "Diastolic Blood Pressure", Value = 80, Unit = "mmHg" },
                    new VitalSign { Name = "Heart Rate", Value = 65, Unit = "bpm" },
                    new VitalSign { Name = "SpO2", Value = 98, Unit = "%" }
                },
                LabResults = new List<LabResult>
                {
                    new LabResult { TestName = "Glucose", Value = 95, MinNormalValue = 70, MaxNormalValue = 110, Unit = "mg/dL" },
                    new LabResult { TestName = "Hemoglobin", Value = 14, MinNormalValue = 12, MaxNormalValue = 16, Unit = "g/dL" }
                },
                Medications = new List<Medication>
                {
                    new Medication { Name = "Multivitamin", Dosage = "1 tablet", Frequency = "daily" }
                }
            };

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.True(result.Score < 34);
            Assert.Equal(RiskTier.Low, result.RiskTier);
        }

        [Fact]
        public void CalculateScore_MediumRisk_ReturnsMediumRiskTier()
        {
            // Arrange
            var request = new HealthScoreRequest
            {
                PatientDemographics = new PatientDemographics
                {
                    Age = 68,
                    Gender = "Female",
                    HasHypertension = true,
                    PreviousHospitalizations = 1
                },
                VitalSigns = new List<VitalSign>
                {
                    new VitalSign { Name = "Systolic Blood Pressure", Value = 145, Unit = "mmHg" },
                    new VitalSign { Name = "Heart Rate", Value = 85, Unit = "bpm" },
                    new VitalSign { Name = "SpO2", Value = 94, Unit = "%" }
                },
                LabResults = new List<LabResult>
                {
                    new LabResult { TestName = "Glucose", Value = 130, MinNormalValue = 70, MaxNormalValue = 110, Unit = "mg/dL" },
                    new LabResult { TestName = "Hemoglobin", Value = 11.5, MinNormalValue = 12, MaxNormalValue = 16, Unit = "g/dL" }
                },
                Medications = new List<Medication>
                {
                    new Medication { Name = "Lisinopril", Dosage = "10mg", Frequency = "daily" },
                    new Medication { Name = "Metformin", Dosage = "500mg", Frequency = "twice daily" }
                }
            };

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.True(result.Score >= 34 && result.Score < 67);
            Assert.Equal(RiskTier.Medium, result.RiskTier);
        }

        [Fact]
        public void CalculateScore_HighRisk_ReturnsHighRiskTier()
        {
            // Arrange
            var request = new HealthScoreRequest
            {
                PatientDemographics = new PatientDemographics
                {
                    Age = 78,
                    Gender = "Male",
                    HasDiabetes = true,
                    HasHeartDisease = true,
                    HasHypertension = true,
                    IsSmoker = true,
                    PreviousHospitalizations = 3
                },
                VitalSigns = new List<VitalSign>
                {
                    new VitalSign { Name = "Systolic Blood Pressure", Value = 170, Unit = "mmHg" },
                    new VitalSign { Name = "Diastolic Blood Pressure", Value = 95, Unit = "mmHg" },
                    new VitalSign { Name = "Heart Rate", Value = 110, Unit = "bpm" },
                    new VitalSign { Name = "SpO2", Value = 88, Unit = "%" },
                    new VitalSign { Name = "Temperature", Value = 38.2, Unit = "C" }
                },
                LabResults = new List<LabResult>
                {
                    new LabResult { TestName = "Glucose", Value = 210, MinNormalValue = 70, MaxNormalValue = 110, Unit = "mg/dL" },
                    new LabResult { TestName = "Hemoglobin", Value = 9.2, MinNormalValue = 12, MaxNormalValue = 16, Unit = "g/dL" },
                    new LabResult { TestName = "Creatinine", Value = 2.5, MinNormalValue = 0.6, MaxNormalValue = 1.2, Unit = "mg/dL" },
                    new LabResult { TestName = "Potassium", Value = 5.7, MinNormalValue = 3.5, MaxNormalValue = 5.0, Unit = "mmol/L" }
                },
                Medications = new List<Medication>
                {
                    new Medication { Name = "Lisinopril", Dosage = "20mg", Frequency = "daily" },
                    new Medication { Name = "Metoprolol", Dosage = "50mg", Frequency = "twice daily" },
                    new Medication { Name = "Furosemide", Dosage = "40mg", Frequency = "daily" },
                    new Medication { Name = "Digoxin", Dosage = "0.125mg", Frequency = "daily", IsHighRisk = true },
                    new Medication { Name = "Warfarin", Dosage = "5mg", Frequency = "daily", IsHighRisk = true },
                    new Medication { Name = "Insulin", Dosage = "variable", Frequency = "multiple daily", IsHighRisk = true }
                }
            };

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.True(result.Score >= 67);
            Assert.Equal(RiskTier.High, result.RiskTier);
        }

        [Fact]
        public void CalculateScore_BoundaryMedium_ReturnsMediumRiskTier()
        {
            // Arrange - Create a request that should score exactly 34 (boundary of Low/Medium)
            var request = CreateBoundaryRequest(34);

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.Equal(34, result.Score);
            Assert.Equal(RiskTier.Medium, result.RiskTier);
        }

        [Fact]
        public void CalculateScore_BoundaryHigh_ReturnsHighRiskTier()
        {
            // Arrange - Create a request that should score exactly 67 (boundary of Medium/High)
            var request = CreateBoundaryRequest(67);

            // Act
            var result = _calculator.CalculateScore(request);

            // Assert
            Assert.Equal(67, result.Score);
            Assert.Equal(RiskTier.High, result.RiskTier);
        }

        private HealthScoreRequest CreateBoundaryRequest(double targetScore)
        {
            // Create a baseline request with a known score contribution
            var request = new HealthScoreRequest();
            
            if (targetScore >= 34)
            {
                // Add age factor for medium risk (10 points)
                request.PatientDemographics = new PatientDemographics
                {
                    Age = 68 // Age 65-74 adds 10 points
                };
                targetScore -= 10;
            }
            
            if (targetScore >= 20)
            {
                // Add high-risk medications (total 20 points)
                request.Medications = new List<Medication>
                {
                    new Medication { Name = "Med1", IsHighRisk = true },
                    new Medication { Name = "Med2", IsHighRisk = true },
                    new Medication { Name = "Med3", IsHighRisk = true },
                    new Medication { Name = "Med4", IsHighRisk = true }
                };
                targetScore -= 20;
            }
            
            if (targetScore >= 15)
            {
                // Add severe hypertension (15 points)
                request.VitalSigns = new List<VitalSign>
                {
                    new VitalSign { Name = "Systolic Blood Pressure", Value = 190, Unit = "mmHg" }
                };
                targetScore -= 15;
            }
            
            if (targetScore >= 12)
            {
                // Add heart disease (12 points)
                request.PatientDemographics ??= new PatientDemographics();
                request.PatientDemographics.HasHeartDisease = true;
                targetScore -= 12;
            }
            
            if (targetScore >= 10)
            {
                // Add SpO2 mild hypoxemia (10 points)
                request.VitalSigns ??= new List<VitalSign>();
                request.VitalSigns.Add(new VitalSign { Name = "SpO2", Value = 94, Unit = "%" });
                targetScore -= 10;
            }
            
            if (targetScore >= 8)
            {
                // Add diabetes (8 points)
                request.PatientDemographics ??= new PatientDemographics();
                request.PatientDemographics.HasDiabetes = true;
                targetScore -= 8;
            }
            
            if (targetScore >= 7)
            {
                // Add hypertension (7 points)
                request.PatientDemographics ??= new PatientDemographics();
                request.PatientDemographics.HasHypertension = true;
                targetScore -= 7;
            }
            
            if (targetScore >= 5)
            {
                // Add smoking (5 points)
                request.PatientDemographics ??= new PatientDemographics();
                request.PatientDemographics.IsSmoker = true;
                targetScore -= 5;
            }
            
            // For any remaining points, add lab abnormalities
            if (targetScore > 0)
            {
                request.LabResults ??= new List<LabResult>();
                var labResult = new LabResult
                {
                    TestName = "Custom Lab",
                    Value = 200,
                    MinNormalValue = 0,
                    MaxNormalValue = 100,
                    Unit = "units"
                };
                
                request.LabResults.Add(labResult);
                // The algorithm will calculate deviation of 100% and add 5 points
                // (100 * 0.05 = 5 points)
            }
            
            return request;
        }
    }
} 