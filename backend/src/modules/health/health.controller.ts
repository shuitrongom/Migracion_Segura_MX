import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check del servicio' })
  check() {
    return {
      status: 'ok',
      service: 'migracion-segura-mx-api',
      version: '0.1.1',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Ping ultra-ligero para que la app detecte conectividad
   */
  @Get('ping')
  @Public()
  @ApiOperation({ summary: 'Ping rápido (1 byte response)' })
  ping() {
    return { ok: true };
  }
}
