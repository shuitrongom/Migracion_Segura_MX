import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ActivityLog } from './entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly logRepository: Repository<ActivityLog>,
  ) {}

  /**
   * Registrar una acción en el log de actividad (Req 16.7)
   */
  async log(data: {
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    details?: Record<string, unknown> | null;
    success?: boolean;
  }): Promise<void> {
    const entry = this.logRepository.create({
      userId: data.userId || null,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || null,
      ip: data.ip || null,
      userAgent: data.userAgent || null,
      details: data.details || null,
      success: data.success !== undefined ? data.success : true,
    });
    await this.logRepository.save(entry);
  }

  /**
   * Registrar intento de acceso no autorizado (Req 16.5)
   */
  async logUnauthorizedAccess(data: {
    userId?: string | null;
    resource: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.log({
      userId: data.userId,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      resource: data.resource,
      ip: data.ip,
      userAgent: data.userAgent,
      success: false,
    });
  }

  /**
   * Obtener últimas actividades (para dashboard admin - Req 8.4)
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    return this.logRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtener historial de actividad de un usuario
   */
  async getUserActivity(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    return this.logRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtener actividad por recurso (tramite, cliente, etc.)
   */
  async getByResource(resource: string, resourceId: string): Promise<ActivityLog[]> {
    return this.logRepository.find({
      where: { resource, resourceId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Obtener actividad por clienteId (busca en details.clienteId)
   */
  async getByClienteId(clienteId: string): Promise<ActivityLog[]> {
    return this.logRepository
      .createQueryBuilder('log')
      .where("log.details->>'clienteId' = :clienteId", { clienteId })
      .orderBy('log.created_at', 'DESC')
      .take(50)
      .getMany();
  }
}
