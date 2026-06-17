import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { RescheduleCitaDto } from './dto/reschedule-cita.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Citas')
@ApiBearerAuth()
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  /**
   * Req 12.2 - Create appointment
   */
  @Post()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Crear cita' })
  create(@Body() dto: CreateCitaDto) {
    return this.citasService.create(dto);
  }

  /**
   * List appointments with date filters
   */
  @Get()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Listar citas con filtros' })
  @ApiQuery({ name: 'fechaInicio', required: false, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaFin', required: false, description: 'Fecha fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'asesorId', required: false, description: 'UUID del asesor' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('asesorId') asesorId?: string,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    return this.citasService.findAll(page, limit, fechaInicio, fechaFin, asesorId);
  }

  /**
   * Req 8.5 - Today's appointments
   */
  @Get('hoy')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener citas de hoy' })
  getTodayAppointments() {
    return this.citasService.getTodayAppointments();
  }

  /**
   * Get appointment by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener cita por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.citasService.findOne(id);
  }

  /**
   * Req 12.4 - Reschedule appointment
   */
  @Patch(':id/reagendar')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Reagendar cita' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleCitaDto,
  ) {
    return this.citasService.reschedule(id, dto);
  }

  /**
   * Req 12.6 - Cancel appointment
   */
  @Patch(':id/cancelar')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Cancelar cita' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.citasService.cancel(id);
  }

  /**
   * Marcar cita como completada/atendida
   */
  @Patch(':id/completar')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Marcar cita como atendida/completada' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  completar(@Param('id', ParseUUIDPipe) id: string) {
    return this.citasService.completar(id);
  }

  /**
   * Confirmar cita
   */
  @Patch(':id/confirmar')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Confirmar cita' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  confirmar(@Param('id', ParseUUIDPipe) id: string) {
    return this.citasService.confirmar(id);
  }

  /**
   * Obtener citas por cliente/extranjero
   */
  @Get('cliente/:clienteId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener citas de un extranjero' })
  @ApiParam({ name: 'clienteId', description: 'UUID del extranjero' })
  getByCliente(@Param('clienteId', ParseUUIDPipe) clienteId: string) {
    return this.citasService.getByCliente(clienteId);
  }
}
