import { createHash } from 'crypto';
import * as fs from 'fs';

export function writeAudit(record: { patientId: string; eventId: string; action: string; byService: string; ts?: Date; payload?: unknown }) {
  const ts = (record.ts || new Date()).toISOString();
  const h = createHash('sha256').update(JSON.stringify(record.payload ?? {})).digest('hex');
  const line = JSON.stringify({ patientId: record.patientId, eventId: record.eventId, action: record.action, byService: record.byService, ts, payloadHash: h });
  const path = process.env.AUDIT_LOG_PATH;
  if (path) {
    fs.appendFileSync(path, line + '\n', { encoding: 'utf-8' });
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}


