import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ModalidadCita } from '../../../common/enums';

export class CreateCitaDto {
  @ApiProperty({ description: 'UUID del cliente' })
  @IsNotEmpty()
  @IsUUID()
  clienteId: string;

  @ApiProperty({ description: 'UUID del asesor' })
  @IsNotEmpty()
  @IsUUID()
  asesorId: string;

  @ApiProperty({ description: 'Fecha de la cita (YYYY-MM-DD)', example: '2024-06-15' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  fecha: string;

  @ApiProperty({ description: 'Hora de la cita (HH:mm)', example: '10:30' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'La hora debe tener formato HH:mm' })
  hora: string;

  @ApiPropertyOptional({ description: 'Duración en minutos', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  duracionMinutos?: number;

  @ApiProperty({ description: 'Modalidad de la cita', enum: ModalidadCita })
  @IsNotEmpty()
  @IsEnum(ModalidadCita)
  modalidad: ModalidadCita;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notas?: string;
}
