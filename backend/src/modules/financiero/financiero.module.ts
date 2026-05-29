import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Pago } from './entities/pago.entity';
import { AcuerdoPago } from './entities/acuerdo-pago.entity';
import { FinancieroService } from './financiero.service';
import { FinancieroController } from './financiero.controller';
import { MercadoPagoService } from './mercadopago.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, AcuerdoPago]), NotificacionesModule],
  controllers: [FinancieroController],
  providers: [FinancieroService, MercadoPagoService],
  exports: [FinancieroService, MercadoPagoService],
})
export class FinancieroModule {}
