import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'phos-api-gateway',
      version: process.env.BUILD_VERSION ?? 'dev',
      commit: process.env.BUILD_COMMIT ?? 'dev',
      time: new Date().toISOString(),
    };
  }
}
