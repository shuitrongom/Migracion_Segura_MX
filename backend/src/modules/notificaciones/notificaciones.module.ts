import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notificacion } from './entities/notificacion.entity';
import { UserDevice } from './entities/user-device.entity';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
import { PushService } from './push.service';
import { SchedulerService } from './scheduler.service';
import { AdminNotifierService } from './admin-notifier.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacion, UserDevice])],
  controllers: [NotificacionesController],
  providers: [NotificacionesService, PushService, SchedulerService, AdminNotifierService],
  exports: [NotificacionesService, PushService, AdminNotifierService],
})
export class NotificacionesModule {}
