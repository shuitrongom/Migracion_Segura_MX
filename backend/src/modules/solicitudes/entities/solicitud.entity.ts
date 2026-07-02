import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export enum EstatusSolicitud {
  PENDIENTE_REVISION = 'pendiente_revision', // Extranjero llenó datos, esperando admin
  EN_PROCESO = 'en_proceso',                 // Admin está generando la solicitud en INM
  PENDIENTE_PAGO = 'pendiente_pago',         // Solicitud lista, esperando pago del extranjero
  PAGADA = 'pagada',                         // Pago confirmado, solicitud entregada
  CANCELADA = 'cancelada',                   // Cancelada por vencimiento o admin
}

@Entity('solicitudes')
export class Solicitud {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clienteId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  /** Beneficiario (extranjero) a quien se le genera la solicitud */
  @Column({ name: 'beneficiario_id', type: 'uuid', nullable: true })
  beneficiarioId: string | null;

  @Column({ type: 'varchar', length: 100 })
  tipoTramite: string;

  @Column({ type: 'jsonb', nullable: true })
  datosFormulario: Record<string, unknown>;

  @Column({ type: 'enum', enum: EstatusSolicitud, default: EstatusSolicitud.PENDIENTE_REVISION })
  estatus: EstatusSolicitud;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numeroPieza: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contrasenaINM: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentoUrl: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100 })
  costo: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mercadopagoPreferenceId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  mercadopagoInitPoint: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mercadopagoPaymentId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  fechaPago: Date | null;

  @Column({ type: 'uuid', nullable: true })
  asesorId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  requisitos: string[] | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  voucherUrl: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, default: null })
  voucherEstatus: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  metodoPago: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoDeclarado: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
