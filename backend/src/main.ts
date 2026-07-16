// Migración Segura MX - Backend v0.1.1
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Filtro global de excepciones (loguea errores 500 y warnings 400)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Sanitización global de inputs (previene XSS)
  app.useGlobalInterceptors(new SanitizeInterceptor());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Helmet - Headers de seguridad HTTP
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  }));

  // CORS
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  const allowedOrigins = isProduction
    ? [frontendUrl, 'https://admin.migracionseguramx.com', 'https://migracion-segura-mx-admin-panel.vercel.app']
    : [frontendUrl, 'https://admin.migracionseguramx.com', 'https://migracion-segura-mx-admin-panel.vercel.app', 'http://localhost:3001', 'http://localhost:8081', 'http://localhost:19006'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Id'],
    exposedHeaders: ['X-Token-Expiry'],
    maxAge: 600,
  });

  app.setGlobalPrefix(apiPrefix);

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: isProduction,
    }),
  );

  // Swagger - solo en desarrollo
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Migración Segura MX API')
      .setDescription('API REST para la plataforma de gestión migratoria')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, { swaggerOptions: { persistAuthorization: true } });
  }

  await app.listen(port);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Servidor corriendo en puerto ${port} [${isProduction ? 'PRODUCCION' : 'DESARROLLO'}]`);
  if (!isProduction) logger.log(`Documentacion API en http://localhost:${port}/docs`);
}

bootstrap();
