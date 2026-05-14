import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { NotificacionesService } from './notificaciones.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

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
