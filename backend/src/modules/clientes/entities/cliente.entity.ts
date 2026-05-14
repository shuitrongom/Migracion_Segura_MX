import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('clientes')
export class Cliente extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 255 })
  nombreCompleto: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  @Column({ name: 'asesor_id', type: 'uuid', nullable: true })
  @Index()
  asesorId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'asesor_id' })
  asesor: User | null;

  @Column({ type: 'text', array: true, default: '{}' })
  etiquetas: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
