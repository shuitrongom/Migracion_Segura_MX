import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EstatusTramite } from '../../../common/enums';

export class UpdateEstatusDto {
  @ApiProperty({ description: 'Nuevo estatus del trámite', enum: EstatusTramite })
  @IsEnum(EstatusTramite)
  estatus: EstatusTramite;

  @ApiPropertyOptional({ description: 'Observaciones sobre el cambio de estatus' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Resolución (para estatus aprobado/rechazado)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolucion?: string;
}

export class AsignarResponsableDto {
  @ApiProperty({ description: 'ID del usuario responsable' })
  @IsUUID()
  responsableId: string;
}

export class AgregarObservacionDto {
  @ApiProperty({ description: 'Observaciones para la etapa' })
  @IsString()
  @MaxLength(2000)
  observaciones: string;
}

export class CreateTareaInternaDto {
  @ApiProperty({ description: 'Descripción de la tarea' })
  @IsString()
  @MaxLength(1000)
  descripcion: string;

  @ApiProperty({ description: 'ID del responsable de la tarea' })
  @IsUUID()
  responsableId: string;

  @ApiProperty({ description: 'Fecha límite de la tarea', example: '2025-01-15T00:00:00Z' })
  @IsString()
  fechaLimite: string;
}

export class CreatePlantillaProcesoDto {
  @ApiProperty({ description: 'Tipo de trámite asociado', enum: ['residencia_temporal', 'residencia_permanente', 'regularizacion', 'cambio_condicion_migratoria', 'visa', 'nacionalidad', 'permiso_trabajo', 'renovacion'] })
  @IsString()
  tipoTramite: string;

  @ApiProperty({ description: 'Nombre de la plantilla' })
  @IsString()
  @MaxLength(255)
  nombre: string;

  @ApiPropertyOptional({ description: 'Etapas del proceso' })
  @IsOptional()
  etapas?: Array<{
    nombre: string;
    orden: number;
    descripcion?: string;
    duracionEstimadaDias?: number;
  }>;

  @ApiPropertyOptional({ description: 'Documentos requeridos' })
  @IsOptional()
  documentosRequeridos?: Array<{
    nombre: string;
    categoria: string;
    obligatorio: boolean;
    descripcion?: string;
  }>;
}
