import { Entity, Column } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('automatizacion_configs')
export class AutomatizacionConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  tipo: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({ type: 'jsonb', nullable: true })
  parametros: Record<string, unknown> | null;
}
