import { Injectable, Logger } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { NatsClient } from '../integrations/events/nats.client';
import * as fs from 'fs/promises';

type CatalogBundle = {
  tests: Array<{ loinc: string; name: string; unit?: string; category?: string; metadata?: any; tenantId?: string | null }>;
  ranges: Array<{
    loinc: string; min?: number; max?: number; sex?: 'male' | 'female' | 'other'; minAgeYears?: number; maxAgeYears?: number; pregnant?: boolean; metadata?: any; tenantId?: string | null;
  }>;
  guidelines: Array<{ loinc: string; text: string; metadata?: any; tenantId?: string | null }>;
  version?: string;
};

@Injectable()
export class BundleLoader {
  private readonly logger = new Logger(BundleLoader.name);
  constructor(private readonly catalog: CatalogService, private readonly bus: NatsClient) {}

  async init(): Promise<void> {
    // Initial load from URL (file path supported)
    const url = process.env.CATALOG_BUNDLE_URL;
    if (url) {
      try {
        const content = await this.readBundle(url);
        const parsed = JSON.parse(content) as CatalogBundle;
        this.validateBundle(parsed);
        const version = parsed.version ?? new Date().toISOString();
        await this.catalog.loadBundle(parsed, version);
        this.logger.log(`Catalog bundle loaded (version=${version})`);
      } catch (err) {
        this.logger.error(`Failed to load initial catalog bundle: ${(err as Error).message}`);
      }
    }

    // Subscribe for hot-reload notifications
    try {
      const sub = (this.bus as any)['nc']?.subscribe?.('phos.catalog.updated.v1');
      if (sub) {
        this.logger.log('Subscribed to phos.catalog.updated.v1');
        (async () => {
          for await (const msg of sub) {
            try {
              const data = (this.bus as any)['jc'].decode(msg.data) as { bundleVersion: string; url: string };
              const content = await this.readBundle(data.url);
              const parsed = JSON.parse(content) as CatalogBundle;
              this.validateBundle(parsed);
              await this.catalog.loadBundle(parsed, data.bundleVersion);
              this.logger.log(`Hot-reloaded catalog bundle (version=${data.bundleVersion})`);
            } catch (e) {
              this.logger.error(`Hot-reload failed: ${(e as Error).message}`);
            }
          }
        })();
      } else {
        this.logger.warn('NATS connection not ready; skip subscription for now');
      }
    } catch (e) {
      this.logger.warn(`Unable to subscribe to catalog updates: ${(e as Error).message}`);
    }
  }

  private async readBundle(urlOrPath: string): Promise<string> {
    // Simple fs read for now. If looks like http(s), TODO: fetch via S3/HTTP.
    return await fs.readFile(urlOrPath, 'utf-8');
  }

  private validateBundle(b: CatalogBundle): void {
    if (!b || !Array.isArray(b.tests) || !Array.isArray(b.ranges) || !Array.isArray(b.guidelines)) {
      throw new Error('Invalid bundle structure');
    }
  }
}


