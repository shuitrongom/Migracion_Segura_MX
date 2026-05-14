import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de recuperación recibido por email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NuevaPassword123!', description: 'Nueva contraseña' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(64, { message: 'La contraseña no puede exceder 64 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword: string;
}
