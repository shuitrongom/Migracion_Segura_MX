import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { CanalNotificacion, TipoNotificacion } from '../../../common/enums';

@Entity('notificaciones')
export class Notificacion extends BaseEntity {
  @Column({ name: 'destinatario_id', type: 'uuid' })
  @Index()
  destinatarioId: string;

  @Column({ type: 'enum', enum: TipoNotificacion })
  tipo: TipoNotificacion;

  @Column({ type: 'enum', enum: CanalNotificacion })
  canal: CanalNotificacion;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @Column({ name: 'fecha_envio', type: 'timestamptz', nullable: true })
  fechaEnvio: Date | null;

  @Column({ name: 'enviada', type: 'boolean', default: false })
  enviada: boolean;

  @Column({ name: 'error_envio', type: 'text', nullable: true })
  errorEnvio: string | null;
}
