import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { FeedbackEstatus, FeedbackPrioridad, FeedbackTipo } from './entities/feedback.entity';

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * POST /feedback — Enviar reporte desde la app (cualquier usuario autenticado)
   */
  @Post()
  @ApiOperation({ summary: 'Enviar reporte de feedback desde la app móvil' })
  create(
    @Body() dto: CreateFeedbackDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.feedbackService.create(dto, req.user.id);
  }

  /**
   * GET /feedback — Listar todos los reportes (solo admin)
   */
  @Get()
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: '[Admin] Listar reportes de feedback con filtros y paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tipo', required: false, enum: FeedbackTipo })
  @ApiQuery({ name: 'estatus', required: false, enum: FeedbackEstatus })
  @ApiQuery({ name: 'prioridad', required: false, enum: FeedbackPrioridad })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('tipo') tipo?: FeedbackTipo,
    @Query('estatus') estatus?: FeedbackEstatus,
    @Query('prioridad') prioridad?: FeedbackPrioridad,
  ) {
    return this.feedbackService.findAll(page, limit, tipo, estatus, prioridad);
  }

  /**
   * GET /feedback/stats — Estadísticas para el dashboard (solo admin)
   */
  @Get('stats')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: '[Admin] Estadísticas de feedback' })
  getStats() {
    return this.feedbackService.getStats();
  }

  /**
   * GET /feedback/:id — Detalle de un reporte (solo admin)
   */
  @Get(':id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: '[Admin] Detalle de un reporte de feedback' })
  @ApiParam({ name: 'id', description: 'UUID del reporte' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedbackService.findOne(id);
  }

  /**
   * PATCH /feedback/:id — Actualizar estatus / notas (solo admin)
   */
  @Patch(':id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: '[Admin] Actualizar estatus y notas de un reporte' })
  @ApiParam({ name: 'id', description: 'UUID del reporte' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeedbackDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.feedbackService.update(id, dto, req.user.id);
  }
}
