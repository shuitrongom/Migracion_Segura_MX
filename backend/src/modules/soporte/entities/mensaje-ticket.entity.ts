import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Ticket } from './ticket.entity';
import { User } from '../../users/entities/user.entity';

@Entity('mensajes_ticket')
export class MensajeTicket extends BaseEntity {
  @Column({ name: 'ticket_id', type: 'uuid' })
  @Index()
  ticketId: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.mensajes)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'autor_id', type: 'uuid' })
  autorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'autor_id' })
  autor: User;

  @Column({ type: 'text' })
  contenido: string;
}
