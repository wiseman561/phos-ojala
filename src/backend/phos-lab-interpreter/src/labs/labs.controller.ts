import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LabsService } from './labs.service';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { InterpretRequestDto } from './dto/interpret-request.dto';
import { ServiceTokenGuard } from '../common/auth.guard';

@Controller({ path: 'labs', version: '1' })
@UseGuards(ServiceTokenGuard)
export class LabsController {
  constructor(private svc: LabsService) {}

  @Post('results')
  async ingest(@Body() dto: CreateLabResultDto) {
    return this.svc.ingest(dto);
  }

  @Post('interpret')
  async interpret(@Body() dto: InterpretRequestDto) {
    return this.svc.interpret(dto.patientId, dto.items);
  }

  @Get('rules')
  async rules() {
    return { ok: true };
  }
}


