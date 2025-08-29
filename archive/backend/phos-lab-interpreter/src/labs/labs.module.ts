import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabResultEntity } from './entities/lab-result.entity';
import { LabsService } from './labs.service';
import { LabsController } from './labs.controller';
import { FhirService } from '../integrations/fhir/fhir.service';
import { NatsClient } from '../integrations/events/nats.client';
import { ProfileGrpcClient } from '../integrations/grpc/grpc.client';

@Module({
  imports: [TypeOrmModule.forFeature([LabResultEntity])],
  controllers: [LabsController],
  providers: [LabsService, FhirService, NatsClient, ProfileGrpcClient]
})
export class LabsModule {}


