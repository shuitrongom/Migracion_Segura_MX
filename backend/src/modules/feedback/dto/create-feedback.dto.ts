import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { FeedbackTipo } from '../entities/feedback.entity';

export class DeviceInfoDto {
  @IsString()
  platform: string;

  @IsString()
  osVersion: string;

  @IsString()
  appVersion: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

export class CreateFeedbackDto {
  @ApiProperty({
    enum: FeedbackTipo,
    description: 'Tipo de reporte: error, sugerencia, confusion, otro',
  })
  @IsEnum(FeedbackTipo)
  tipo: FeedbackTipo;

  @ApiPropertyOptional({ description: 'Pantalla desde donde se reportó', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  pantalla?: string;

  @ApiProperty({ description: 'Descripción del problema o sugerencia' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  descripcion: string;

  @ApiPropertyOptional({ description: 'Pasos para reproducir el problema' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pasosReproduccion?: string;

  @ApiPropertyOptional({ description: 'Calificación de experiencia del 1 al 5', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Información del dispositivo' })
  @IsOptional()
  @IsObject()
  deviceInfo?: DeviceInfoDto;
}
