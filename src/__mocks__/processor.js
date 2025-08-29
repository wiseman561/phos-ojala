// Mock processor functions
const processNewTelemetry = jest.fn().mockResolvedValue({
  processedItems: 5,
  alertsGenerated: 2
});

const getPatientThresholds = jest.fn().mockResolvedValue({
  heartRate: { low: 60, high: 100 },
  oxygenSaturation: { low: 85, high: 100 },
  bloodPressureSystolic: { low: 90, high: 140 },
  bloodPressureDiastolic: { low: 60, high: 90 }
});

const saveTelemetryData = jest.fn().mockResolvedValue({
  success: true,
  timestamp: new Date().toISOString()
});

module.exports = {
  processNewTelemetry,
  getPatientThresholds,
  saveTelemetryData
}; 