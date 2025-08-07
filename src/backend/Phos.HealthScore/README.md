# Phos HealthScore Microservice

A .NET 8 microservice for calculating readmission risk scores based on patient health data.

## Features

- REST API endpoint `/health-score` for score calculation
- Takes patient data including demographics, vitals, lab results, and medications
- Returns a numeric risk score (0-100) and risk tier classification
- Identifies specific risk factors contributing to the score

## Technical Details

- .NET 8 Web API
- Pure function approach in `HealthScoreCalculator` 
- Swagger documentation available in development

## API

### POST /health-score

**Request Body:**
```json
{
  "demographics": {
    "age": 68,
    "gender": "Male",
    "isSmoker": true,
    "hasDiabetes": true,
    "hasHeartDisease": true,
    "hasHypertension": true,
    "previousHospitalizations": 2
  },
  "vitalSigns": [
    {
      "name": "Systolic Blood Pressure",
      "value": 158,
      "unit": "mmHg",
      "recordedAt": "2025-05-14T10:30:00Z"
    }
  ],
  "labResults": [
    {
      "testName": "Blood Glucose",
      "value": 186,
      "unit": "mg/dL",
      "minNormalValue": 70,
      "maxNormalValue": 140,
      "recordedAt": "2025-05-14T08:00:00Z"
    }
  ],
  "medications": [
    {
      "name": "Metformin",
      "dosage": "1000 mg",
      "frequency": "BID",
      "isHighRisk": false
    }
  ]
}
```

**Response Body:**
```json
{
  "score": 62.5,
  "riskTier": "High",
  "riskFactors": [
    {
      "name": "Advanced Age",
      "description": "Patient age (68) increases readmission risk",
      "contributionToScore": 1.5
    }
  ],
  "calculatedAt": "2025-05-15T08:58:12.345Z"
}
``` 