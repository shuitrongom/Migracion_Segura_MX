import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Beneficiario = la persona extranjera real a quien se le realiza el trámite.
 * Un usuario (cuenta) puede tener múltiples beneficiarios (él mismo, familiares, amigos).
 */
@Entity('beneficiarios')
export class Beneficiario extends BaseEntity {
  /** Usuario dueño de la cuenta que registró a este beneficiario */
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Relación con el usuario — ej: "yo mismo", "esposa", "hermano", "amigo" */
  @Column({ type: 'varchar', length: 50, default: 'yo_mismo' })
  parentesco: string;

  // ─── Datos personales del extranjero ───────────────────────────────────────

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  sexo: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'varchar', length: 20, nullable: true })
  fechaNacimiento: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  nacionalidad: string | null;

  @Column({ name: 'estado_civil', type: 'varchar', length: 30, nullable: true })
  estadoCivil: string | null;

  @Column({ name: 'pais_nacimiento', type: 'varchar', length: 80, nullable: true })
  paisNacimiento: string | null;

  // ─── Documento de identidad ────────────────────────────────────────────────

  @Column({ name: 'tipo_documento', type: 'varchar', length: 50, nullable: true })
  tipoDocumento: string | null;

  @Column({ name: 'numero_documento', type: 'varchar', length: 50, nullable: true })
  numeroDocumento: string | null;

  @Column({ name: 'pais_expedicion', type: 'varchar', length: 80, nullable: true })
  paisExpedicion: string | null;

  @Column({ name: 'fecha_vencimiento_doc', type: 'varchar', length: 20, nullable: true })
  fechaVencimientoDoc: string | null;

  // ─── CURP y contacto ───────────────────────────────────────────────────────

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  curp: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  // ─── Metadata extra ────────────────────────────────────────────────────────

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
