import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { KeepAliveService } from './keepalive.service';
import { BackupService } from './backup.service';

@Module({
  controllers: [HealthController],
  providers: [KeepAliveService, BackupService],
  exports: [BackupService],
})
export class HealthModule {}
