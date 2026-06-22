import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatMessage } from './entities/message.entity';
import { ChatGateway } from './chat.gateway';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage]), NotificacionesModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
