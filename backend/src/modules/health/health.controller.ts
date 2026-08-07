import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { BackupService } from './backup.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly backupService: BackupService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check del servicio' })
  check() {
    return {
      status: 'ok',
      service: 'migracion-segura-mx-api',
      version: '1.2.4',
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

  /**
   * Forzar backup manual (solo admin)
   */
  @Post('backup')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: '[Admin] Forzar backup manual de la base de datos' })
  async forceBackup() {
    return this.backupService.forceBackup();
  }
}
