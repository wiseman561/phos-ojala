import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LabTestEntity } from './entities/LabTestEntity';
import { LabRefRangeEntity } from './entities/LabRefRangeEntity';
import { LabGuidelineEntity } from './entities/LabGuidelineEntity';
import { CatalogMetaEntity } from './entities/CatalogMetaEntity';
import { RedisCacheService } from '../integrations/cache/redis.cache.service';

export interface RefRangeQuery {
  age?: number;
  sex?: 'male' | 'female' | 'any';
  pregnant?: boolean | null;
  tenantId?: string;
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(LabTestEntity) private readonly testRepo: Repository<LabTestEntity>,
    @InjectRepository(LabRefRangeEntity) private readonly rangeRepo: Repository<LabRefRangeEntity>,
    @InjectRepository(LabGuidelineEntity) private readonly guideRepo: Repository<LabGuidelineEntity>,
    @InjectRepository(CatalogMetaEntity) private readonly metaRepo: Repository<CatalogMetaEntity>,
    private readonly dataSource: DataSource,
    private readonly cache: RedisCacheService
  ) {}

  private cacheKey(prefix: string, ...parts: (string | number | undefined | null)[]): string {
    return [prefix, ...parts.map((p) => (p === undefined || p === null ? '-' : String(p)))].join(':');
  }

  async getTest(loinc: string): Promise<LabTestEntity | null> {
    const key = this.cacheKey('catalog:test', loinc);
    const cached = await this.cache.get<LabTestEntity>(key);
    if (cached) return cached;
    const row = await this.testRepo.findOne({ where: { loinc } });
    if (row) await this.cache.set(key, row, 600);
    return row;
  }

  async getRefRange(loinc: string, q: RefRangeQuery): Promise<LabRefRangeEntity | null> {
    const key = this.cacheKey('catalog:range', loinc, q.age, q.sex, q.pregnant === null ? 'null' : q.pregnant ? 1 : 0, q.tenantId);
    const cached = await this.cache.get<LabRefRangeEntity>(key);
    if (cached) return cached;

    const qb = this.rangeRepo
      .createQueryBuilder('r')
      .where('r.loinc = :loinc', { loinc })
      .andWhere('(r.tenantId IS NULL OR r.tenantId = :tenantId)', { tenantId: q.tenantId ?? null });

    if (q.sex) qb.andWhere('(r.sex = :sex OR r.sex = :any)', { sex: q.sex, any: 'any' });
    if (typeof q.pregnant === 'boolean') qb.andWhere('(r.pregnant IS NULL OR r.pregnant = :pregnant)', { pregnant: q.pregnant });
    if (typeof q.age === 'number') {
      qb.andWhere('(r.ageMin IS NULL OR r.ageMin <= :age)', { age: q.age });
      qb.andWhere('(r.ageMax IS NULL OR r.ageMax >= :age)', { age: q.age });
    }

    qb.orderBy('r.effectiveFrom', 'DESC');
    const row = await qb.getOne();
    if (row) await this.cache.set(key, row, 600);
    return row;
  }

  async getGuideline(loinc: string): Promise<LabGuidelineEntity | null> {
    return this.guideRepo.findOne({ where: { loinc } });
  }

  async loadBundle(json: any, bundleVersion: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const testRepo = manager.getRepository(LabTestEntity);
      const rangeRepo = manager.getRepository(LabRefRangeEntity);
      const guideRepo = manager.getRepository(LabGuidelineEntity);
      const metaRepo = manager.getRepository(CatalogMetaEntity);

      for (const t of json.tests ?? []) {
        const existing = await testRepo.findOne({ where: { loinc: t.loinc } });
        const entity = existing ?? testRepo.create();
        entity.loinc = t.loinc;
        entity.internalCode = t.internalCode ?? null;
        entity.name = t.name;
        entity.aliases = t.aliases ?? [];
        entity.specimen = t.specimen ?? null;
        entity.ucumUnit = t.ucumUnit;
        entity.altUnits = t.altUnits ?? [];
        entity.convertJs = t.convertJs ?? null;
        entity.fhirCode = t.fhirCode ?? null;
        entity.panel = t.panel ?? [];
        entity.status = t.status ?? 'active';
        await testRepo.save(entity);
      }

      for (const r of json.ranges ?? []) {
        const entity = rangeRepo.create({
          loinc: r.loinc,
          sex: (r.sex ?? 'any'),
          ageMin: r.ageMin ?? null,
          ageMax: r.ageMax ?? null,
          pregnant: r.pregnant ?? null,
          refLow: r.refLow ?? null,
          refHigh: r.refHigh ?? null,
          method: r.method ?? null,
          notes: r.notes ?? null,
          tenantId: r.tenantId ?? null,
          effectiveFrom: r.effectiveFrom ? new Date(r.effectiveFrom) : new Date(),
          effectiveTo: r.effectiveTo ? new Date(r.effectiveTo) : null
        } as LabRefRangeEntity);
        await rangeRepo.save(entity);
      }

      for (const g of json.guidelines ?? []) {
        const entity = guideRepo.create({
          loinc: g.loinc,
          snippet: g.guideline?.snippet ?? g.snippet ?? '',
          severityRule: g.severityRule ?? {},
          citations: g.guideline?.citations ?? g.citations ?? [],
          accessedAt: (g.guideline?.provenance?.accessedAt ?? g.accessedAt ?? new Date().toISOString()).slice(0, 10),
          versionTag: g.versionTag ?? 'v1'
        } as LabGuidelineEntity);
        await guideRepo.save(entity);
      }

      let meta = await metaRepo.findOne({ where: { bundleVersion } });
      if (!meta) meta = metaRepo.create({ bundleVersion });
      meta.source = json.source ?? 'load';
      meta.signedHash = json.signedHash ?? '';
      meta.releasedAt = new Date();
      await metaRepo.save(meta);
    });
  }
}


