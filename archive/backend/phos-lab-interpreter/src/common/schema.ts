import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';

export function compileSchema(path: string) {
  const raw = fs.readFileSync(path, 'utf-8');
  const schema = JSON.parse(raw);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  return validate;
}


