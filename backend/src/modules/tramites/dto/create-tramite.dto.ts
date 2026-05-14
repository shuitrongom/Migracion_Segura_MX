import { IsEnum, IsOptional, IsUUID, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { TipoTramite } from '../../../common/enums';

export class CreateTramiteDto {
  @ApiProperty({ description: 'ID del cliente', example: 'uuid-del-cliente' })
  @IsUUID()
  clienteId: string;

  @ApiProperty({ description: 'Tipo de trámite migratorio', enum: TipoTramite })
  @IsEnum(TipoTramite)
  tipo: TipoTramite;

  @ApiPropertyOptional({ description: 'Datos del formulario del trámite' })
  @IsOptional()
  @IsObject()
  datosFormulario?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'ID del asesor asignado' })
  @IsOptional()
  @IsUUID()
  asesorId?: string;

  @ApiPropertyOptional({ description: 'Guardar como borrador sin generar número de pieza', default: false })
  @IsOptional()
  @IsBoolean()
  esBorrador?: boolean;
}
