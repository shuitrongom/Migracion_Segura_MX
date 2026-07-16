import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';

/**
 * Endpoint de telemetría — recibe reportes de errores desde la app móvil.
 * Permite diagnosticar problemas sin acceso físico al dispositivo.
 *
 * La app reporta aquí cuando:
 * - Una petición falla después de todos los retries
 * - Un componente crashea (Error Boundary)
 * - Se detecta un estado inesperado
 */
@ApiTags('Telemetry')
@Controller('telemetry')
export class TelemetryController {
  private readonly logger = new Logger('AppTelemetry');

  /**
   * Recibir reporte de error desde la app móvil.
   * Público — no requiere auth (el error puede ocurrir antes del login).
   * Rate limited para prevenir abuso.
   */
  @Post('error')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Reportar error desde la app móvil (público)' })
  reportError(@Body() dto: {
    error: string;
    screen?: string;
    userId?: string;
    platform?: string;
    appVersion?: string;
    extra?: Record<string, unknown>;
  }) {
    this.logger.error(
      `[Mobile Error] ${dto.platform || '?'}/${dto.appVersion || '?'} | ` +
      `Screen: ${dto.screen || 'unknown'} | ` +
      `User: ${dto.userId?.slice(0, 8) || 'anon'} | ` +
      `Error: ${dto.error?.slice(0, 300)}`,
    );

    return { received: true };
  }

  /**
   * Recibir evento de telemetría genérico (engagement, timing, etc.)
   * Para futuro uso con analytics internos.
   */
  @Post('event')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Reportar evento de telemetría (público)' })
  reportEvent(@Body() dto: {
    event: string;
    properties?: Record<string, unknown>;
    userId?: string;
    platform?: string;
  }) {
    // Solo loguear si es un evento importante
    if (dto.event === 'app_open' || dto.event === 'session_start') {
      this.logger.log(`[Telemetry] ${dto.event} | ${dto.platform || '?'} | User: ${dto.userId?.slice(0, 8) || 'anon'}`);
    }

    return { received: true };
  }
}
