import { IsString, IsEmail, IsOptional, IsUUID, IsArray, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClienteDto {
  @ApiPropertyOptional({ description: 'Nombre completo del cliente' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nombreCompleto?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  telefono?: string;

  @ApiPropertyOptional({ description: 'ID del asesor asignado' })
  @IsOptional()
  @IsUUID()
  asesorId?: string;

  @ApiPropertyOptional({ description: 'Etiquetas personalizadas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];

  @ApiPropertyOptional({ description: 'Metadata adicional' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
