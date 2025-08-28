import { Injectable } from '@nestjs/common';

export interface FhirObservation {
  resourceType: 'Observation';
  status: 'final' | 'amended' | 'preliminary';
  code: { coding: { system: string; code: string; display: string }[] };
  subject: { reference: string };
  valueQuantity?: { value: number; unit: string };
}

@Injectable()
export class FhirService {
  toObservation(patientId: string, loinc: string, name: string, value: number, unit: string): FhirObservation {
    return {
      resourceType: 'Observation',
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: loinc, display: name }] },
      subject: { reference: `Patient/${patientId}` },
      valueQuantity: { value, unit }
    };
  }
}


