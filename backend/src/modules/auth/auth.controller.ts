import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registrar nuevo cliente (Req 1.1)' })
  @ApiResponse({ status: 201, description: 'Usuario registrado. Código de verificación enviado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o email ya registrado' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.phone, dto.password);
  }

  @Post('verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código de activación (Req 1.3)' })
  @ApiResponse({ status: 200, description: 'Cuenta verificada exitosamente' })
  @ApiResponse({ status: 400, description: 'Código inválido o expirado' })
  async verify(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.userId, dto.code);
  }

  @Post('verify/resend')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenviar código de verificación (Req 1.4)' })
  async resendCode(@Body() dto: { userId: string }) {
    return this.authService.resendVerificationCode(dto.userId);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña (Req 1.5)' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 403, description: 'Cuenta bloqueada o no verificada' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login/Registro con Google (Req 1.6)' })
  @ApiResponse({ status: 200, description: 'Login con Google exitoso' })
  async loginWithGoogle(
    @Body() dto: { googleId: string; email: string; fullName: string; profilePhotoUrl?: string },
  ) {
    return this.authService.loginWithGoogle(dto);
  }

  @Post('apple')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login/Registro con Apple ID (Req 1.7)' })
  @ApiResponse({ status: 200, description: 'Login con Apple exitoso' })
  async loginWithApple(
    @Body() dto: { appleId: string; email: string; fullName?: string },
  ) {
    return this.authService.loginWithApple(dto);
  }

  @Post('password/reset-request')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña (Req 1.8)' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token (Req 1.8)' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Patch('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar perfil (Req 1.9)' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Post('email/change-request')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar cambio de email (Req 1.10)' })
  async requestEmailChange(@Request() req: any, @Body() dto: RequestEmailChangeDto) {
    return this.authService.requestEmailChange(req.user.id, dto.newEmail);
  }

  @Post('email/change-confirm')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar cambio de email (Req 1.10)' })
  async confirmEmailChange(@Request() req: any, @Body() dto: ConfirmEmailChangeDto) {
    return this.authService.confirmEmailChange(req.user.id, dto.code);
  }

  @Post('admin/change-credentials')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar credenciales del admin (email y/o contraseña)' })
  async changeAdminCredentials(@Request() req: any, @Body() dto: { newEmail?: string; newPassword?: string }) {
    return this.authService.changeAdminCredentials(req.user.id, dto);
  }
}
