import { IsString, IsEmail, IsOptional, IsUUID, IsArray, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({ description: 'Nombre completo del cliente', example: 'Juan Pérez García' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nombreCompleto: string;

  @ApiProperty({ description: 'Correo electrónico', example: 'juan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Teléfono de contacto', example: '+525512345678' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  telefono: string;

  @ApiPropertyOptional({ description: 'ID del asesor asignado' })
  @IsOptional()
  @IsUUID()
  asesorId?: string;

  @ApiPropertyOptional({ description: 'Etiquetas personalizadas', example: ['urgente', 'vip'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];

  @ApiPropertyOptional({ description: 'Metadata adicional' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
