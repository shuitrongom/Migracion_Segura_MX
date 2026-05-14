import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { MetodoPago } from '../../../common/enums';

@Entity('pagos')
export class Pago extends BaseEntity {
  @Column({ name: 'cliente_id', type: 'uuid' })
  @Index()
  clienteId: string;

  @Column({ name: 'tramite_id', type: 'uuid', nullable: true })
  @Index()
  tramiteId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ name: 'metodo_pago', type: 'enum', enum: MetodoPago })
  metodoPago: MetodoPago;

  @Column({ type: 'varchar', length: 255 })
  concepto: string;

  @Column({ name: 'recibo_url', type: 'varchar', length: 500, nullable: true })
  reciboUrl: string | null;

  @Column({ name: 'registrado_por', type: 'uuid' })
  registradoPor: string;
}
