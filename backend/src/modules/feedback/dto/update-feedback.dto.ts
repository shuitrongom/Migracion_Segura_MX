import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { FeedbackEstatus, FeedbackPrioridad } from '../entities/feedback.entity';

export class UpdateFeedbackDto {
  @ApiPropertyOptional({ enum: FeedbackEstatus })
  @IsOptional()
  @IsEnum(FeedbackEstatus)
  estatus?: FeedbackEstatus;

  @ApiPropertyOptional({ enum: FeedbackPrioridad })
  @IsOptional()
  @IsEnum(FeedbackPrioridad)
  prioridad?: FeedbackPrioridad;

  @ApiPropertyOptional({ description: 'Notas internas del administrador' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notasAdmin?: string;
}
