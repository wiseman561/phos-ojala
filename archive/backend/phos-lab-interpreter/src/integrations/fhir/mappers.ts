type ObservationArgs = {
  patientId: string;
  loinc: string;
  display: string;
  value: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
  issued?: string | Date;
};

export function toObservation(args: ObservationArgs) {
  const issued = args.issued ? new Date(args.issued) : new Date();
  const resource = {
    resourceType: 'Observation',
    status: 'final',
    category: [
      {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }]
      }
    ],
    code: {
      coding: [{ system: 'http://loinc.org', code: args.loinc, display: args.display }],
      text: args.display
    },
    subject: { reference: `Patient/${args.patientId}` },
    effectiveDateTime: issued.toISOString(),
    valueQuantity: { value: args.value, unit: args.unit, system: 'http://unitsofmeasure.org', code: args.unit },
    referenceRange:
      args.refLow === undefined && args.refHigh === undefined
        ? undefined
        : [{ low: args.refLow !== undefined ? { value: args.refLow } : undefined, high: args.refHigh !== undefined ? { value: args.refHigh } : undefined }]
  } as any;
  return resource;
}

type DiagnosticReportArgs = {
  patientId: string;
  observations: Array<{ id?: string; resource: any }>;
  conclusionText?: string;
  performerDisplay?: string;
  resultsInterpreterDisplay?: string;
  issued?: string | Date;
};

export function toDiagnosticReport(args: DiagnosticReportArgs) {
  const issued = args.issued ? new Date(args.issued) : new Date();
  const entries = args.observations.map((o, i) => ({ fullUrl: `urn:uuid:obs-${i}`, resource: o.resource }));
  const report = {
    resourceType: 'DiagnosticReport',
    status: 'final',
    category: [
      {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB', display: 'Laboratory' }]
      }
    ],
    subject: { reference: `Patient/${args.patientId}` },
    effectiveDateTime: issued.toISOString(),
    issued: issued.toISOString(),
    performer: args.performerDisplay ? [{ display: args.performerDisplay }] : undefined,
    resultsInterpreter: args.resultsInterpreterDisplay ? [{ display: args.resultsInterpreterDisplay }] : undefined,
    conclusion: args.conclusionText
  } as any;

  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      { fullUrl: 'urn:uuid:diag-report', resource: report },
      ...entries
    ]
  };

  return { report, bundle };
}


