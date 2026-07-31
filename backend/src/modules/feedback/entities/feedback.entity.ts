import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum FeedbackTipo {
  ERROR = 'error',
  SUGERENCIA = 'sugerencia',
  CONFUSION = 'confusion',
  OTRO = 'otro',
}

export enum FeedbackPrioridad {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
}

export enum FeedbackEstatus {
  NUEVO = 'nuevo',
  REVISADO = 'revisado',
  EN_PROCESO = 'en_proceso',
  RESUELTO = 'resuelto',
  DESCARTADO = 'descartado',
}

@Entity('feedback_reportes')
export class Feedback extends BaseEntity {
  @Column({ name: 'cliente_id', type: 'uuid', nullable: true })
  @Index()
  clienteId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: User | null;

  // Tipo de reporte
  @Column({ type: 'enum', enum: FeedbackTipo, default: FeedbackTipo.OTRO })
  tipo: FeedbackTipo;

  // Pantalla desde donde se reportó
  @Column({ type: 'varchar', length: 120, nullable: true })
  pantalla: string | null;

  // Descripción detallada del problema/sugerencia
  @Column({ type: 'text' })
  descripcion: string;

  // Pasos para reproducir (opcional)
  @Column({ type: 'text', nullable: true, name: 'pasos_reproduccion' })
  pasosReproduccion: string | null;

  // Rating de experiencia 1-5 (opcional)
  @Column({ type: 'smallint', nullable: true })
  rating: number | null;

  // Prioridad calculada o asignada por admin
  @Column({ type: 'enum', enum: FeedbackPrioridad, default: FeedbackPrioridad.MEDIA })
  prioridad: FeedbackPrioridad;

  // Estatus del reporte
  @Column({ type: 'enum', enum: FeedbackEstatus, default: FeedbackEstatus.NUEVO })
  estatus: FeedbackEstatus;

  // Metadata del dispositivo (OS, versión app, modelo)
  @Column({ type: 'jsonb', nullable: true, name: 'device_info' })
  deviceInfo: {
    platform: string;
    osVersion: string;
    appVersion: string;
    model?: string;
    locale?: string;
  } | null;

  // Notas internas del admin
  @Column({ type: 'text', nullable: true, name: 'notas_admin' })
  notasAdmin: string | null;

  // Admin que atendió el reporte
  @Column({ name: 'atendido_por', type: 'uuid', nullable: true })
  atendidoPor: string | null;
}
