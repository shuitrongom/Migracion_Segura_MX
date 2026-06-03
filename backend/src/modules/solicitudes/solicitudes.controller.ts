import { Controller, Get, Post, Patch, Body, Param, Query, Request, ParseUUIDPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiParam } from '@nestjs/swagger';
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
    @Request() req: any,
  ) {
    // Subir usando el servicio de documentos para que se guarde en la tabla documentos
    const { DocumentosService } = await import('../documentos/documentos.service');
    const documentosService = this.solicitudesService['solicitudRepository'].manager.connection
      .getRepository('Documento');

    // Guardar la referencia en la solicitud
    const url = `/solicitudes/${id}/documento.pdf`;
    await this.solicitudesService.subirDocumento(id, url);

    // También subir al storage de documentos si el file existe
    if (file) {
      try {
        // Crear expediente para la solicitud si no existe
        const solicitud = await this.solicitudesService.findOneOrFail(id);
        let expedienteId: string | null = null;

        // Buscar expediente existente
        const expResult = await this.solicitudesService['solicitudRepository'].manager.query(
          `SELECT id FROM expedientes WHERE tramite_id = $1 LIMIT 1`, [id]
        );
        if (expResult?.[0]?.id) {
          expedienteId = expResult[0].id;
        } else if (solicitud.clienteId) {
          // Crear expediente para esta solicitud
          const newExp = await this.solicitudesService['solicitudRepository'].manager.query(
            `INSERT INTO expedientes (id, cliente_id, tramite_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id`,
            [solicitud.clienteId, id]
          );
          expedienteId = newExp?.[0]?.id;
        }

        if (expedienteId) {
          // Guardar documento en tabla documentos
          await this.solicitudesService['solicitudRepository'].manager.query(
            `INSERT INTO documentos (id, expediente_id, tramite_id, nombre, categoria, mime_type, file_size, storage_key, estatus, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'recibido', NOW(), NOW())`,
            [expedienteId, id, 'Solicitud generada por el INM', 'solicitud', file.mimetype || 'application/pdf', file.size || 0, `solicitudes/${id}/${file.originalname || 'solicitud.pdf'}`]
          );
        }
      } catch (e) {
        // No bloquear si falla — la solicitud ya se guardó
      }
    }

    return { message: 'Documento subido', url };
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
