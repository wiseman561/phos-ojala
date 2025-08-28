import apiClient from '../api/axios';

// Backend DTO interfaces matching the C# backend
export interface PatientDto {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth: string;
  gender?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
  updatedAt: string;
  appointments?: AppointmentDto[];
  medicalRecords?: MedicalRecordDto[];
  activePlan?: HealthcarePlanDto;
}

export interface AppointmentDto {
  id?: string;
  patientId?: string;
  providerId?: string;
  appointmentDate: string;
  appointmentType?: string;
  status?: string;
  notes?: string;
}

export interface MedicalRecordDto {
  id?: string;
  patientId?: string;
  recordDate: string;
  recordType?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}

export interface HealthcarePlanDto {
  id?: string;
  patientId?: string;
  planName?: string;
  status?: string;
  startDate: string;
  endDate?: string;
  goals?: string[];
}

// Frontend interface that extends backend DTO with computed properties
export interface Patient extends PatientDto {
  // Computed properties for display
  age?: number;
  condition?: string;
  healthScore?: number;
}

export interface PatientDetail extends Patient {
  // Additional properties for detailed view
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSaturation?: number;
  };
  medications?: string[];
  allergies?: string[];
  recentAlerts?: Array<{
    time: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// Simulate network delay for mock mode
const simulateDelay = (min: number = 300, max: number = 800): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

// Helper function to generate a mock health score based on patient data
const generateMockHealthScore = (patient: PatientDto): number => {
  // Simple algorithm based on age and other factors
  const age = calculateAge(patient.dateOfBirth);
  let baseScore = 100;

  // Reduce score based on age
  if (age > 80) baseScore -= 30;
  else if (age > 70) baseScore -= 20;
  else if (age > 60) baseScore -= 10;
  else if (age > 50) baseScore -= 5;

  // Reduce score if there are medical records
  if (patient.medicalRecords && patient.medicalRecords.length > 0) {
    baseScore -= patient.medicalRecords.length * 5;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, baseScore));
};

// Helper function to transform backend DTO to frontend interface
const transformPatientDto = (dto: PatientDto): Patient => {
  const age = calculateAge(dto.dateOfBirth);
  const healthScore = generateMockHealthScore(dto);

  // Determine condition based on medical records or active plan
  let condition = 'General Care';
  if (dto.activePlan?.planName) {
    condition = dto.activePlan.planName;
  } else if (dto.medicalRecords && dto.medicalRecords.length > 0) {
    const latestRecord = dto.medicalRecords[dto.medicalRecords.length - 1];
    condition = latestRecord.diagnosis || 'Follow-up Care';
  }

  return {
    ...dto,
    age,
    condition,
    healthScore,
  };
};

class PatientService {
  private useMocks: boolean;

  constructor() {
    this.useMocks = process.env.REACT_APP_USE_MOCKS === 'true';
    console.log(`[PatientService] Initialized with useMocks: ${this.useMocks}`);
  }

  /**
   * Get all patients
   */
  async getPatients(): Promise<Patient[]> {
    if (this.useMocks) {
      console.log('[PatientService] Using mock data for getPatients');
      await simulateDelay();
      // Return empty array for mock mode when no real data
      return [];
    } else {
      console.log('[PatientService] Fetching patients from real API');
      try {
        const response = await apiClient.get<PatientDto[]>('/api/patients');
        const patients = response.data.map(transformPatientDto);
        console.log(`[PatientService] Successfully fetched ${patients.length} patients from real API`);
        return patients;
      } catch (error) {
        console.error('[PatientService] API call failed - getPatients:', error);
        console.warn('[PatientService] Returning empty array due to API error');
        return [];
      }
    }
  }

  /**
   * Get patient details by ID
   */
  async getPatientDetail(patientId: string): Promise<PatientDetail> {
    if (this.useMocks) {
      console.log(`[PatientService] Using mock data for getPatientDetail(${patientId})`);
      await simulateDelay();
      // Return minimal patient data for mock mode
      const mockPatient: PatientDetail = {
        id: patientId,
        name: 'Mock Patient',
        firstName: 'Mock',
        lastName: 'Patient',
        email: 'mock@example.com',
        phoneNumber: '(555) 123-4567',
        dateOfBirth: '1980-01-01T00:00:00Z',
        gender: 'Unknown',
        address: 'Mock Address',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        age: 44,
        condition: 'Mock Condition',
        healthScore: 75,
        vitals: {
          heartRate: 72,
          bloodPressure: '120/80',
          temperature: 98.6,
          oxygenSaturation: 98,
        },
        medications: ['Mock Medication'],
        allergies: ['Mock Allergy'],
        recentAlerts: [
          { time: '1 hour ago', message: 'Mock alert', severity: 'low' },
        ],
      };
      return mockPatient;
    } else {
      console.log(`[PatientService] Fetching patient details from real API for ID: ${patientId}`);
      try {
        const response = await apiClient.get<PatientDto>(`/api/patients/${patientId}`);
        const patient = transformPatientDto(response.data) as PatientDetail;

        // Add mock detailed data since backend doesn't provide vitals, medications, etc.
        patient.vitals = {
          heartRate: 72,
          bloodPressure: '120/80',
          temperature: 98.6,
          oxygenSaturation: 98,
        };
        patient.medications = ['No medications recorded'];
        patient.allergies = ['No allergies recorded'];
        patient.recentAlerts = [
          { time: '1 hour ago', message: 'Patient data loaded', severity: 'low' },
        ];

        console.log(`[PatientService] Successfully fetched patient ${patientId} from real API:`, patient.name);
        return patient;
      } catch (error) {
        console.error(`[PatientService] API call failed - getPatientDetail ${patientId}:`, error);
        throw new Error(`Failed to fetch patient details for ID ${patientId}`);
      }
    }
  }

  /**
   * Assign RN to patient
   */
  async assignRN(patientId: string): Promise<any> {
    if (this.useMocks) {
      console.log(`[PatientService] Mock assignRN for patient ${patientId}`);
      await simulateDelay();
      return {
        success: true,
        message: `Patient assigned to RN`,
        patientId,
      };
    } else {
      console.log(`[PatientService] Assigning RN via real API for patient ${patientId}`);
      try {
        const response = await apiClient.post(`/api/patients/${patientId}/assign-provider`, {
          providerId: 'rn-provider-id', // This would need to be a real RN provider ID
          providerType: 'RN'
        });
        console.log(`[PatientService] Successfully assigned RN to patient ${patientId} via real API:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`[PatientService] API call failed - assignRN ${patientId}:`, error);
        throw new Error(`Failed to assign RN to patient ${patientId}`);
      }
    }
  }

  /**
   * Escalate patient to MD
   */
  async escalatePatient(patientId: string): Promise<any> {
    if (this.useMocks) {
      console.log(`[PatientService] Mock escalatePatient for patient ${patientId}`);
      await simulateDelay();
      return {
        success: true,
        message: `Patient escalated to MD`,
        patientId,
      };
    } else {
      console.log(`[PatientService] Escalating patient via real API for patient ${patientId}`);
      try {
        // This would need to be implemented in the backend
        const response = await apiClient.post(`/api/patients/${patientId}/escalate`, {
          escalationType: 'MD',
          reason: 'Manual escalation by MD'
        });
        console.log(`[PatientService] Successfully escalated patient ${patientId} via real API:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`[PatientService] API call failed - escalatePatient ${patientId}:`, error);
        throw new Error(`Failed to escalate patient ${patientId}`);
      }
    }
  }
}

// Export singleton instance
export const patientService = new PatientService();
export default patientService;
