import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ModalidadCita, EstatusCita } from '../../../common/enums';

@Entity('citas')
export class Cita extends BaseEntity {
  @Column({ name: 'cliente_id', type: 'uuid' })
  @Index()
  clienteId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cliente_id' })
  cliente: User;

  @Column({ name: 'asesor_id', type: 'uuid' })
  @Index()
  asesorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'asesor_id' })
  asesor: User;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  hora: string;

  @Column({ name: 'duracion_minutos', type: 'int', default: 30 })
  duracionMinutos: number;

  @Column({ type: 'enum', enum: ModalidadCita })
  modalidad: ModalidadCita;

  @Column({ type: 'enum', enum: EstatusCita, default: EstatusCita.PROGRAMADA })
  estatus: EstatusCita;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ name: 'google_event_id', type: 'varchar', length: 255, nullable: true })
  googleEventId: string | null;
}
