import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'cliente@ejemplo.com', description: 'Correo electrónico' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'MiPassword123!', description: 'Contraseña' })
  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}
