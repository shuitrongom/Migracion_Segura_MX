import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { User } from '../../users/entities/user.entity';
import { TipoTramite, EstatusTramite } from '../../../common/enums';
import { EtapaTramite } from './etapa-tramite.entity';

@Entity('tramites')
export class Tramite extends BaseEntity {
  @Column({ name: 'cliente_id', type: 'uuid' })
  @Index()
  clienteId: string;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ type: 'enum', enum: TipoTramite })
  tipo: TipoTramite;

  @Column({ type: 'enum', enum: EstatusTramite, default: EstatusTramite.BORRADOR })
  estatus: EstatusTramite;

  @Column({ name: 'numero_pieza', type: 'varchar', length: 20, unique: true, nullable: true })
  @Index()
  numeroPieza: string | null;

  @Column({ name: 'contrasena_tramite', type: 'varchar', length: 100, nullable: true })
  contrasenaTramite: string | null;

  @Column({ name: 'asesor_id', type: 'uuid', nullable: true })
  @Index()
  asesorId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'asesor_id' })
  asesor: User | null;

  @Column({ name: 'responsable_id', type: 'uuid', nullable: true })
  responsableId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsable_id' })
  responsable: User | null;

  @Column({ name: 'datos_formulario', type: 'jsonb', nullable: true })
  datosFormulario: Record<string, unknown> | null;

  @Column({ name: 'fecha_cierre', type: 'timestamptz', nullable: true })
  fechaCierre: Date | null;

  @Column({ name: 'resolucion', type: 'text', nullable: true })
  resolucion: string | null;

  @Column({ name: 'comprobante_url', type: 'varchar', length: 500, nullable: true })
  comprobanteUrl: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nut: string | null;

  @Column({ name: 'nut_url', type: 'varchar', length: 500, nullable: true })
  nutUrl: string | null;

  @Column({ name: 'fecha_presentacion_inm', type: 'timestamptz', nullable: true })
  fechaPresentacionInm: Date | null;

  @OneToMany(() => EtapaTramite, (etapa) => etapa.tramite, { cascade: true })
  etapas: EtapaTramite[];
}
