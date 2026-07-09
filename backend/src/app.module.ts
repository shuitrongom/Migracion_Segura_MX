import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';
import { ScheduleModule } from '@nestjs/schedule';

import { appConfig, databaseConfig, authConfig, storageConfig } from './config';
import { winstonConfig } from './config/winston.config';
import { DatabaseConfig } from './database/database.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Módulos de la aplicación
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { TramitesModule } from './modules/tramites/tramites.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { CitasModule } from './modules/citas/citas.module';
import { SoporteModule } from './modules/soporte/soporte.module';
import { FinancieroModule } from './modules/financiero/financiero.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { AutomatizacionesModule } from './modules/automatizaciones/automatizaciones.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { ChatModule } from './modules/chat/chat.module';
import { BeneficiariosModule } from './modules/beneficiarios/beneficiarios.module';
import { OcrModule } from './modules/ocr/ocr.module';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, storageConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Logger
    WinstonModule.forRoot(winstonConfig),

    // Base de datos
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Redis / Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD', '');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        return {
          redis: {
            host: redisHost,
            port: redisPort,
            password: redisPassword || undefined,
            tls: isProduction ? {} : undefined,
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
              if (times > 3) return null;
              return Math.min(times * 200, 2000);
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),

    // Módulos de negocio
    ScheduleModule.forRoot(),
    HealthModule,
    EmailModule,
    AuthModule,
    UsersModule,
    ClientesModule,
    TramitesModule,
    DocumentosModule,
    NotificacionesModule,
    CitasModule,
    SoporteModule,
    FinancieroModule,
    ReportesModule,
    AutomatizacionesModule,
    SolicitudesModule,
    ChatModule,
    BeneficiariosModule,
    OcrModule,
  ],
  providers: [
    // Guard global: Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Guard global: JWT Auth (Req 16.9)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Guard global: Roles (Req 16.4)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
