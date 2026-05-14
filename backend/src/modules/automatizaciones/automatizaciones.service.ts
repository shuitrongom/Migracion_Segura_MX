import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AutomatizacionConfig } from './entities/automatizacion-config.entity';

@Injectable()
export class AutomatizacionesService {
  constructor(
    @InjectRepository(AutomatizacionConfig)
    private readonly configRepository: Repository<AutomatizacionConfig>,
  ) {}

  // TODO: Implementar en Fase 9
}
