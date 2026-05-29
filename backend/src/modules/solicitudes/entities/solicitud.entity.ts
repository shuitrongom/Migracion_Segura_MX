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

  @Column({ type: 'varchar', length: 100 })
  tipoTramite: string;

  @Column({ type: 'jsonb', nullable: true })
  datosFormulario: Record<string, unknown>;

  @Column({ type: 'enum', enum: EstatusSolicitud, default: EstatusSolicitud.PENDIENTE_REVISION })
  estatus: EstatusSolicitud;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numeroPieza: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contrasenaINM: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentoUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100 })
  costo: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mercadopagoPreferenceId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  mercadopagoInitPoint: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mercadopagoPaymentId: string;

  @Column({ type: 'timestamp', nullable: true })
  fechaPago: Date;

  @Column({ type: 'uuid', nullable: true })
  asesorId: string;

  @Column({ type: 'jsonb', nullable: true })
  requisitos: string[];

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
