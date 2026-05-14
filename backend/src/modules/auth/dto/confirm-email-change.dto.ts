import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmEmailChangeDto {
  @ApiProperty({ example: '123456', description: 'Código de verificación enviado al nuevo email' })
  @IsString()
  @Length(6, 6, { message: 'El código debe ser de 6 dígitos' })
  code: string;
}
