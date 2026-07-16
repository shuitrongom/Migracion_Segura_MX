import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { ConfigRemoteService } from './config-remote.service';

@ApiTags('Config')
@Controller('config')
export class ConfigRemoteController {
  constructor(private readonly configRemoteService: ConfigRemoteService) {}

  /**
   * Endpoint público que la app consulta al abrirse.
   * Retorna toda la configuración necesaria para que la app funcione.
   * Cambiar valores aquí controla la app SIN necesidad de nuevo APK/IPA.
   */
  @Get('app')
  @Public()
  @ApiOperation({ summary: 'Obtener configuración remota de la app (público)' })
  getAppConfig(@Query('platform') platform?: string, @Query('version') version?: string) {
    return this.configRemoteService.getAppConfig(platform, version);
  }

  /**
   * Admin actualiza la configuración remota
   */
  @Patch('app')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar configuración remota (admin)' })
  updateAppConfig(@Body() dto: Record<string, unknown>) {
    return this.configRemoteService.updateConfig(dto);
  }
}
