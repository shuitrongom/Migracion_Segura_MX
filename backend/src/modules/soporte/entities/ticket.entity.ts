import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { EstatusTicket } from '../../../common/enums';
import { MensajeTicket } from './mensaje-ticket.entity';

@Entity('tickets')
export class Ticket extends BaseEntity {
  @Column({ name: 'cliente_id', type: 'uuid' })
  @Index()
  clienteId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cliente_id' })
  cliente: User;

  @Column({ name: 'asesor_id', type: 'uuid', nullable: true })
  @Index()
  asesorId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'asesor_id' })
  asesor: User | null;

  @Column({ type: 'varchar', length: 255 })
  asunto: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'enum', enum: EstatusTicket, default: EstatusTicket.ABIERTO })
  estatus: EstatusTicket;

  @OneToMany(() => MensajeTicket, (msg) => msg.ticket, { cascade: true })
  mensajes: MensajeTicket[];
}
