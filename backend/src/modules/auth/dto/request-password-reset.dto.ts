import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'cliente@ejemplo.com', description: 'Correo electrónico registrado' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;
}
