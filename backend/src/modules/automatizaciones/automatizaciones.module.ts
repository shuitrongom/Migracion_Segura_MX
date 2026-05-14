import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AutomatizacionConfig } from './entities/automatizacion-config.entity';
import { LogAutomatizacion } from './entities/log-automatizacion.entity';
import { AutomatizacionesService } from './automatizaciones.service';

@Module({
  imports: [TypeOrmModule.forFeature([AutomatizacionConfig, LogAutomatizacion])],
  providers: [AutomatizacionesService],
  exports: [AutomatizacionesService],
})
export class AutomatizacionesModule {}
