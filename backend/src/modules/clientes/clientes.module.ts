import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cliente } from './entities/cliente.entity';
import { NotaInterna } from './entities/nota-interna.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { StorageService } from '../../common/services/storage.service';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, NotaInterna])],
  controllers: [ClientesController],
  providers: [ClientesService, StorageService, EncryptionService],
  exports: [ClientesService],
})
export class ClientesModule {}
