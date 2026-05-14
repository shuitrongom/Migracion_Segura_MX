import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleCitaDto {
  @ApiProperty({ description: 'Nueva fecha (YYYY-MM-DD)', example: '2024-06-20' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  fecha: string;

  @ApiProperty({ description: 'Nueva hora (HH:mm)', example: '14:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'La hora debe tener formato HH:mm' })
  hora: string;
}
