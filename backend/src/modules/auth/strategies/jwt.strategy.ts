import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Token inválido o usuario no encontrado');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Cuenta bloqueada temporalmente');
    }

    // Verificar que el token fue emitido DESPUÉS del último logout
    // payload.iat es el timestamp de emisión del token (en segundos)
    if (payload.iat && user.lastActivityAt) {
      const tokenIssuedAt = new Date(payload.iat * 1000);
      if (tokenIssuedAt < user.lastActivityAt) {
        throw new UnauthorizedException('Sesión expirada. Inicia sesión de nuevo.');
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };
  }
}
