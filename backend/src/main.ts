import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');

  // Seguridad
  app.use(helmet());

  // CORS
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  app.enableCors({
    origin: [
      frontendUrl,
      'https://migracion-segura-mx-admin-panel.vercel.app',
      'http://localhost:3001',
      'http://localhost:8081', // Expo dev
      'http://localhost:19006', // Expo web
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Prefijo global de API
  app.setGlobalPrefix(apiPrefix);

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger / OpenAPI (habilitado en todos los entornos)
  const swaggerConfig = new DocumentBuilder()
      .setTitle('Migración Segura MX API')
      .setDescription('API REST para la plataforma de gestión migratoria')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Ingresa tu token JWT',
          in: 'header',
        },
        'access-token',
      )
      .addTag('Auth', 'Autenticación y registro')
      .addTag('Clientes', 'Gestión de clientes')
      .addTag('Tramites', 'Gestión de trámites migratorios')
      .addTag('Documentos', 'Gestión documental')
      .addTag('Citas', 'Agenda y citas')
      .addTag('Notificaciones', 'Motor de notificaciones')
      .addTag('Financiero', 'Módulo financiero')
      .addTag('Reportes', 'Reportes y estadísticas')
      .addTag('Soporte', 'Tickets de soporte')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

  await app.listen(port);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  logger.log(`📚 Documentación API en http://localhost:${port}/docs`);
}

bootstrap();
