import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums';
import { CreateAsesorDto } from './dto/create-asesor.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Crear usuario con email/teléfono (registro normal)
   */
  async create(data: {
    email: string;
    phone: string;
    passwordHash: string;
    verificationCode: string;
    verificationCodeExpiresAt: Date;
  }): Promise<User> {
    const user = this.userRepository.create({
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      verificationCode: data.verificationCode,
      verificationCodeExpiresAt: data.verificationCodeExpiresAt,
      role: UserRole.CLIENTE,
    });
    return this.userRepository.save(user);
  }

  /**
   * Crear usuario desde OAuth (Google/Apple)
   */
  async createFromOAuth(data: {
    email: string;
    fullName: string | null;
    profilePhotoUrl: string | null;
    googleId?: string;
    appleId?: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      email: data.email,
      fullName: data.fullName,
      profilePhotoUrl: data.profilePhotoUrl,
      googleId: data.googleId || null,
      appleId: data.appleId || null,
      role: UserRole.CLIENTE,
      isVerified: true, // OAuth ya verifica el email
    });
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async findByAppleId(appleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { appleId } });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { passwordResetToken: token } });
  }

  /**
   * Verificar cuenta del usuario (Req 1.3)
   */
  async verifyUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
    });
  }

  /**
   * Actualizar código de verificación (Req 1.4)
   */
  async updateVerificationCode(
    userId: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      verificationCode: code,
      verificationCodeExpiresAt: expiresAt,
    });
  }

  /**
   * Incrementar intentos fallidos de login (Req 1.11)
   * Bloquea la cuenta tras 5 intentos por 15 minutos
   */
  async incrementFailedAttempts(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    const newAttempts = user.failedAttempts + 1;
    const updateData: Partial<User> = { failedAttempts: newAttempts };

    if (newAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      updateData.lockedUntil = lockUntil;
      // TODO: Notificar al cliente por email sobre el bloqueo
    }

    await this.userRepository.update(userId, updateData);
  }

  /**
   * Resetear intentos fallidos tras login exitoso
   */
  async resetFailedAttempts(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });
  }

  /**
   * Vincular cuenta de Google (Req 1.6)
   */
  async linkGoogleAccount(userId: string, googleId: string): Promise<void> {
    await this.userRepository.update(userId, { googleId });
  }

  /**
   * Vincular cuenta de Apple (Req 1.7)
   */
  async linkAppleAccount(userId: string, appleId: string): Promise<void> {
    await this.userRepository.update(userId, { appleId });
  }

  /**
   * Guardar token de reset de contraseña (Req 1.8)
   */
  async setPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    });
  }

  /**
   * Actualizar contraseña (Req 1.8)
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(userId, {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }

  /**
   * Actualizar perfil (Req 1.9)
   */
  async updateProfile(
    userId: string,
    data: { fullName?: string; profilePhotoUrl?: string },
  ): Promise<void> {
    await this.userRepository.update(userId, data);
  }

  /**
   * Guardar cambio de email pendiente (Req 1.10)
   */
  async setPendingEmailChange(
    userId: string,
    newEmail: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      pendingEmail: newEmail,
      pendingEmailCode: code,
      pendingEmailExpiresAt: expiresAt,
    });
  }

  /**
   * Aplicar cambio de email (Req 1.10)
   */
  async applyEmailChange(userId: string, newEmail: string): Promise<void> {
    await this.userRepository.update(userId, {
      email: newEmail,
      pendingEmail: null,
      pendingEmailCode: null,
      pendingEmailExpiresAt: null,
    });
  }

  /**
   * Listar usuarios por rol (para selects de asesores, etc.)
   */
  async findByRole(role: UserRole): Promise<Pick<User, 'id' | 'fullName' | 'email'>[]> {
    return this.userRepository.find({
      where: { role, isVerified: true },
      select: ['id', 'fullName', 'email'],
      order: { fullName: 'ASC' },
    });
  }

  /**
   * Actualizar última actividad
   */
  async updateLastActivity(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastActivityAt: new Date() });
  }

  /**
   * Actualizar token FCM para push notifications
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.userRepository.update(userId, { fcmToken });
  }

  /**
   * Actualizar preferencias de notificación (Req 6.6)
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Record<string, boolean>,
  ): Promise<void> {
    await this.userRepository.update(userId, { notificationPreferences: preferences });
  }

  /**
   * Crear asesor (solo admin)
   */
  async createAsesor(dto: CreateAsesorDto): Promise<Pick<User, 'id' | 'fullName' | 'email'>> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone || null,
      passwordHash,
      role: UserRole.ASESOR,
      isVerified: true,
    });

    const saved = await this.userRepository.save(user);

    // Enviar email de bienvenida con credenciales
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://migracion-segura-mx-admin-panel.vercel.app';
    const loginUrl = `${frontendUrl}/login`;

    await this.emailService.sendAsesorWelcomeEmail({
      to: dto.email,
      fullName: dto.fullName,
      password: dto.password,
      loginUrl,
    });

    // Generar link de WhatsApp con credenciales (si tiene teléfono)
    if (dto.phone) {
      const whatsappMessage = encodeURIComponent(
        `¡Hola ${dto.fullName}! 👋\n\n` +
        `Se te ha dado acceso como Asesor en Migración Segura MX.\n\n` +
        `📧 Email: ${dto.email}\n` +
        `🔑 Contraseña: ${dto.password}\n\n` +
        `🔗 Accede aquí: ${loginUrl}\n\n` +
        `Te recomendamos cambiar tu contraseña después del primer inicio de sesión.`,
      );
      const phoneClean = dto.phone.replace(/[^0-9]/g, '');
      const whatsappUrl = `https://wa.me/${phoneClean}?text=${whatsappMessage}`;

      // Retornamos el link de WhatsApp para que el admin lo abra manualmente
      return { id: saved.id, fullName: saved.fullName, email: saved.email, whatsappUrl } as any;
    }

    return { id: saved.id, fullName: saved.fullName, email: saved.email };
  }

  /**
   * Eliminar asesor (soft delete)
   */
  async deleteAsesor(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id, role: UserRole.ASESOR } });
    if (!user) {
      throw new NotFoundException('Asesor no encontrado');
    }
    await this.userRepository.softDelete(id);
    return { message: 'Asesor eliminado exitosamente' };
  }
}
