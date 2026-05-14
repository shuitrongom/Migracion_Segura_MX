import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConsultaPiezaDto {
  @ApiProperty({ description: 'Número de pieza del trámite', example: 'MSX-2025-000001' })
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  numeroPieza: string;
}
