import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notificacion } from './entities/notificacion.entity';
import { UserDevice } from './entities/user-device.entity';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
import { PushService } from './push.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacion, UserDevice])],
  controllers: [NotificacionesController],
  providers: [NotificacionesService, PushService],
  exports: [NotificacionesService, PushService],
})
export class NotificacionesModule {}
