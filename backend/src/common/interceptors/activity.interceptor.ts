import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { ActivityLogService } from '../../modules/users/activity-log.service';

/**
 * Interceptor que registra actividad de usuarios del Panel_Admin (Req 16.7)
 * Solo registra operaciones de escritura (POST, PUT, PATCH, DELETE)
 */
@Injectable()
export class ActivityInterceptor implements NestInterceptor {
  constructor(private readonly activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    // Solo registrar operaciones de escritura
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // No registrar endpoints de auth (login, register, etc.)
    if (url.includes('/auth/')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        if (user) {
          this.activityLogService.log({
            userId: user.id,
            action: `${method}`,
            resource: url,
            ip,
            userAgent: headers?.['user-agent'],
            success: true,
          });
        }
      }),
    );
  }
}
