import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ActivityLogService } from './activity-log.service';
import { StorageService } from '../../common/services/storage.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, ActivityLog])],
  controllers: [UsersController],
  providers: [UsersService, ActivityLogService, StorageService],
  exports: [UsersService, ActivityLogService],
})
export class UsersModule {}
