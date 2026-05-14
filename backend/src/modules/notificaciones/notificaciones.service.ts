import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notificacion } from './entities/notificacion.entity';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { CanalNotificacion, TipoNotificacion } from '../../common/enums';

export interface SendNotificationInput {
  destinatarioId: string;
  tipo: TipoNotificacion;
  canal: CanalNotificacion;
  titulo: string;
  contenido: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  whatsapp: boolean;
}

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
  ) {}

  /**
   * Create notification record and queue for sending.
   * TODO: Integrate actual push/email/whatsapp sending.
   */
  async sendNotification(input: SendNotificationInput): Promise<Notificacion> {
    const notificacion = this.notificacionRepository.create({
      destinatarioId: input.destinatarioId,
      tipo: input.tipo,
      canal: input.canal,
      titulo: input.titulo,
      contenido: input.contenido,
      metadata: input.metadata ?? null,
      leida: false,
      enviada: false,
      fechaEnvio: null,
      errorEnvio: null,
    });

    return this.notificacionRepository.save(notificacion);
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(id: string, userId: string): Promise<Notificacion> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { id, destinatarioId: userId },
    });

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    notificacion.leida = true;
    return this.notificacionRepository.save(notificacion);
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificacionRepository.update(
      { destinatarioId: userId, leida: false },
      { leida: true },
    );
  }

  /**
   * Get notifications for a user with pagination.
   */
  async getByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<Notificacion>> {
    const [data, total] = await this.notificacionRepository.findAndCount({
      where: { destinatarioId: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Get count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificacionRepository.count({
      where: { destinatarioId: userId, leida: false },
    });
  }

  /**
   * Update notification preferences for a user.
   * TODO: Store preferences in a separate table or user profile.
   * For now, returns the input as acknowledgment.
   */
  async updatePreferences(
    userId: string,
    preferences: NotificationPreferences,
  ): Promise<{ userId: string; preferences: NotificationPreferences }> {
    // TODO: Persist preferences to a dedicated table
    return { userId, preferences };
  }
}
