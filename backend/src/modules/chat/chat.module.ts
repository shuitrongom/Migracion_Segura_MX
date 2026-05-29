import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatMessage } from './entities/message.entity';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage])],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
