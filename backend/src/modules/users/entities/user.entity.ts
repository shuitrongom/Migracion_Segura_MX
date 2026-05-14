import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ name: 'profile_photo_url', type: 'varchar', length: 500, nullable: true })
  profilePhotoUrl: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENTE })
  role: UserRole;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'is_2fa_enabled', type: 'boolean', default: false })
  is2FAEnabled: boolean;

  @Column({ name: 'two_fa_secret', type: 'varchar', length: 255, nullable: true })
  twoFASecret: string | null;

  // ---- Verificación de cuenta ----
  @Column({ name: 'verification_code', type: 'varchar', length: 6, nullable: true })
  verificationCode: string | null;

  @Column({ name: 'verification_code_expires_at', type: 'timestamptz', nullable: true })
  verificationCodeExpiresAt: Date | null;

  // ---- Bloqueo por intentos fallidos (Req 1.11) ----
  @Column({ name: 'failed_attempts', type: 'int', default: 0 })
  failedAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  // ---- Recuperación de contraseña (Req 1.8) ----
  @Column({ name: 'password_reset_token', type: 'varchar', length: 255, nullable: true })
  passwordResetToken: string | null;

  @Column({ name: 'password_reset_expires_at', type: 'timestamptz', nullable: true })
  passwordResetExpiresAt: Date | null;

  // ---- Cambio de email pendiente (Req 1.10) ----
  @Column({ name: 'pending_email', type: 'varchar', length: 255, nullable: true })
  pendingEmail: string | null;

  @Column({ name: 'pending_email_code', type: 'varchar', length: 6, nullable: true })
  pendingEmailCode: string | null;

  @Column({ name: 'pending_email_expires_at', type: 'timestamptz', nullable: true })
  pendingEmailExpiresAt: Date | null;

  // ---- OAuth (Req 1.6, 1.7) ----
  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  googleId: string | null;

  @Column({ name: 'apple_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  appleId: string | null;

  // ---- Actividad ----
  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'last_activity_at', type: 'timestamptz', nullable: true })
  lastActivityAt: Date | null;

  // ---- Push Notifications ----
  @Column({ name: 'fcm_token', type: 'varchar', length: 500, nullable: true })
  fcmToken: string | null;

  // ---- Preferencias de notificación (Req 6.6) ----
  @Column({ name: 'notification_preferences', type: 'jsonb', nullable: true })
  notificationPreferences: Record<string, boolean> | null;
}
