import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Tramite } from './tramite.entity';

@Entity('etapas_tramite')
export class EtapaTramite extends BaseEntity {
  @Column({ name: 'tramite_id', type: 'uuid' })
  @Index()
  tramiteId: string;

  @ManyToOne(() => Tramite, (tramite) => tramite.etapas)
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'int' })
  orden: number;

  @Column({ type: 'boolean', default: false })
  completada: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ name: 'fecha_completada', type: 'timestamptz', nullable: true })
  fechaCompletada: Date | null;
}
