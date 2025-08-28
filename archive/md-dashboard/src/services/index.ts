// Export all services
export { default as patientService } from './patientService';
export { default as alertService } from './alertService';

// Export types
export type { Alert } from './alertService';
export type {
  Patient,
  PatientDetail,
  PatientDto,
  AppointmentDto,
  MedicalRecordDto,
  HealthcarePlanDto
} from './patientService';
