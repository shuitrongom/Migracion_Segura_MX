import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAsesorDto {
  @ApiProperty({ description: 'Nombre completo del asesor', example: 'Carlos Mendoza' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ description: 'Correo electrónico', example: 'carlos@migracion-segura.mx' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '+525512345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Contraseña temporal', example: 'Temp1234!' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
