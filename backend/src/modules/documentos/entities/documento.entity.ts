import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Expediente } from './expediente.entity';
import { EstatusDocumento } from '../../../common/enums';

@Entity('documentos')
export class Documento extends BaseEntity {
  @Column({ name: 'expediente_id', type: 'uuid' })
  @Index()
  expedienteId: string;

  @ManyToOne(() => Expediente, (exp) => exp.documentos)
  @JoinColumn({ name: 'expediente_id' })
  expediente: Expediente;

  @Column({ name: 'tramite_id', type: 'uuid', nullable: true })
  @Index()
  tramiteId: string | null;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  categoria: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey: string;

  @Column({ type: 'enum', enum: EstatusDocumento, default: EstatusDocumento.RECIBIDO })
  estatus: EstatusDocumento;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento: Date | null;

  @Column({ name: 'razon_rechazo', type: 'text', nullable: true })
  razonRechazo: string | null;

  @Column({ name: 'revisado_por', type: 'uuid', nullable: true })
  revisadoPor: string | null;

  @Column({ name: 'fecha_revision', type: 'timestamptz', nullable: true })
  fechaRevision: Date | null;

  @Column({ type: 'jsonb', default: '[]' })
  historial: Array<{
    accion: string;
    usuarioId: string;
    fecha: string;
    detalle?: string;
  }>;
}
