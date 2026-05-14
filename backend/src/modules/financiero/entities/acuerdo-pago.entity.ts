import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('acuerdos_pago')
export class AcuerdoPago extends BaseEntity {
  @Column({ name: 'cliente_id', type: 'uuid' })
  @Index()
  clienteId: string;

  @Column({ name: 'tramite_id', type: 'uuid', nullable: true })
  @Index()
  tramiteId: string | null;

  @Column({ name: 'monto_total', type: 'decimal', precision: 12, scale: 2 })
  montoTotal: number;

  @Column({ type: 'varchar', length: 500 })
  descripcion: string;
}
