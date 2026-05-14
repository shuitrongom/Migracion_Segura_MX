import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { UsersService } from './users.service';
import { ActivityLogService } from './activity-log.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, ActivityLog])],
  providers: [UsersService, ActivityLogService],
  exports: [UsersService, ActivityLogService],
})
export class UsersModule {}
