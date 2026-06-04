import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { NotificacionesService } from './notificaciones.service';
import { EmailService } from '../email/email.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, TipoNotificacion, CanalNotificacion } from '../../common/enums';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notificaciones')
export class NotificacionesController {
  constructor(
    private readonly notificacionesService: NotificacionesService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Registrar dispositivo para push notifications
   */
  @Post('register-device')
  @ApiOperation({ summary: 'Registrar push token del dispositivo' })
  async registerDevice(@Request() req: any, @Body() dto: { pushToken: string; platform: string }) {
    const userId = req.user.id;
    // Upsert en tabla user_devices
    await this.notificacionesService['notificacionRepository'].manager.query(
      `INSERT INTO user_devices (user_id, push_token, platform, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET push_token = $2, platform = $3, updated_at = NOW()`,
      [userId, dto.pushToken, dto.platform],
    );
    return { message: 'Dispositivo registrado para notificaciones push', token: dto.pushToken.slice(0, 30) + '...' };
  }

  /**
   * Enviar push de prueba al usuario autenticado (para debug)
   */
  @Post('test-push')
  @ApiOperation({ summary: 'Enviar push de prueba a mi dispositivo' })
  async testPush(@Request() req: any) {
    const userId = req.user.id;
    await this.notificacionesService.sendNotification({
      destinatarioId: userId,
      tipo: TipoNotificacion.CAMBIO_ESTATUS,
      canal: CanalNotificacion.PUSH,
      titulo: '🔔 Push de prueba',
      contenido: 'Si ves esto en tu barra de notificaciones, las push funcionan correctamente.',
      metadata: { test: 'true', timestamp: new Date().toISOString() },
    });
    return { message: 'Push de prueba enviada. Revisa tu dispositivo.' };
  }

  /**
   * Admin: enviar push a cualquier usuario por su ID
   */
  @Post('test-push/:userId')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Enviar push de prueba a un usuario específico (admin)' })
  async testPushToUser(@Param('userId', ParseUUIDPipe) userId: string) {
    await this.notificacionesService.sendNotification({
      destinatarioId: userId,
      tipo: TipoNotificacion.CAMBIO_ESTATUS,
      canal: CanalNotificacion.PUSH,
      titulo: '🔔 Notificación de prueba',
      contenido: 'Esta es una notificación de prueba enviada desde el panel de administración.',
      metadata: { test: 'true', timestamp: new Date().toISOString() },
    });
    return { message: `Push enviada al usuario ${userId}` };
  }

  /**
   * Enviar lista de requisitos por correo al extranjero
   */
  @Post('enviar-requisitos')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Enviar requisitos por correo al extranjero' })
  async enviarRequisitos(@Body() dto: { email: string; nombreExtranjero: string; requisitos: string[] }) {
    await this.emailService.sendRequisitosEmail({
      to: dto.email,
      nombreExtranjero: dto.nombreExtranjero,
      requisitos: dto.requisitos,
    });
    return { message: 'Requisitos enviados exitosamente' };
  }
  /**
   * Get my notifications (paginated)
   */
  @Get()
  @ApiOperation({ summary: 'Obtener mis notificaciones (paginado)' })
  getMyNotifications(
    @Query() pagination: PaginationDto,
    @Request() req: { user: { id: string } },
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    return this.notificacionesService.getByUser(req.user.id, page, limit);
  }

  /**
   * Get unread count
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Obtener cantidad de notificaciones no leídas' })
  async getUnreadCount(@Request() req: { user: { id: string } }) {
    const count = await this.notificacionesService.getUnreadCount(req.user.id);
    return { count };
  }

  /**
   * Mark all as read
   */
  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  async markAllAsRead(@Request() req: { user: { id: string } }) {
    await this.notificacionesService.markAllAsRead(req.user.id);
    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  /**
   * Mark a notification as read
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.notificacionesService.markAsRead(id, req.user.id);
  }
}
