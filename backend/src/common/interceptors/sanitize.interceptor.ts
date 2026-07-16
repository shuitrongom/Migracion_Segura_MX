import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor de Sanitización — Limpia datos de entrada.
 *
 * Previene:
 * - XSS (scripts en campos de texto)
 * - SQL Injection básico (aunque TypeORM ya parametriza queries)
 * - Caracteres de control peligrosos
 *
 * Se aplica globalmente a todos los requests POST/PATCH/PUT.
 * NO afecta archivos (multipart) — solo JSON bodies.
 */
@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body && typeof request.body === 'object') {
      request.body = this.sanitizeObject(request.body);
    }

    return next.handle();
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return this.sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(item => this.sanitizeObject(item));
    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    return obj; // números, booleans, etc.
  }

  private sanitizeString(str: string): string {
    return str
      // Eliminar tags HTML/script
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      // Eliminar caracteres de control (excepto newline y tab)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Trim
      .trim();
  }
}
