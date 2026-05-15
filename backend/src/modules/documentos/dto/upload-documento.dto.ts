import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentoDto {
  @ApiPropertyOptional({ description: 'ID del expediente al que pertenece el documento' })
  @IsOptional()
  @IsUUID()
  expedienteId?: string;

  @ApiPropertyOptional({ description: 'ID del trámite asociado' })
  @IsOptional()
  @IsUUID()
  tramiteId?: string;

  @ApiProperty({ description: 'Nombre descriptivo del documento' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ description: 'Categoría del documento (ej: identificacion, comprobante_domicilio)' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento del documento (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}
