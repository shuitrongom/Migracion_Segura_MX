import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Documento } from './entities/documento.entity';
import { Expediente } from './entities/expediente.entity';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';
import { StorageService } from '../../common/services/storage.service';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([Documento, Expediente])],
  controllers: [DocumentosController],
  providers: [DocumentosService, StorageService, EncryptionService],
  exports: [DocumentosService],
})
export class DocumentosModule {}
