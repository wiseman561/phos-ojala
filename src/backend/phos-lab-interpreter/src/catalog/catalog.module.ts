import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { LabTestEntity } from './entities/LabTestEntity';
import { LabRefRangeEntity } from './entities/LabRefRangeEntity';
import { LabGuidelineEntity } from './entities/LabGuidelineEntity';
import { CatalogMetaEntity } from './entities/CatalogMetaEntity';
import { RedisCacheService } from '../integrations/cache/redis.cache.service';
import { NatsClient } from '../integrations/events/nats.client';
import { BundleLoader } from './bundle.loader';

@Module({
  imports: [
    TypeOrmModule.forFeature([LabTestEntity, LabRefRangeEntity, LabGuidelineEntity, CatalogMetaEntity])
  ],
  providers: [CatalogService, BundleLoader, RedisCacheService, NatsClient],
  exports: [CatalogService]
})
export class CatalogModule implements OnModuleInit {
  constructor(private readonly loader: BundleLoader) {}
  async onModuleInit(): Promise<void> {
    await this.loader.init();
  }
}


