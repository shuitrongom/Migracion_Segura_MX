import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Documento } from './entities/documento.entity';
import { Expediente } from './entities/expediente.entity';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';
import { StorageService } from '../../common/services/storage.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Documento, Expediente]), NotificacionesModule],
  controllers: [DocumentosController],
  providers: [DocumentosService, StorageService, EncryptionService],
  exports: [DocumentosService],
})
export class DocumentosModule {}
