import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Ticket } from './entities/ticket.entity';
import { MensajeTicket } from './entities/mensaje-ticket.entity';
import { SoporteService } from './soporte.service';
import { SoporteController } from './soporte.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, MensajeTicket])],
  controllers: [SoporteController],
  providers: [SoporteService],
  exports: [SoporteService],
})
export class SoporteModule {}
