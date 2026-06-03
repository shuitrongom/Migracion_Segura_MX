import { IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoTramite } from '../../../common/enums';

export class CreateSolicitudDto {
  @ApiProperty({ description: 'Tipo de trámite para la solicitud', enum: TipoTramite })
  @IsEnum(TipoTramite)
  tipoTramite: TipoTramite;

  @ApiProperty({ description: 'Datos del formulario llenados por el extranjero' })
  @IsObject()
  datosFormulario: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'ID del cliente (se auto-detecta si no se envía)' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'ID del beneficiario (extranjero) para quien se hace la solicitud' })
  @IsOptional()
  @IsUUID()
  beneficiarioId?: string;
}
