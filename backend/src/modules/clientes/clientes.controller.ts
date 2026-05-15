import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { SearchClientesDto } from './dto/search-clientes.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  /**
   * Req 9.1 - Crear cliente
   */
  @Post()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  create(@Body() dto: CreateClienteDto, @Request() req: { user: { id: string } }) {
    return this.clientesService.create(dto, req.user.id);
  }

  /**
   * Req 9.4, 9.5 - Buscar y filtrar clientes
   */
  @Get()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Buscar clientes con filtros' })
  search(@Query() dto: SearchClientesDto) {
    return this.clientesService.search(dto);
  }

  /**
   * Obtener cliente por ID
   */
  @Get(':id')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientesService.findOne(id);
  }

  /**
   * Req 9.2 - Editar cliente
   */
  @Put(':id')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Actualizar datos del cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  /**
   * Req 9.3 - Asignar/reasignar asesor
   */
  @Patch(':id/asesor')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Asignar o reasignar asesor al cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  assignAsesor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('asesorId', ParseUUIDPipe) asesorId: string,
  ) {
    return this.clientesService.assignAsesor(id, asesorId);
  }

  /**
   * Req 9.6 - Historial de actividad
   */
  @Get(':id/actividad')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener historial de actividad del cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  getActivityHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientesService.getActivityHistory(id);
  }

  /**
   * Req 9.7 - Notas internas: listar
   */
  @Get(':id/notas')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Listar notas internas del cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  getNotas(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientesService.getNotas(id);
  }

  /**
   * Req 9.7 - Notas internas: crear
   */
  @Post(':id/notas')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Crear nota interna para el cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  createNota(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('contenido') contenido: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.clientesService.createNota(id, req.user.id, contenido);
  }

  /**
   * Req 9.7 - Notas internas: actualizar
   */
  @Put('notas/:notaId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Actualizar nota interna' })
  @ApiParam({ name: 'notaId', description: 'UUID de la nota' })
  updateNota(
    @Param('notaId', ParseUUIDPipe) notaId: string,
    @Body('contenido') contenido: string,
  ) {
    return this.clientesService.updateNota(notaId, contenido);
  }

  /**
   * Req 9.7 - Notas internas: eliminar
   */
  @Delete('notas/:notaId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Eliminar nota interna' })
  @ApiParam({ name: 'notaId', description: 'UUID de la nota' })
  deleteNota(@Param('notaId', ParseUUIDPipe) notaId: string) {
    return this.clientesService.deleteNota(notaId);
  }

  /**
   * Req 9.8 - Etiquetas: agregar
   */
  @Post(':id/etiquetas')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Agregar etiqueta al cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  addTag(@Param('id', ParseUUIDPipe) id: string, @Body('etiqueta') etiqueta: string) {
    return this.clientesService.addTag(id, etiqueta);
  }

  /**
   * Req 9.8 - Etiquetas: eliminar
   */
  @Delete(':id/etiquetas/:etiqueta')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Eliminar etiqueta del cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiParam({ name: 'etiqueta', description: 'Nombre de la etiqueta' })
  removeTag(@Param('id', ParseUUIDPipe) id: string, @Param('etiqueta') etiqueta: string) {
    return this.clientesService.removeTag(id, etiqueta);
  }
}
