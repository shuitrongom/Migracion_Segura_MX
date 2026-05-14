import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';

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
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD', ''),
        },
      }),
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
    HealthModule,
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
