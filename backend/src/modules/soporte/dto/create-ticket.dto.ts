import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ description: 'Asunto del ticket', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  asunto: string;

  @ApiProperty({ description: 'Descripción detallada del problema' })
  @IsNotEmpty()
  @IsString()
  descripcion: string;
}
