import { Module } from '@nestjs/common';
import { ConfigRemoteController } from './config-remote.controller';
import { ConfigRemoteService } from './config-remote.service';

@Module({
  controllers: [ConfigRemoteController],
  providers: [ConfigRemoteService],
  exports: [ConfigRemoteService],
})
export class ConfigRemoteModule {}
