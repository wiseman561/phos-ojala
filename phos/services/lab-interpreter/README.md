# Lab Interpreter

Minimal .NET 8 Web API that interprets lab measurements.

Endpoints:
- GET /api/info
- GET /healthz
- POST /api/labs/interpret

Request example:
```
{
  "userId": "u123",
  "context": { "sex": "male", "ageYears": 40 },
  "measurements": [
    { "code": "LDL_C", "name": "LDL Cholesterol", "value": 120, "unit": "mg/dL" },
    { "code": "A1C", "value": 5.9, "unit": "%" }
  ]
}
```

