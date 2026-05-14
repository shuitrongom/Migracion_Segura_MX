import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check del servicio' })
  check() {
    return {
      status: 'ok',
      service: 'migracion-segura-mx-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
