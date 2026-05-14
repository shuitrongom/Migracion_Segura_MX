import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'Nombre completo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({ description: 'URL de la foto de perfil' })
  @IsOptional()
  @IsString()
  @IsUrl()
  profilePhotoUrl?: string;
}
