import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AprobarDocumentoDto {
  @ApiPropertyOptional({ description: 'Comentario opcional al aprobar' })
  @IsOptional()
  @IsString()
  comentario?: string;
}

export class RechazarDocumentoDto {
  @ApiProperty({ description: 'Razón del rechazo del documento' })
  @IsNotEmpty()
  @IsString()
  razon: string;
}
