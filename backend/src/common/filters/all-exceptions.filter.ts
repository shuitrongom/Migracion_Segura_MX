import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global que loguea TODAS las excepciones no manejadas.
 * Ayuda a diagnosticar errores 500 que no aparecen en los logs normales.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as any).message || message;
    }

    // Solo loguear errores 500 (los 400 son validaciones normales)
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status} | ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Loguear 400 que no sean validaciones comunes (para debug)
    if (status >= 400 && status < 500 && status !== 401 && status !== 404) {
      this.logger.warn(
        `[${request.method}] ${request.url} → ${status} | ${JSON.stringify(message).slice(0, 200)}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
