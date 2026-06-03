import { Controller, Get, Post, Patch, Body, Param, Query, Request, ParseUUIDPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Solicitudes')
@ApiBearerAuth()
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  /**
   * Extranjero crea una nueva solicitud
   */
  @Post()
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Crear solicitud de generación (extranjero)' })
  create(@Body() dto: CreateSolicitudDto, @Request() req: any) {
    return this.solicitudesService.create(dto, req.user.id);
  }

  /**
   * Extranjero obtiene sus solicitudes
   */
  @Get('mis-solicitudes')
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener mis solicitudes (extranjero)' })
  getMisSolicitudes(@Request() req: any) {
    return this.solicitudesService.getMisSolicitudes(req.user.id);
  }

  /**
   * Admin obtiene todas las solicitudes
   */
  @Get()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Listar todas las solicitudes (admin)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.solicitudesService.findAll(pagination.page, pagination.limit);
  }

  /**
   * Obtener solicitud por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener solicitud por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudesService.findOneOrFail(id);
  }

  /**
   * Admin procesa la solicitud (pieza, requisitos, genera pago)
   */
  @Patch(':id/procesar')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Procesar solicitud - generar pieza, requisitos y pago (admin)' })
  procesar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { numeroPieza: string; contrasenaINM?: string; requisitos?: string[]; observaciones?: string },
    @Request() req: any,
  ) {
    return this.solicitudesService.procesarSolicitud(id, dto, req.user.id);
  }

  /**
   * Admin sube el PDF de la solicitud
   */
  @Post(':id/documento')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Subir PDF de la solicitud generada (admin)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async subirDocumento(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Guardar archivo (usar el mismo storage que documentos)
    // Por ahora guardamos la referencia
    const url = `/solicitudes/${id}/documento.pdf`;
    return this.solicitudesService.subirDocumento(id, url);
  }

  /**
   * Reenviar link de pago al extranjero
   */
  @Patch(':id/reenviar-pago')
  @ApiBearerAuth()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Reenviar notificación push con link de pago al extranjero' })
  @ApiParam({ name: 'id', description: 'UUID de la solicitud' })
  reenviarPago(@Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudesService.reenviarLinkPago(id);
  }

  /**
   * Confirmar pago manualmente (admin) o via webhook
   */
  @Patch(':id/confirmar-pago')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Confirmar pago de solicitud (admin/webhook)' })
  confirmarPago(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { paymentId?: string },
  ) {
    return this.solicitudesService.confirmarPago(id, dto.paymentId);
  }

  /**
   * Obtener/actualizar costo de solicitud (admin)
   */
  @Get('config/costo')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener costo actual de solicitud' })
  async getCosto() {
    const costo = await this.solicitudesService.getCostoSolicitud();
    return { costo };
  }

  @Patch('config/costo')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar costo de solicitud' })
  actualizarCosto(@Body() dto: { costo: number }) {
    return this.solicitudesService.actualizarCosto(dto.costo);
  }
}
