/*
  Usage:
    npx ts-node scripts/catalog-verify.ts src/catalog/bundles/lab_catalog.default.json
*/
import 'reflect-metadata';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import { DataSource } from 'typeorm';
import { CatalogMetaEntity } from '../src/catalog/entities/CatalogMetaEntity';
import { LabTestEntity } from '../src/catalog/entities/LabTestEntity';
import { LabRefRangeEntity } from '../src/catalog/entities/LabRefRangeEntity';
import { LabGuidelineEntity } from '../src/catalog/entities/LabGuidelineEntity';

type Bundle = {
  version?: string;
  tests: any[];
  ranges?: any[];
  guidelines?: any[];
};

function validate(b: Bundle) {
  if (!b || !Array.isArray(b.tests)) {
    throw new Error('Invalid bundle shape: tests[] required');
  }
  for (const t of b.tests) {
    if (!t.loinc || !t.name || !t.ucumUnit) throw new Error(`Invalid test entry: ${JSON.stringify(t).slice(0, 120)}`);
  }
}

async function main() {
  const path = process.argv[2] || process.env.CATALOG_BUNDLE_URL || 'src/catalog/bundles/lab_catalog.default.json';
  const raw = await fs.readFile(path, 'utf-8');
  const b = JSON.parse(raw) as Bundle;
  validate(b);

  const sha256 = createHash('sha256').update(raw).digest('hex');
  const version = 'seed-v1';

  // Minimal TypeORM DataSource using env (expects DB_*)
  let wroteDb = false;
  try {
    const ds = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [CatalogMetaEntity, LabTestEntity, LabRefRangeEntity, LabGuidelineEntity],
      synchronize: false
    });
    await ds.initialize();
    try {
      const metaRepo = ds.getRepository(CatalogMetaEntity);
      let ver = await metaRepo.findOne({ where: { bundleVersion: version } });
      if (!ver) ver = metaRepo.create({ bundleVersion: version });
      ver.source = 'seed';
      ver.signedHash = sha256;
      ver.releasedAt = new Date();
      await metaRepo.save(ver);
      wroteDb = true;
    } finally {
      await ds.destroy();
    }
  } catch (e) {
    console.warn('DB unavailable; skipping meta write');
  }

  console.log('Catalog bundle verified:');
  console.log(`  path   : ${path}`);
  console.log(`  entries: tests=${b.tests.length}, ranges=${b.ranges?.length ?? 0}, guidelines=${b.guidelines?.length ?? 0}`);
  console.log(`  version: ${version}`);
  console.log(`  sha256 : ${sha256}`);
  console.log(`  db_write: ${wroteDb ? 'ok' : 'skipped'}`);
  const first = b.tests.slice(0, 8).map((t) => t.loinc).join(', ');
  console.log(`  first_loincs: ${first}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


