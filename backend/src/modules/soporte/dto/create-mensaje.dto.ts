import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMensajeDto {
  @ApiProperty({ description: 'Contenido del mensaje' })
  @IsNotEmpty()
  @IsString()
  contenido: string;
}
