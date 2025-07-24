export interface Patient {
  id: number;
  name: string;
  age: number;
  condition: string;
  healthScore: number;
}

export interface PatientDetail extends Patient {
  phone: string;
  email: string;
  address: string;
  admissionDate: string;
  primaryPhysician: string;
  nurseAssigned: string;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
  };
  medications: string[];
  allergies: string[];
  recentAlerts: Array<{
    time: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// Mock patient list for PatientQueue
export const mockPatients: Patient[] = [
  { id: 1, name: 'John Smith', age: 67, condition: 'Hypertension', healthScore: 45 },
  { id: 2, name: 'Maria Garcia', age: 52, condition: 'Diabetes Type 2', healthScore: 72 },
  { id: 3, name: 'Robert Johnson', age: 78, condition: 'Wound Care', healthScore: 38 },
  { id: 4, name: 'Lisa Chen', age: 44, condition: 'Post-Op Recovery', healthScore: 88 },
  { id: 5, name: 'David Wilson', age: 61, condition: 'COPD', healthScore: 55 },
  { id: 6, name: 'Sarah Thompson', age: 35, condition: 'Pregnancy Care', healthScore: 92 },
  { id: 7, name: 'Michael Brown', age: 73, condition: 'Cardiac Monitoring', healthScore: 41 },
  { id: 8, name: 'Jennifer Davis', age: 58, condition: 'Diabetes Management', healthScore: 68 },
  { id: 9, name: 'William Miller', age: 82, condition: 'Recovery Care', healthScore: 33 },
  { id: 10, name: 'Emily Rodriguez', age: 39, condition: 'Prenatal Care', healthScore: 85 },
];

// Detailed mock patient data for PatientDetail
export const mockPatientDetails: Record<number, PatientDetail> = {
  1: {
    id: 1,
    name: 'John Smith',
    age: 67,
    condition: 'Hypertension',
    healthScore: 45,
    phone: '(555) 123-4567',
    email: 'john.smith@email.com',
    address: '123 Main St, Springfield, IL 62701',
    admissionDate: '2024-01-15',
    primaryPhysician: 'Dr. Sarah Wilson',
    nurseAssigned: 'Nancy Rodriguez, RN',
    vitals: {
      heartRate: 92,
      bloodPressure: '150/95',
      temperature: 98.6,
      oxygenSaturation: 96,
    },
    medications: ['Lisinopril 10mg', 'Metoprolol 50mg', 'Amlodipine 5mg'],
    allergies: ['Penicillin', 'Shellfish'],
    recentAlerts: [
      { time: '2 hours ago', message: 'Blood pressure elevated (165/98)', severity: 'high' },
      { time: '6 hours ago', message: 'Heart rate increased to 105 bpm', severity: 'medium' },
      { time: '1 day ago', message: 'Medication reminder sent', severity: 'low' },
    ],
  },
  2: {
    id: 2,
    name: 'Maria Garcia',
    age: 52,
    condition: 'Diabetes Type 2',
    healthScore: 72,
    phone: '(555) 987-6543',
    email: 'maria.garcia@email.com',
    address: '456 Oak Ave, Springfield, IL 62702',
    admissionDate: '2024-01-18',
    primaryPhysician: 'Dr. Michael Chen',
    nurseAssigned: 'Jennifer Kim, RN',
    vitals: {
      heartRate: 78,
      bloodPressure: '135/85',
      temperature: 98.4,
      oxygenSaturation: 98,
    },
    medications: ['Metformin 1000mg', 'Glipizide 5mg', 'Lisinopril 5mg'],
    allergies: ['Sulfa drugs'],
    recentAlerts: [
      { time: '4 hours ago', message: 'Blood glucose slightly elevated (180 mg/dL)', severity: 'medium' },
      { time: '12 hours ago', message: 'Daily vitals recorded', severity: 'low' },
    ],
  },
  3: {
    id: 3,
    name: 'Robert Johnson',
    age: 78,
    condition: 'Wound Care',
    healthScore: 38,
    phone: '(555) 456-7890',
    email: 'robert.johnson@email.com',
    address: '789 Pine St, Springfield, IL 62703',
    admissionDate: '2024-01-10',
    primaryPhysician: 'Dr. Lisa Park',
    nurseAssigned: 'Michael Thompson, RN',
    vitals: {
      heartRate: 88,
      bloodPressure: '140/90',
      temperature: 99.2,
      oxygenSaturation: 94,
    },
    medications: ['Amoxicillin 500mg', 'Acetaminophen 650mg', 'Ibuprofen 400mg'],
    allergies: ['Aspirin'],
    recentAlerts: [
      { time: '1 hour ago', message: 'Wound dressing change required', severity: 'medium' },
      { time: '8 hours ago', message: 'Temperature elevated (99.8°F)', severity: 'medium' },
      { time: '1 day ago', message: 'Pain level reported as 7/10', severity: 'high' },
    ],
  },
  4: {
    id: 4,
    name: 'Lisa Chen',
    age: 44,
    condition: 'Post-Op Recovery',
    healthScore: 88,
    phone: '(555) 321-6547',
    email: 'lisa.chen@email.com',
    address: '321 Elm St, Springfield, IL 62704',
    admissionDate: '2024-01-22',
    primaryPhysician: 'Dr. James Wilson',
    nurseAssigned: 'Sarah Johnson, RN',
    vitals: {
      heartRate: 72,
      bloodPressure: '120/80',
      temperature: 98.2,
      oxygenSaturation: 99,
    },
    medications: ['Oxycodone 5mg', 'Docusate 100mg'],
    allergies: ['Latex'],
    recentAlerts: [
      { time: '3 hours ago', message: 'Pain assessment completed', severity: 'low' },
      { time: '6 hours ago', message: 'Post-op check completed successfully', severity: 'low' },
    ],
  },
  5: {
    id: 5,
    name: 'David Wilson',
    age: 61,
    condition: 'COPD',
    healthScore: 55,
    phone: '(555) 654-3210',
    email: 'david.wilson@email.com',
    address: '654 Maple Ave, Springfield, IL 62705',
    admissionDate: '2024-01-20',
    primaryPhysician: 'Dr. Rebecca Martinez',
    nurseAssigned: 'Alex Chen, RN',
    vitals: {
      heartRate: 95,
      bloodPressure: '145/92',
      temperature: 98.5,
      oxygenSaturation: 92,
    },
    medications: ['Albuterol Inhaler', 'Prednisone 20mg', 'Oxygen 2L'],
    allergies: ['Codeine'],
    recentAlerts: [
      { time: '30 minutes ago', message: 'Oxygen saturation dropped to 90%', severity: 'high' },
      { time: '2 hours ago', message: 'Breathing treatment administered', severity: 'medium' },
      { time: '4 hours ago', message: 'Patient reported shortness of breath', severity: 'medium' },
    ],
  },
};
