import { Injectable, CanActivate, ExecutionContext, ConflictException, Logger } from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard de Idempotencia — Enterprise Protection.
 *
 * Previene operaciones duplicadas cuando el usuario o la app envían
 * la misma petición múltiples veces (doble tap, retry, red lenta).
 *
 * Funciona con una ventana de tiempo: si la misma combinación de
 * userId + endpoint + body llega en menos de N segundos, rechaza la segunda.
 *
 * También soporta el header estándar `Idempotency-Key` para control explícito.
 *
 * Uso:
 *   @UseGuards(IdempotencyGuard)
 *   @Post('crear-algo')
 *   async crearAlgo() { ... }
 */

// Cache en memoria — en producción se puede usar Redis
const requestCache = new Map<string, { timestamp: number; response?: any }>();
const WINDOW_MS = 10_000; // 10 segundos de ventana anti-duplicado
const CLEANUP_INTERVAL = 60_000; // Limpiar cache cada 60s

// Limpiar cache periódicamente para evitar memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > WINDOW_MS * 3) {
      requestCache.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly logger = new Logger(IdempotencyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    // Solo aplicar a métodos que mutan datos
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Generar key de idempotencia
    const idempotencyKey = this.generateKey(request, user);

    // Verificar si ya existe una petición idéntica reciente
    const existing = requestCache.get(idempotencyKey);
    if (existing && (Date.now() - existing.timestamp) < WINDOW_MS) {
      this.logger.warn(`[Idempotency] Petición duplicada bloqueada: ${request.method} ${request.url} (userId: ${user?.id?.slice(0, 8)}...)`);
      throw new ConflictException('Esta operación ya fue procesada. Si no ves el resultado, espera unos segundos y recarga.');
    }

    // Registrar la petición
    requestCache.set(idempotencyKey, { timestamp: Date.now() });

    return true;
  }

  private generateKey(request: Request, user: any): string {
    // Si viene header Idempotency-Key explícito, usar ese
    const explicitKey = request.headers['idempotency-key'] || request.headers['x-idempotency-key'];
    if (explicitKey) {
      return `idem:${explicitKey}`;
    }

    // Generar key basada en: userId + método + path + body hash
    const userId = user?.id || 'anon';
    const path = request.url;
    const bodyStr = JSON.stringify(request.body || {});
    const bodyHash = this.simpleHash(bodyStr);

    return `auto:${userId}:${request.method}:${path}:${bodyHash}`;
  }

  /**
   * Hash simple para generar fingerprint del body
   * No necesita ser criptográfico — solo para comparar igualdad
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
