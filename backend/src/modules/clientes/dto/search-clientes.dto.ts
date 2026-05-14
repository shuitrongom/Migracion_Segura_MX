import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EstatusTramite } from '../../../common/enums';

export class SearchClientesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Búsqueda por nombre, email, teléfono o número de pieza' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estatus de trámite', enum: EstatusTramite })
  @IsOptional()
  @IsEnum(EstatusTramite)
  estatusTramite?: EstatusTramite;

  @ApiPropertyOptional({ description: 'Filtrar por etiqueta' })
  @IsOptional()
  @IsString()
  etiqueta?: string;

  @ApiPropertyOptional({ description: 'Filtrar por asesor asignado (UUID)' })
  @IsOptional()
  @IsString()
  asesorId?: string;
}
