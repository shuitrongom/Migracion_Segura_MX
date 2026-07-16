import { Module } from '@nestjs/common';
import { ConfigRemoteController } from './config-remote.controller';
import { TelemetryController } from './telemetry.controller';
import { ConfigRemoteService } from './config-remote.service';

@Module({
  controllers: [ConfigRemoteController, TelemetryController],
  providers: [ConfigRemoteService],
  exports: [ConfigRemoteService],
})
export class ConfigRemoteModule {}
