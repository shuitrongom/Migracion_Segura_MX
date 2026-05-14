import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestEmailChangeDto {
  @ApiProperty({ example: 'nuevo@email.com', description: 'Nuevo correo electrónico' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  newEmail: string;
}
