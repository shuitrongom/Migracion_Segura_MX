import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { MetodoPago } from '../../../common/enums';

/**
 * Estados del pago
 */
export enum EstatusPago {
  PENDIENTE = 'pendiente',                     // Link generado, esperando pago
  EN_REVISION_VOUCHER = 'en_revision_voucher', // Voucher subido, esperando revisión del admin
  APROBADO = 'aprobado',                       // Pago confirmado
  RECHAZADO = 'rechazado',                     // Pago rechazado
  CANCELADO = 'cancelado',                     // Cancelado por timeout o admin
  REEMBOLSADO = 'reembolsado',                 // Dinero devuelto
}

/**
 * Tipo de pago en el flujo dividido
 */
export enum TipoPago {
  ANTICIPO = 'anticipo',         // 50% al inicio
  LIQUIDACION = 'liquidacion',   // 50% al finalizar
  PAGO_UNICO = 'pago_unico',    // Pago completo en una sola exhibición
}

@Entity('pagos')
export class Pago extends BaseEntity {
  @Column({ name: 'cliente_id', type: 'uuid' })
  @Index()
  clienteId: string;

  @Column({ name: 'tramite_id', type: 'uuid', nullable: true })
  @Index()
  tramiteId: string | null;

  // Montos
  @Column({ name: 'monto_total_tramite', type: 'decimal', precision: 12, scale: 2 })
  montoTotalTramite: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ type: 'date' })
  fecha: Date;

  // Tipo y estatus
  @Column({ name: 'tipo_pago', type: 'enum', enum: TipoPago, default: TipoPago.PAGO_UNICO })
  tipoPago: TipoPago;

  @Column({ name: 'estatus_pago', type: 'enum', enum: EstatusPago, default: EstatusPago.PENDIENTE })
  estatusPago: EstatusPago;

  @Column({ name: 'metodo_pago', type: 'enum', enum: MetodoPago, nullable: true })
  metodoPago: MetodoPago | null;

  @Column({ type: 'varchar', length: 255 })
  concepto: string;

  // Mercado Pago
  @Column({ name: 'mercadopago_preference_id', type: 'varchar', length: 255, nullable: true })
  mercadopagoPreferenceId: string | null;

  @Column({ name: 'mercadopago_payment_id', type: 'varchar', length: 255, nullable: true })
  mercadopagoPaymentId: string | null;

  @Column({ name: 'mercadopago_init_point', type: 'varchar', length: 500, nullable: true })
  mercadopagoInitPoint: string | null;

  @Column({ name: 'mercadopago_status', type: 'varchar', length: 50, nullable: true })
  mercadopagoStatus: string | null;

  @Column({ name: 'mercadopago_status_detail', type: 'varchar', length: 100, nullable: true })
  mercadopagoStatusDetail: string | null;

  // Fechas de control
  @Column({ name: 'fecha_vencimiento', type: 'timestamptz', nullable: true })
  fechaVencimiento: Date | null;

  @Column({ name: 'fecha_pago', type: 'timestamptz', nullable: true })
  fechaPago: Date | null;

  // Auditoría
  @Column({ name: 'registrado_por', type: 'uuid' })
  registradoPor: string;

  @Column({ name: 'recibo_url', type: 'varchar', length: 500, nullable: true })
  reciboUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  referencia: string | null;

  // Voucher / Comprobante de transferencia
  @Column({ name: 'voucher_url', type: 'varchar', length: 500, nullable: true })
  voucherUrl: string | null;

  @Column({ name: 'monto_declarado', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoDeclarado: number | null;

  @Column({ name: 'voucher_estatus', type: 'varchar', length: 30, nullable: true, default: null })
  voucherEstatus: 'pendiente_revision' | 'aprobado' | 'rechazado' | null;

  @Column({ name: 'voucher_nota_admin', type: 'varchar', length: 500, nullable: true })
  voucherNotaAdmin: string | null;

  // Historial inmutable de cambios
  @Column({ type: 'jsonb', default: [] })
  historial: Array<{
    accion: string;
    fecha: string;
    usuarioId: string;
    detalle: string;
    montoAnterior?: number;
  }>;
}
