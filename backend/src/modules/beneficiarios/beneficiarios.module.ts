import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Beneficiario } from './entities/beneficiario.entity';
import { BeneficiariosService } from './beneficiarios.service';
import { BeneficiariosController } from './beneficiarios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Beneficiario])],
  controllers: [BeneficiariosController],
  providers: [BeneficiariosService],
  exports: [BeneficiariosService],
})
export class BeneficiariosModule {}
