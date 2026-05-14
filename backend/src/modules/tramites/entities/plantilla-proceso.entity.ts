import { Entity, Column } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { TipoTramite } from '../../../common/enums';

@Entity('plantillas_proceso')
export class PlantillaProceso extends BaseEntity {
  @Column({ name: 'tipo_tramite', type: 'enum', enum: TipoTramite })
  tipoTramite: TipoTramite;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'jsonb', default: '[]' })
  etapas: Array<{
    nombre: string;
    orden: number;
    descripcion?: string;
    duracionEstimadaDias?: number;
  }>;

  @Column({ name: 'documentos_requeridos', type: 'jsonb', default: '[]' })
  documentosRequeridos: Array<{
    nombre: string;
    categoria: string;
    obligatorio: boolean;
    descripcion?: string;
  }>;

  @Column({ type: 'boolean', default: true })
  activa: boolean;
}
