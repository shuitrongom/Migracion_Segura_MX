import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Pago } from './entities/pago.entity';
import { AcuerdoPago } from './entities/acuerdo-pago.entity';
import { FinancieroService } from './financiero.service';
import { FinancieroController } from './financiero.controller';
import { MercadoPagoService } from './mercadopago.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, AcuerdoPago]), NotificacionesModule, forwardRef(() => SolicitudesModule)],
  controllers: [FinancieroController],
  providers: [FinancieroService, MercadoPagoService],
  exports: [FinancieroService, MercadoPagoService],
})
export class FinancieroModule {}
