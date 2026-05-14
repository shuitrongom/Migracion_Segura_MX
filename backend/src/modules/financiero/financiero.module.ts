import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Pago } from './entities/pago.entity';
import { AcuerdoPago } from './entities/acuerdo-pago.entity';
import { FinancieroService } from './financiero.service';
import { FinancieroController } from './financiero.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, AcuerdoPago])],
  controllers: [FinancieroController],
  providers: [FinancieroService],
  exports: [FinancieroService],
})
export class FinancieroModule {}
