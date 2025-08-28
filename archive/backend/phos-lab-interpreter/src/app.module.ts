import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { LabsModule } from './labs/labs.module';
import { MetricsModule } from './metrics/metrics.module';
import { EventsModule } from './integrations/events/events.module';
import { CacheModule } from './integrations/cache/cache.module';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true
    }),
    MetricsModule,
    CacheModule,
    EventsModule,
    CatalogModule,
    LabsModule,
    HealthModule
  ]
})
export class AppModule {}


