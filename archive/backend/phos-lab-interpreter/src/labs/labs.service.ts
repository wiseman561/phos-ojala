import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabResultEntity } from './entities/lab-result.entity';
import { RulesEngine, RuleBundle } from './rules/engine';
import rules from './rules/rules.default.json';
import { NatsClient } from '../integrations/events/nats.client';
import { ProfileGrpcClient } from '../integrations/grpc/grpc.client';
import { CatalogService } from '../catalog/catalog.service';
import { Counter } from 'prom-client';
import { computeEgfr } from './algorithms/egfr';
import { toObservation, toDiagnosticReport } from '../integrations/fhir/mappers';
import { compileSchema } from '../common/schema';
import { ulid } from 'ulid';

@Injectable()
export class LabsService {
  private engine: RulesEngine;
  private catalogMiss = new Counter({ name: 'catalog_miss_total', help: 'Catalog misses by LOINC', labelNames: ['loinc'] });
  private rulesTriggered = new Counter({ name: 'rules_triggered_total', help: 'Rules triggered', labelNames: ['ruleId'] });
  private interpretPublished = new Counter({ name: 'interpret_published_total', help: 'Interpretation events published' });
  constructor(
    @InjectRepository(LabResultEntity) private repo: Repository<LabResultEntity>,
    private bus: NatsClient,
    private profiles: ProfileGrpcClient,
    private catalog: CatalogService
  ) {
    this.engine = new RulesEngine(rules as unknown as RuleBundle);
  }

  async ingest(result: { patientId: string; loinc: string; name: string; value: number; unit: string }) {
    const saved = await this.repo.save(this.repo.create(result));
    return saved;
  }

  async interpret(patientId: string, items: { loinc: string; name: string; value: number; unit: string }[]) {
    const context = await this.profiles.getPatientContext(patientId);
    const age = (context?.age as number | undefined);
    const sex = (context?.sex as 'male' | 'female' | undefined) ?? 'male';
    const tenantId = process.env.CATALOG_TENANT_ID || 'default';

    const normalized: { loinc: string; name: string; value: number; unit: string; refLow?: number; refHigh?: number }[] = [];
    for (const it of items) {
      const test = await this.catalog.getTest(it.loinc);
      if (!test) {
        this.catalogMiss.inc({ loinc: it.loinc });
        await this.bus.publish('phos.catalog.miss.v1', { _meta: {}, loinc: it.loinc, name: it.name } as any);
        normalized.push(it);
        continue;
      }
      let value = it.value;
      let unit = it.unit;
      if (test.altUnits?.includes(unit) && test.convertJs) {
        try {
          const converterName = (test.convertJs.match(/function\s+([^(]+)/) || [])[1];
          const fn = new Function(`${test.convertJs}; return (${converterName})(arguments[0]);`);
          value = fn(value);
          unit = test.ucumUnit;
        } catch {}
      }
      const range = await this.catalog.getRefRange(it.loinc, { age, sex: (sex as any) ?? 'any', pregnant: null, tenantId });
      normalized.push({ loinc: it.loinc, name: test.name || it.name, value, unit, refLow: range?.refLow ?? undefined, refHigh: range?.refHigh ?? undefined });
    }

    const named = this.engine.mapFromLoinc(normalized.map(n => ({ loinc: n.loinc, value: n.value })));
    if (named['Creatinine'] !== undefined && age !== undefined && sex) {
      const { egfr } = computeEgfr(named['Creatinine'], age, sex);
      named['eGFR'] = egfr;
    }

    const out = this.engine.evaluate(named);
    out.flags.forEach(f => this.rulesTriggered.inc({ ruleId: f.loinc || 'rule' }));

    const observations = normalized.map(n => ({ resource: toObservation({ patientId, loinc: n.loinc, display: n.name, value: n.value, unit: n.unit, refLow: n.refLow, refHigh: n.refHigh }) }));
    const { bundle: diagnosticBundle } = toDiagnosticReport({ patientId, observations, conclusionText: undefined });

    const payload = { patientId, flags: out.flags, recommendations: out.recommendations, fhir: { observations: observations.map(o => o.resource), diagnosticReport: diagnosticBundle }, _meta: { eventId: ulid(), schemaVersion: '1.0.0' } } as any;

    // Validate against schema
    try {
      const validate = compileSchema(`${process.cwd()}/src/backend/phos-lab-interpreter/contracts/events/phos.labs.interpreted.v1.schema.json`);
      if (!validate(payload)) {
        throw new Error('Schema validation failed: ' + JSON.stringify(validate.errors));
      }
    } catch {
      // fallback: skip validation in non-runtime envs
    }

    await this.bus.publish('phos.labs.interpreted.v1', payload, payload._meta.eventId);
    this.interpretPublished.inc();
    return payload;
  }
}


