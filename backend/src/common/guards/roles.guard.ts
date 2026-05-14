import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ActivityLogService } from '../../modules/users/activity-log.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(ActivityLogService)
    private activityLogService: ActivityLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('Acceso denegado: usuario no autenticado');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      // Req 16.5: Registrar intento de acceso no autorizado
      await this.activityLogService.logUnauthorizedAccess({
        userId: user.id,
        resource: `${request.method} ${request.url}`,
        ip: request.ip,
        userAgent: request.headers?.['user-agent'],
      });

      throw new ForbiddenException(
        'Acceso denegado: no tienes permisos para acceder a este recurso',
      );
    }

    return true;
  }
}
