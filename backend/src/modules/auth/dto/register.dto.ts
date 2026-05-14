import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'cliente@ejemplo.com', description: 'Correo electrónico del cliente' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: '+5215512345678', description: 'Número de teléfono con código de país' })
  @IsString()
  @Matches(/^\+\d{10,15}$/, {
    message: 'El teléfono debe incluir código de país (ej: +5215512345678)',
  })
  phone: string;

  @ApiProperty({ example: 'MiPassword123!', description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(64, { message: 'La contraseña no puede exceder 64 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password: string;
}
