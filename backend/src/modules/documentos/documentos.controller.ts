import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { DocumentosService } from './documentos.service';
import { UploadDocumentoDto } from './dto/upload-documento.dto';
import { AprobarDocumentoDto, RechazarDocumentoDto } from './dto/review-documento.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  /**
   * Req 5.1, 5.2, 5.3 - Subir documento con cifrado
   */
  @Post('upload')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir documento (cifrado automático)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo y metadatos del documento',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        expedienteId: { type: 'string', format: 'uuid' },
        tramiteId: { type: 'string', format: 'uuid' },
        nombre: { type: 'string' },
        categoria: { type: 'string' },
        fechaVencimiento: { type: 'string', format: 'date' },
      },
      required: ['file', 'nombre'],
    },
  })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentoDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.documentosService.upload(file, dto, req.user.id);
  }

  /**
   * Listar todos los documentos (solo admin), filtrable por clienteId, tramiteId, categoria, estatus
   */
  @Get()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Listar documentos del sistema (filtrable por clienteId, tramiteId)' })
  @ApiQuery({ name: 'clienteId', required: false })
  @ApiQuery({ name: 'tramiteId', required: false })
  @ApiQuery({ name: 'categoria', required: false })
  @ApiQuery({ name: 'estatus', required: false })
  findAll(
    @Query('clienteId') clienteId?: string,
    @Query('tramiteId') tramiteId?: string,
    @Query('categoria') categoria?: string,
    @Query('estatus') estatus?: string,
  ) {
    return this.documentosService.findAll({ clienteId, tramiteId, categoria, estatus });
  }

  /**
   * Req 5.6 - Documentos por vencer (próximos 30 días)
   * NOTE: Static routes must be defined before parameterized :id routes
   */
  @Get('por-vencer')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener documentos que vencen en los próximos 30 días' })
  getPorVencer() {
    return this.documentosService.findPorVencer();
  }

  /**
   * Documentos pendientes/rechazados para un cliente (dashboard)
   */
  @Get('pendientes/:clienteId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener documentos pendientes o rechazados de un cliente' })
  @ApiParam({ name: 'clienteId', description: 'UUID del cliente' })
  findPendientes(@Param('clienteId', ParseUUIDPipe) clienteId: string) {
    return this.documentosService.findPendientesByCliente(clienteId);
  }

  /**
   * Req 5.7 - Listar documentos por expediente agrupados por trámite
   */
  @Get('expediente/:expedienteId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Listar documentos por expediente' })
  @ApiParam({ name: 'expedienteId', description: 'UUID del expediente' })
  findByExpediente(@Param('expedienteId', ParseUUIDPipe) expedienteId: string) {
    return this.documentosService.findByExpediente(expedienteId);
  }

  /**
   * Req 11.4 - Descargar todos los documentos de un expediente (URLs firmadas)
   */
  @Get('expediente/:expedienteId/zip')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener URLs de descarga para todos los documentos del expediente' })
  @ApiParam({ name: 'expedienteId', description: 'UUID del expediente' })
  downloadAllAsZip(@Param('expedienteId', ParseUUIDPipe) expedienteId: string) {
    return this.documentosService.downloadAllAsZip(expedienteId);
  }

  /**
   * Listar documentos por trámite
   */
  @Get('tramite/:tramiteId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Listar documentos por trámite' })
  @ApiParam({ name: 'tramiteId', description: 'UUID del trámite' })
  findByTramite(@Param('tramiteId', ParseUUIDPipe) tramiteId: string) {
    return this.documentosService.findByTramite(tramiteId);
  }

  /**
   * Obtener metadatos de un documento
   */
  @Get(':id')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener metadatos de un documento' })
  @ApiParam({ name: 'id', description: 'UUID del documento' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentosService.findOne(id);
  }

  /**
   * Req 5.5 - Descargar documento descifrado
   * Verifica que el cliente solo descargue sus propios documentos.
   */
  @Get(':id/download')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR, UserRole.CLIENTE)
  @ApiOperation({ summary: 'Descargar documento (descifrado)' })
  @ApiParam({ name: 'id', description: 'UUID del documento' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string; role: string } },
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    let buffer: Buffer;
    let documento: any;

    try {
      const result = await this.documentosService.download(id);
      buffer = result.buffer;
      documento = result.documento;
    } catch (err: any) {
      console.error(`[Documentos] ❌ Error descargando ${id}: ${err.message}`);
      res.status(500).json({ message: 'No se pudo descargar el documento. El archivo puede estar corrupto o no disponible.' });
      return undefined as any;
    }

    // Ownership check: si es CLIENTE, verificar que el documento le pertenece
    if (req.user.role === 'cliente') {
      await this.documentosService.verifyOwnership(id, req.user.id);
    }

    res.set({
      'Content-Type': documento.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(documento.nombre)}"`,
      'Content-Length': buffer.length.toString(),
    });

    return new StreamableFile(buffer);
  }

  /**
   * Req 11.3 - Historial de cambios del documento
   */
  @Get(':id/historial')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener historial de cambios del documento' })
  @ApiParam({ name: 'id', description: 'UUID del documento' })
  getHistorial(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentosService.getHistorial(id);
  }

  /**
   * Req 11.2 - Aprobar documento
   */
  @Patch(':id/aprobar')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Aprobar documento' })
  @ApiParam({ name: 'id', description: 'UUID del documento' })
  aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AprobarDocumentoDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.documentosService.aprobar(id, req.user.id, dto.comentario);
  }

  /**
   * Req 11.2 - Rechazar documento
   */
  @Patch(':id/rechazar')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Rechazar documento' })
  @ApiParam({ name: 'id', description: 'UUID del documento' })
  rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechazarDocumentoDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.documentosService.rechazar(id, req.user.id, dto.razon);
  }
}
