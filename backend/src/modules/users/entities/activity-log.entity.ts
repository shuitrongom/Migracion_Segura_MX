import { Entity, Column, Index, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Log de actividad del sistema (Req 16.5, 16.7)
 * Registra todas las acciones de usuarios del Panel_Admin
 */
@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId: string | null;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 255 })
  resource: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 100, nullable: true })
  resourceId: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Index()
  createdAt: Date;
}
