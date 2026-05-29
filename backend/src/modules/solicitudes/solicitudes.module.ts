import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Solicitud } from './entities/solicitud.entity';
import { AppConfig } from './entities/app-config.entity';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { FinancieroModule } from '../financiero/financiero.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Solicitud, AppConfig]),
    NotificacionesModule,
    forwardRef(() => FinancieroModule),
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
