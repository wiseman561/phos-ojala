export interface EscalatedAlert {
  id: string;
  patientId: number;
  patientName: string;
  severity: 'Emergency' | 'Warning' | 'Info';
  message: string;
  metric: string;
  value: string;
  timestamp: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// Mock escalated alerts data
export const mockEscalatedAlerts: EscalatedAlert[] = [
  {
    id: 'alert-001',
    patientId: 5,
    patientName: 'David Wilson',
    severity: 'Emergency',
    message: 'Critical oxygen saturation level detected',
    metric: 'Oxygen Saturation',
    value: '88%',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    isAcknowledged: false,
  },
  {
    id: 'alert-002',
    patientId: 1,
    patientName: 'John Smith',
    severity: 'Emergency',
    message: 'Blood pressure dangerously high',
    metric: 'Blood Pressure',
    value: '180/110',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
    isAcknowledged: false,
  },
  {
    id: 'alert-003',
    patientId: 3,
    patientName: 'Robert Johnson',
    severity: 'Warning',
    message: 'Elevated temperature for extended period',
    metric: 'Temperature',
    value: '101.2°F',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    isAcknowledged: false,
  },
  {
    id: 'alert-004',
    patientId: 7,
    patientName: 'Michael Brown',
    severity: 'Emergency',
    message: 'Cardiac arrhythmia detected',
    metric: 'Heart Rate',
    value: 'Irregular, 45-130 bpm',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    isAcknowledged: false,
  },
  {
    id: 'alert-005',
    patientId: 9,
    patientName: 'William Miller',
    severity: 'Warning',
    message: 'Pain level consistently high',
    metric: 'Pain Scale',
    value: '8/10',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    isAcknowledged: false,
  },
];

// Mock acknowledged alerts for testing
export const mockAcknowledgedAlerts: EscalatedAlert[] = [
  {
    id: 'alert-ack-001',
    patientId: 2,
    patientName: 'Maria Garcia',
    severity: 'Warning',
    message: 'Blood glucose levels elevated',
    metric: 'Blood Glucose',
    value: '250 mg/dL',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isAcknowledged: true,
    acknowledgedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    acknowledgedBy: 'Dr. Sarah Wilson',
  },
  {
    id: 'alert-ack-002',
    patientId: 4,
    patientName: 'Lisa Chen',
    severity: 'Info',
    message: 'Post-operative monitoring alert',
    metric: 'Surgical Site',
    value: 'Slight swelling noted',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    isAcknowledged: true,
    acknowledgedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours ago
    acknowledgedBy: 'Nancy Rodriguez, RN',
  },
  {
    id: 'alert-ack-003',
    patientId: 6,
    patientName: 'Sarah Thompson',
    severity: 'Warning',
    message: 'Contractions detected - monitoring required',
    metric: 'Contractions',
    value: 'Every 10 minutes',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    isAcknowledged: true,
    acknowledgedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), // 3.5 hours ago
    acknowledgedBy: 'Dr. Michael Chen',
  },
];

// Combined alerts for the API response
export const getAllAlerts = (): EscalatedAlert[] => {
  return [...mockEscalatedAlerts, ...mockAcknowledgedAlerts];
};

export const getActiveAlerts = (): EscalatedAlert[] => {
  return mockEscalatedAlerts.filter(alert => !alert.isAcknowledged);
};

export const getAcknowledgedAlerts = (): EscalatedAlert[] => {
  return mockAcknowledgedAlerts.filter(alert => alert.isAcknowledged);
};
