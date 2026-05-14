import { IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @ApiProperty({ description: 'ID del usuario a verificar' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: '123456', description: 'Código de verificación de 6 dígitos' })
  @IsString()
  @Length(6, 6, { message: 'El código debe ser de 6 dígitos' })
  code: string;
}
