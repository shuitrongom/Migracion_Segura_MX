import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Cliente } from './cliente.entity';
import { User } from '../../users/entities/user.entity';

@Entity('notas_internas')
export class NotaInterna extends BaseEntity {
  @Column({ name: 'cliente_id', type: 'uuid' })
  @Index()
  clienteId: string;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'autor_id', type: 'uuid' })
  @Index()
  autorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'autor_id' })
  autor: User;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  fecha: Date;
}
