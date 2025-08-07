// Mock AlertSeverity Enum
const AlertSeverity = {
  INFO: 'Info',
  WARNING: 'Warning',
  EMERGENCY: 'Emergency'
};

// Mock classification function
const classifySeverity = (metricType, value, context = {}) => {
  if (context.arrhythmia || context.panicEvent) {
    return AlertSeverity.EMERGENCY;
  }

  switch (metricType) {
    case 'heartRate':
      if (value > 120) return AlertSeverity.EMERGENCY;
      if (value > 110) return AlertSeverity.WARNING;
      if (value > 100) return AlertSeverity.INFO;
      return null;
    case 'oxygenSaturation':
      if (value < 85) return AlertSeverity.EMERGENCY;
      if (value < 90) return AlertSeverity.WARNING;
      if (value < 95) return AlertSeverity.INFO;
      return null;
    case 'bloodPressureSystolic':
      if (value > 160) return AlertSeverity.EMERGENCY;
      if (value > 145) return AlertSeverity.WARNING;
      if (value > 130) return AlertSeverity.INFO;
      return null;
    case 'bloodPressureDiastolic':
      if (value > 100) return AlertSeverity.EMERGENCY;
      if (value > 90) return AlertSeverity.WARNING;
      if (value > 80) return AlertSeverity.INFO;
      return null;
    default:
      return null;
  }
};

// Mock message generation
const generateAlertMessage = (severity, metricType, value, patientId) => {
  const prefix = severity === AlertSeverity.EMERGENCY ? 'EMERGENCY' :
                severity === AlertSeverity.WARNING ? 'WARNING' : 'ATTENTION';
  
  let metricName;
  let unit;
  
  switch (metricType) {
    case 'heartRate':
      metricName = 'Heart Rate';
      unit = 'bpm';
      break;
    case 'oxygenSaturation':
      metricName = 'Oxygen Saturation';
      unit = '%';
      break;
    case 'bloodPressureSystolic':
      metricName = 'Blood Pressure (Systolic)';
      unit = 'mmHg';
      break;
    case 'bloodPressureDiastolic':
      metricName = 'Blood Pressure (Diastolic)';
      unit = 'mmHg';
      break;
    default:
      metricName = metricType;
      unit = '';
  }
  
  return `${prefix}: Patient ${patientId} - ${metricName} ${value} ${unit}`;
};

module.exports = {
  AlertSeverity,
  classifySeverity,
  generateAlertMessage
}; 