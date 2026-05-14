import { Entity, Column, OneToMany, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Documento } from './documento.entity';

@Entity('expedientes')
export class Expediente extends BaseEntity {
  @Column({ name: 'cliente_id', type: 'uuid' })
  @Index()
  clienteId: string;

  @Column({ name: 'tramite_id', type: 'uuid', nullable: true })
  @Index()
  tramiteId: string | null;

  @OneToMany(() => Documento, (doc) => doc.expediente, { cascade: true })
  documentos: Documento[];
}
