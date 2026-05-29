import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Registro de nuevo usuario (Req 1.1, 1.2)
   */
  async register(email: string, phone: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

    const user = await this.usersService.create({
      email,
      phone,
      passwordHash: hashedPassword,
      verificationCode,
      verificationCodeExpiresAt: verificationExpires,
    });

    // Enviar código de verificación por email (Req 1.2)
    await this.emailService.sendVerificationCodeEmail({
      to: email,
      code: verificationCode,
    });

    return {
      message: 'Registro exitoso. Se ha enviado un código de verificación a tu correo.',
      userId: user.id,
    };
  }

  /**
   * Verificar código de activación (Req 1.3, 1.4)
   */
  async verifyCode(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.isVerified) {
      throw new BadRequestException('La cuenta ya está verificada');
    }

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      throw new BadRequestException('No hay código de verificación pendiente. Solicita uno nuevo.');
    }

    // Verificar expiración
    if (new Date() > user.verificationCodeExpiresAt) {
      throw new BadRequestException(
        'El código de verificación ha expirado. Solicita uno nuevo.',
      );
    }

    // Verificar código
    if (user.verificationCode !== code) {
      throw new BadRequestException('El código de verificación es incorrecto.');
    }

    // Activar cuenta
    await this.usersService.verifyUser(userId);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Cuenta verificada exitosamente.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: true,
      },
    };
  }

  /**
   * Reenviar código de verificación (Req 1.4)
   */
  async resendVerificationCode(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.isVerified) {
      throw new BadRequestException('La cuenta ya está verificada');
    }

    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

    await this.usersService.updateVerificationCode(userId, verificationCode, verificationExpires);

    // Enviar por email
    await this.emailService.sendVerificationCodeEmail({
      to: user.email,
      code: verificationCode,
    });

    return { message: 'Se ha enviado un nuevo código de verificación.' };
  }

  /**
   * Login con email y contraseña (Req 1.5)
   */
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar bloqueo por intentos fallidos (Req 1.11)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutesLeft} minutos.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');

    if (!isPasswordValid) {
      await this.usersService.incrementFailedAttempts(user.id);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que la cuenta esté verificada
    if (!user.isVerified) {
      throw new ForbiddenException(
        'Tu cuenta no ha sido verificada. Revisa tu correo electrónico.',
      );
    }

    // Reset intentos fallidos y actualizar último login
    await this.usersService.resetFailedAttempts(user.id);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * Login/Registro con Google OAuth (Req 1.6)
   */
  async loginWithGoogle(googleProfile: {
    googleId: string;
    email: string;
    fullName: string;
    profilePhotoUrl?: string;
  }) {
    let user = await this.usersService.findByGoogleId(googleProfile.googleId);

    if (!user) {
      // Verificar si ya existe un usuario con ese email
      user = await this.usersService.findByEmail(googleProfile.email);

      if (user) {
        // Vincular Google ID al usuario existente
        await this.usersService.linkGoogleAccount(user.id, googleProfile.googleId);
      } else {
        // Crear nuevo usuario
        user = await this.usersService.createFromOAuth({
          email: googleProfile.email,
          fullName: googleProfile.fullName,
          profilePhotoUrl: googleProfile.profilePhotoUrl || null,
          googleId: googleProfile.googleId,
        });
      }
    }

    await this.usersService.resetFailedAttempts(user.id);
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * Login/Registro con Apple ID (Req 1.7)
   */
  async loginWithApple(appleProfile: {
    appleId: string;
    email: string;
    fullName?: string;
  }) {
    let user = await this.usersService.findByAppleId(appleProfile.appleId);

    if (!user) {
      user = await this.usersService.findByEmail(appleProfile.email);

      if (user) {
        await this.usersService.linkAppleAccount(user.id, appleProfile.appleId);
      } else {
        user = await this.usersService.createFromOAuth({
          email: appleProfile.email,
          fullName: appleProfile.fullName || null,
          profilePhotoUrl: null,
          appleId: appleProfile.appleId,
        });
      }
    }

    await this.usersService.resetFailedAttempts(user.id);
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * Solicitar recuperación de contraseña (Req 1.8)
   */
  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);

    // No revelar si el email existe o no (seguridad)
    if (!user) {
      return { message: 'Si el correo está registrado, recibirás un enlace de recuperación.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setMinutes(resetExpires.getMinutes() + 30); // 30 min vigencia

    await this.usersService.setPasswordResetToken(user.id, resetToken, resetExpires);

    const resetUrl = `${this.configService.get<string>('app.frontendUrl')}/reset-password?token=${resetToken}`;

    // Enviar email con enlace de reset
    await this.emailService.sendPasswordResetEmail({ to: email, resetUrl });

    return { message: 'Si el correo está registrado, recibirás un enlace de recuperación.' };
  }

  /**
   * Restablecer contraseña con token (Req 1.8)
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);

    if (!user) {
      throw new BadRequestException('El enlace de recuperación es inválido o ha expirado.');
    }

    if (!user.passwordResetExpiresAt || new Date() > user.passwordResetExpiresAt) {
      throw new BadRequestException('El enlace de recuperación ha expirado. Solicita uno nuevo.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' };
  }

  /**
   * Refrescar token de acceso (con rotación de refresh token)
   */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.deletedAt) {
        throw new UnauthorizedException('Token inválido');
      }

      // Rotación: generar nuevos tokens (el refresh anterior queda invalidado por tiempo)
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900, // 15 minutos en segundos
      };
    } catch {
      throw new UnauthorizedException('Token de refresco inválido o expirado. Inicia sesión de nuevo.');
    }
  }

  /**
   * Actualizar perfil del usuario (Req 1.9)
   */
  async updateProfile(
    userId: string,
    data: { fullName?: string; profilePhotoUrl?: string },
  ) {
    await this.usersService.updateProfile(userId, data);
    return { message: 'Perfil actualizado exitosamente.' };
  }

  /**
   * Solicitar cambio de email/teléfono (Req 1.10)
   * Requiere verificación del nuevo dato
   */
  async requestEmailChange(userId: string, newEmail: string) {
    const existing = await this.usersService.findByEmail(newEmail);
    if (existing) {
      throw new BadRequestException('El correo electrónico ya está en uso.');
    }

    const verificationCode = this.generateVerificationCode();
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

    await this.usersService.setPendingEmailChange(userId, newEmail, verificationCode, verificationExpires);

    // Enviar código al nuevo email
    await this.emailService.sendVerificationCodeEmail({ to: newEmail, code: verificationCode });

    return { message: 'Se ha enviado un código de verificación al nuevo correo.' };
  }

  /**
   * Confirmar cambio de email (Req 1.10)
   */
  async confirmEmailChange(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.pendingEmail || !user.pendingEmailCode) {
      throw new BadRequestException('No hay cambio de email pendiente.');
    }

    if (new Date() > (user.pendingEmailExpiresAt || new Date(0))) {
      throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
    }

    if (user.pendingEmailCode !== code) {
      throw new BadRequestException('Código incorrecto.');
    }

    await this.usersService.applyEmailChange(userId, user.pendingEmail);
    return { message: 'Correo electrónico actualizado exitosamente.' };
  }

  /**
   * Cambiar credenciales del admin (email y/o contraseña)
   * Solo disponible para usuarios con rol administrador
   */
  async changeAdminCredentials(userId: string, data: { newEmail?: string; newPassword?: string }) {
    const user = await this.usersService.findById(userId);
    if (!user || user.role !== 'administrador') {
      throw new BadRequestException('Solo administradores pueden usar este endpoint.');
    }

    if (data.newEmail) {
      await this.usersService.applyEmailChange(userId, data.newEmail);
    }

    if (data.newPassword) {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await this.usersService.updatePassword(userId, hashedPassword);
    }

    return { message: 'Credenciales actualizadas exitosamente.' };
  }

  // ---- Helpers privados ----

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
        expiresIn: this.configService.get<string>('auth.jwtRefreshExpiration', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
