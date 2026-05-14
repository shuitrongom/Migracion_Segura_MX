import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { TramitesService } from './tramites.service';
import { CreateTramiteDto } from './dto/create-tramite.dto';
import {
  UpdateEstatusDto,
  AsignarResponsableDto,
  AgregarObservacionDto,
  CreateTareaInternaDto,
  CreatePlantillaProcesoDto,
} from './dto/update-estatus.dto';
import { ConsultaPiezaDto } from './dto/consulta-pieza.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole, TipoTramite } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Tramites')
@Controller('tramites')
export class TramitesController {
  constructor(private readonly tramitesService: TramitesService) {}

  /**
   * Req 3.1, 3.5, 3.7 - Crear nuevo trámite
   */
  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Crear nuevo trámite migratorio' })
  create(@Body() dto: CreateTramiteDto) {
    return this.tramitesService.create(dto);
  }

  /**
   * Req 3.2 - Obtener formulario por tipo de trámite
   */
  @Get('formulario/:tipo')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener campos del formulario por tipo de trámite' })
  @ApiParam({ name: 'tipo', enum: TipoTramite })
  getFormByType(@Param('tipo') tipo: TipoTramite) {
    return this.tramitesService.getFormByType(tipo);
  }

  /**
   * Req 4.1 - Consultar trámite por número de pieza (sin autenticación)
   */
  @Get('consulta')
  @Public()
  @ApiOperation({ summary: 'Consultar trámite por número de pieza (público)' })
  findByNumeroPieza(@Query() dto: ConsultaPiezaDto) {
    return this.tramitesService.findByNumeroPieza(dto.numeroPieza);
  }

  /**
   * Req 10.6 - Tareas próximas a vencer (48h)
   */
  @Get('tareas/proximas-vencer')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener tareas internas próximas a vencer (48h)' })
  getTareasProximasVencer() {
    return this.tramitesService.getTareasProximasVencer();
  }

  /**
   * Req 10.8 - Listar plantillas de proceso
   */
  @Get('plantillas')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Listar plantillas de proceso activas' })
  getPlantillas() {
    return this.tramitesService.getPlantillas();
  }

  /**
   * Req 10.8 - Crear plantilla de proceso
   */
  @Post('plantillas')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear plantilla de proceso' })
  createPlantilla(@Body() dto: CreatePlantillaProcesoDto) {
    return this.tramitesService.createPlantilla(dto);
  }

  /**
   * Listar trámites con paginación
   */
  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Listar todos los trámites' })
  findAll(@Query() pagination: PaginationDto) {
    return this.tramitesService.findAll(pagination);
  }

  /**
   * Obtener trámite por ID
   */
  @Get(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener trámite por ID' })
  @ApiParam({ name: 'id', description: 'UUID del trámite' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramitesService.findOne(id);
  }

  /**
   * Req 4.2, 4.3 - Timeline del trámite
   */
  @Get(':id/timeline')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener timeline completo del trámite' })
  @ApiParam({ name: 'id', description: 'UUID del trámite' })
  getTimeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramitesService.getTimeline(id);
  }

  /**
   * Req 3.5 - Enviar borrador
   */
  @Post(':id/enviar')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Enviar trámite borrador (genera número de pieza)' })
  @ApiParam({ name: 'id', description: 'UUID del trámite' })
  submitDraft(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramitesService.submitDraft(id);
  }

  /**
   * Req 3.7 - Guardar borrador
   */
  @Put(':id/borrador')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Guardar datos del formulario como borrador' })
  @ApiParam({ name: 'id', description: 'UUID del trámite' })
  saveDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { datosFormulario: Record<string, unknown> },
  ) {
    return this.tramitesService.saveDraft(id, body.datosFormulario);
  }

  /**
   * Req 10.1 - Cambiar estatus
   */
  @Patch(':id/estatus')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Cambiar estatus del trámite' })
  @ApiParam({ name: 'id', description: 'UUID del trámite' })
  updateEstatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEstatusDto) {
    return this.tramitesService.updateEstatus(id, dto);
  }

  /**
   * Req 10.3 - Asignar responsable interno
   */
  @Patch(':id/responsable')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Asignar responsable interno al trámite' })
  @ApiParam({ name: 'id', description: 'UUID del trámite' })
  assignResponsable(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AsignarResponsableDto) {
    return this.tramitesService.assignResponsable(id, dto);
  }

  /**
   * Req 10.4 - Agregar observaciones a etapa
   */
  @Patch('etapas/:etapaId/observaciones')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Agregar observaciones a una etapa' })
  @ApiParam({ name: 'etapaId', description: 'UUID de la etapa' })
  addObservacion(
    @Param('etapaId', ParseUUIDPipe) etapaId: string,
    @Body() dto: AgregarObservacionDto,
  ) {
    return this.tramitesService.addObservacion(etapaId, dto);
  }

  /**
   * Completar etapa
   */
  @Patch('etapas/:etapaId/completar')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Marcar etapa como completada' })
  @ApiParam({ name: 'etapaId', description: 'UUID de la etapa' })
  completeEtapa(@Param('etapaId', ParseUUIDPipe) etapaId: string) {
    return this.tramitesService.completeEtapa(etapaId);
  }

  /**
   * Req 10.5 - Listar tareas internas de un trámite
   */
  @Get(':id/tareas')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Listar tareas internas del trámite' })
  @ApiParam({ name: 'id', description: 'UUID del trámite' })
  getTareasInternas(@Param('id', ParseUUIDPipe) id: string) {
    return this.tramitesService.getTareasInternas(id);
  }

  /**
   * Req 10.5 - Crear tarea interna
   */
  @Post(':id/tareas')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Crear tarea interna para el trámite' })
  @ApiParam({ name: 'id', description: 'UUID del trámite' })
  createTareaInterna(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTareaInternaDto,
  ) {
    return this.tramitesService.createTareaInterna(id, dto);
  }

  /**
   * Req 10.5 - Completar tarea interna
   */
  @Patch('tareas/:tareaId/completar')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Marcar tarea interna como completada' })
  @ApiParam({ name: 'tareaId', description: 'UUID de la tarea' })
  completeTareaInterna(@Param('tareaId', ParseUUIDPipe) tareaId: string) {
    return this.tramitesService.completeTareaInterna(tareaId);
  }
}
