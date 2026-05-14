import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('log_automatizaciones')
export class LogAutomatizacion extends BaseEntity {
  @Column({ name: 'automatizacion_id', type: 'uuid' })
  @Index()
  automatizacionId: string;

  @Column({ type: 'varchar', length: 50 })
  canal: string;

  @Column({ name: 'destinatario_id', type: 'uuid' })
  destinatarioId: string;

  @Column({ type: 'varchar', length: 50 })
  resultado: string; // 'entregado' | 'fallido'

  @Column({ name: 'detalle_error', type: 'text', nullable: true })
  detalleError: string | null;
}
