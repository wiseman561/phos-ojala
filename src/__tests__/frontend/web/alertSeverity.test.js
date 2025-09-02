const { AlertSeverity, classifySeverity, generateAlertMessage } = require('../alertSeverity');

describe('Alert Severity Classification', () => {
  describe('AlertSeverity enum', () => {
    test('should have the correct severity levels', () => {
      expect(AlertSeverity.INFO).toBe('Info');
      expect(AlertSeverity.WARNING).toBe('Warning');
      expect(AlertSeverity.EMERGENCY).toBe('Emergency');
    });
  });

  describe('classifySeverity function', () => {
    // Heart Rate tests
    test('should classify heart rate 105 as Info', () => {
      expect(classifySeverity('heartRate', 105)).toBe(AlertSeverity.INFO);
    });

    test('should classify heart rate 115 as Warning', () => {
      expect(classifySeverity('heartRate', 115)).toBe(AlertSeverity.WARNING);
    });

    test('should classify heart rate 125 as Emergency', () => {
      expect(classifySeverity('heartRate', 125)).toBe(AlertSeverity.EMERGENCY);
    });

    test('should classify heart rate 95 as null (normal)', () => {
      expect(classifySeverity('heartRate', 95)).toBe(null);
    });

    // Oxygen Saturation tests
    test('should classify oxygen saturation 92 as Info', () => {
      expect(classifySeverity('oxygenSaturation', 92)).toBe(AlertSeverity.INFO);
    });

    test('should classify oxygen saturation 87 as Warning', () => {
      expect(classifySeverity('oxygenSaturation', 87)).toBe(AlertSeverity.WARNING);
    });

    test('should classify oxygen saturation 83 as Emergency', () => {
      expect(classifySeverity('oxygenSaturation', 83)).toBe(AlertSeverity.EMERGENCY);
    });

    test('should classify oxygen saturation 96 as null (normal)', () => {
      expect(classifySeverity('oxygenSaturation', 96)).toBe(null);
    });

    // Blood Pressure Systolic tests
    test('should classify blood pressure systolic 135 as Info', () => {
      expect(classifySeverity('bloodPressureSystolic', 135)).toBe(AlertSeverity.INFO);
    });

    test('should classify blood pressure systolic 150 as Warning', () => {
      expect(classifySeverity('bloodPressureSystolic', 150)).toBe(AlertSeverity.WARNING);
    });

    test('should classify blood pressure systolic 165 as Emergency', () => {
      expect(classifySeverity('bloodPressureSystolic', 165)).toBe(AlertSeverity.EMERGENCY);
    });

    test('should classify blood pressure systolic 120 as null (normal)', () => {
      expect(classifySeverity('bloodPressureSystolic', 120)).toBe(null);
    });

    // Blood Pressure Diastolic tests
    test('should classify blood pressure diastolic 85 as Info', () => {
      expect(classifySeverity('bloodPressureDiastolic', 85)).toBe(AlertSeverity.INFO);
    });

    test('should classify blood pressure diastolic 95 as Warning', () => {
      expect(classifySeverity('bloodPressureDiastolic', 95)).toBe(AlertSeverity.WARNING);
    });

    test('should classify blood pressure diastolic 105 as Emergency', () => {
      expect(classifySeverity('bloodPressureDiastolic', 105)).toBe(AlertSeverity.EMERGENCY);
    });

    test('should classify blood pressure diastolic 75 as null (normal)', () => {
      expect(classifySeverity('bloodPressureDiastolic', 75)).toBe(null);
    });

    // Special cases
    test('should classify any metric with arrhythmia as Emergency', () => {
      expect(classifySeverity('heartRate', 80, { arrhythmia: true })).toBe(AlertSeverity.EMERGENCY);
    });

    test('should classify any metric with panic event as Emergency', () => {
      expect(classifySeverity('oxygenSaturation', 96, { panicEvent: true })).toBe(AlertSeverity.EMERGENCY);
    });

    test('should return null for unknown metrics', () => {
      expect(classifySeverity('unknownMetric', 100)).toBe(null);
    });
  });

  describe('generateAlertMessage function', () => {
    test('should generate correct Info message', () => {
      const message = generateAlertMessage(AlertSeverity.INFO, 'heartRate', 105, 'P12345');
      expect(message).toContain('ATTENTION');
      expect(message).toContain('Patient P12345');
      expect(message).toContain('Heart Rate');
      expect(message).toContain('105 bpm');
      // Message format is correct for Info level
    });

    test('should generate correct Warning message', () => {
      const message = generateAlertMessage(AlertSeverity.WARNING, 'oxygenSaturation', 87, 'P12345');
      expect(message).toContain('WARNING');
      expect(message).toContain('Patient P12345');
      expect(message).toContain('Oxygen Saturation');
      expect(message).toContain('87 %');
      // Message format is correct for Warning level
    });

    test('should generate correct Emergency message', () => {
      const message = generateAlertMessage(AlertSeverity.EMERGENCY, 'bloodPressureSystolic', 165, 'P12345');
      expect(message).toContain('EMERGENCY');
      expect(message).toContain('Patient P12345');
      expect(message).toContain('Blood Pressure (Systolic)');
      expect(message).toContain('165 mmHg');
      // Message format is correct for Emergency level
    });

    test('should handle unknown metrics gracefully', () => {
      const message = generateAlertMessage(AlertSeverity.WARNING, 'unknownMetric', 100, 'P12345');
      expect(message).toContain('WARNING');
      expect(message).toContain('Patient P12345');
      expect(message).toContain('unknownMetric');
      expect(message).toContain('100');
      // Message format is correct for unknown metrics
    });
  });
});
