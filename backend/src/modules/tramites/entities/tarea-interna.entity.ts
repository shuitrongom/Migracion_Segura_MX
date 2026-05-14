import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Tramite } from './tramite.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tareas_internas')
export class TareaInterna extends BaseEntity {
  @Column({ name: 'tramite_id', type: 'uuid' })
  @Index()
  tramiteId: string;

  @ManyToOne(() => Tramite)
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'responsable_id', type: 'uuid' })
  @Index()
  responsableId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsable_id' })
  responsable: User;

  @Column({ name: 'fecha_limite', type: 'timestamptz' })
  fechaLimite: Date;

  @Column({ type: 'boolean', default: false })
  completada: boolean;

  @Column({ name: 'fecha_completada', type: 'timestamptz', nullable: true })
  fechaCompletada: Date | null;
}
