import { Controller, Get, Post, Patch, Body, Param, Query, Request, ParseUUIDPipe, UseInterceptors, UploadedFile, Res, NotFoundException, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StorageService } from '../../common/services/storage.service';

@ApiTags('Solicitudes')
@ApiBearerAuth()
@Controller('solicitudes')
export class SolicitudesController {
  constructor(
    private readonly solicitudesService: SolicitudesService,
    private readonly storageService: StorageService,
  ) {}

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
    if (!file) {
      return { message: 'No se recibió archivo' };
    }

    // Subir el archivo al storage (MinIO/Supabase/S3)
    const result = await this.storageService.upload(file.buffer, file.mimetype || 'application/pdf', {
      folder: `solicitudes/${id}`,
      fileName: `solicitud-${Date.now()}`,
    });

    // Guardar la storage_key en la solicitud
    await this.solicitudesService.subirDocumento(id, result.key);

    // Registrar en tabla documentos
    try {
      const solicitud = await this.solicitudesService.findOneOrFail(id);
      let expedienteId: string | null = null;

      const expResult = await this.solicitudesService['solicitudRepository'].manager.query(
        `SELECT id FROM expedientes WHERE tramite_id = $1 LIMIT 1`, [id]
      );
      if (expResult?.[0]?.id) {
        expedienteId = expResult[0].id;
      } else if (solicitud.clienteId) {
        const newExp = await this.solicitudesService['solicitudRepository'].manager.query(
          `INSERT INTO expedientes (id, cliente_id, tramite_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id`,
          [solicitud.clienteId, id]
        );
        expedienteId = newExp?.[0]?.id;
      }

      if (expedienteId) {
        await this.solicitudesService['solicitudRepository'].manager.query(
          `INSERT INTO documentos (id, expediente_id, tramite_id, nombre, categoria, mime_type, file_size, storage_key, estatus, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'recibido', NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [expedienteId, id, 'Solicitud generada por el INM', 'solicitud', file.mimetype || 'application/pdf', file.size || 0, result.key]
        );
      }
    } catch {}

    return { message: 'Documento subido correctamente', key: result.key };
  }

  /**
   * Descargar/ver el PDF de la solicitud (extranjero o admin)
   */
  @Get(':id/documento')
  @ApiOperation({ summary: 'Descargar PDF de la solicitud' })
  @ApiParam({ name: 'id', description: 'UUID de la solicitud' })
  async descargarDocumento(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    let solicitud: any;
    try {
      solicitud = await this.solicitudesService.findOneOrFail(id);
    } catch {
      res.status(404).json({ message: 'Solicitud no encontrada' });
      return;
    }

    if (!solicitud.documentoUrl) {
      res.status(404).json({ message: 'Esta solicitud aún no tiene documento PDF' });
      return;
    }

    console.log(`[PDF Proxy] Solicitud ${id} → storage key: ${solicitud.documentoUrl}`);

    try {
      const buffer = await this.storageService.download(solicitud.documentoUrl);
      const fileName = `solicitud-${solicitud.numeroPieza || id}.pdf`;

      console.log(`[PDF Proxy] ✅ Enviando ${buffer.length} bytes`);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      });
      res.end(buffer);
    } catch (error: any) {
      console.error(`[PDF Proxy] ❌ Error storage.download: ${error.message}`);
      res.status(500).json({ message: 'No se pudo descargar el PDF del almacenamiento' });
    }
  }

  /**
   * Obtener URL de descarga del PDF (signed URL temporal)
   */
  @Get(':id/documento-url')
  @ApiOperation({ summary: 'Obtener URL temporal para descargar PDF de la solicitud' })
  @ApiParam({ name: 'id', description: 'UUID de la solicitud' })
  async getDocumentoUrl(@Param('id', ParseUUIDPipe) id: string) {
    const solicitud = await this.solicitudesService.findOneOrFail(id);

    if (!solicitud.documentoUrl) {
      throw new NotFoundException('Esta solicitud aún no tiene documento PDF');
    }

    console.log(`[PDF Download] Solicitud ${id} → documentoUrl: ${solicitud.documentoUrl}`);
    const signedUrl = await this.storageService.getSignedUrl(solicitud.documentoUrl, 3600);
    console.log(`[PDF Download] Signed URL generada: ${signedUrl.slice(0, 80)}...`);
    return { url: signedUrl, expiresIn: 3600 };
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
   * Cliente sube voucher de transferencia para solicitud
   */
  @Post(':id/voucher')
  @Roles(UserRole.CLIENTE, UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Registrar voucher de transferencia para solicitud' })
  @ApiParam({ name: 'id', description: 'UUID de la solicitud' })
  subirVoucherSolicitud(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { montoDeclarado: number; voucherUrl: string; metodoPago: string },
    @Request() req: any,
  ) {
    return this.solicitudesService.registrarVoucherSolicitud(id, {
      montoDeclarado: Number(body.montoDeclarado),
      voucherUrl: String(body.voucherUrl || ''),
      metodoPago: String(body.metodoPago || 'transferencia_bancaria'),
      userId: req.user.id,
    });
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
