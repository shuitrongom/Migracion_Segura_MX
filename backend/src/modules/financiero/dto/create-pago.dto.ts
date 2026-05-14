import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  IsPositive,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MetodoPago } from '../../../common/enums';

export class CreatePagoDto {
  @ApiProperty({ description: 'UUID del cliente' })
  @IsNotEmpty()
  @IsUUID()
  clienteId: string;

  @ApiPropertyOptional({ description: 'UUID del trámite asociado' })
  @IsOptional()
  @IsUUID()
  tramiteId?: string;

  @ApiProperty({ description: 'Monto del pago', example: 5000.0 })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monto: number;

  @ApiProperty({ description: 'Fecha del pago (YYYY-MM-DD)', example: '2024-06-15' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  fecha: string;

  @ApiProperty({ description: 'Método de pago', enum: MetodoPago })
  @IsNotEmpty()
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @ApiProperty({ description: 'Concepto del pago', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  concepto: string;
}
