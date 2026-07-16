import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global de excepciones — Enterprise Error Handling.
 *
 * 1. TODAS las respuestas de error siguen el mismo formato
 * 2. Los errores 500 se loguean con stack trace completo
 * 3. Los errores de validación (400) se formatean de forma legible para la app
 * 4. Nunca expone detalles internos al cliente en producción
 *
 * Formato de respuesta:
 * {
 *   statusCode: number,
 *   error: string (código corto para la app),
 *   message: string (mensaje legible para el usuario),
 *   timestamp: string,
 *   path: string
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Si no hay response (WebSocket u otro contexto), ignorar
    if (!response || !response.status) return;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocurrió un error inesperado. Intenta de nuevo.';
    let error = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        const obj = exResponse as any;
        // NestJS validation pipe retorna un array de mensajes
        if (Array.isArray(obj.message)) {
          message = obj.message.join('. ');
        } else {
          message = obj.message || message;
        }
        error = obj.error || this.getErrorCode(status);
      }

      error = this.getErrorCode(status);
    }

    // Loguear errores 500 (los que NO deberian pasar)
    if (status >= 500) {
      this.logger.error(
        `❌ [${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
      // En producción, no exponer detalles internos
      if (this.isProduction) {
        message = 'Ocurrió un error inesperado. Intenta de nuevo más tarde.';
      }
    }

    // Loguear errores 400 (excepto 401 y 404 que son normales)
    if (status >= 400 && status < 500 && status !== 401 && status !== 404) {
      this.logger.warn(
        `⚠️ [${request.method}] ${request.url} → ${status} | ${message.slice(0, 150)}`,
      );
    }

    // Enviar respuesta estandarizada
    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codes[status] || 'UNKNOWN_ERROR';
  }
}
