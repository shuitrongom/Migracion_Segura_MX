import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Documento } from './entities/documento.entity';
import { Expediente } from './entities/expediente.entity';
import { UploadDocumentoDto } from './dto/upload-documento.dto';
import { StorageService } from '../../common/services/storage.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { EstatusDocumento, TipoNotificacion, CanalNotificacion } from '../../common/enums';
import { ActivityLogService } from '../users/activity-log.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
    @InjectRepository(Expediente)
    private readonly expedienteRepository: Repository<Expediente>,
    private readonly storageService: StorageService,
    private readonly encryptionService: EncryptionService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  /**
   * Listar todos los documentos del sistema (admin), opcionalmente filtrado por clienteId o tramiteId
   */
  async findAll(filters?: { clienteId?: string; tramiteId?: string; categoria?: string; estatus?: string }): Promise<{ data: Documento[]; meta: { total: number } }> {
    if (filters?.clienteId) {
      // Buscar expedientes del cliente y luego sus documentos
      const expedientes = await this.expedienteRepository.find({ where: { clienteId: filters.clienteId } });
      if (expedientes.length === 0) return { data: [], meta: { total: 0 } };
      const expedienteIds = expedientes.map(e => e.id);
      const qb = this.documentoRepository.createQueryBuilder('doc')
        .where('doc.expediente_id IN (:...expedienteIds)', { expedienteIds })
        .orderBy('doc.created_at', 'DESC');
      if (filters.categoria) qb.andWhere('doc.categoria = :categoria', { categoria: filters.categoria });
      if (filters.estatus) qb.andWhere('doc.estatus = :estatus', { estatus: filters.estatus });
      const [data, total] = await qb.getManyAndCount();
      return { data, meta: { total } };
    }

    if (filters?.tramiteId) {
      const where: any = { tramiteId: filters.tramiteId };
      if (filters.categoria) where.categoria = filters.categoria;
      if (filters.estatus) where.estatus = filters.estatus;
      const [data, total] = await this.documentoRepository.findAndCount({ where, order: { createdAt: 'DESC' } });
      return { data, meta: { total } };
    }

    const where: any = {};
    if (filters?.estatus) where.estatus = filters.estatus;
    const [data, total] = await this.documentoRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return { data, meta: { total } };
  }

  /**
   * Req 5.1, 5.2, 5.3 - Subir documento con cifrado
   * Valida formato/tamaño, cifra el contenido y almacena.
   */
  async upload(
    file: Express.Multer.File,
    dto: UploadDocumentoDto,
    usuarioId: string,
  ): Promise<Documento> {
    // Si no viene expedienteId pero sí tramiteId, buscar el expediente del trámite
    let expedienteId = dto.expedienteId;
    if (!expedienteId && dto.tramiteId) {
      const expediente = await this.expedienteRepository.findOne({
        where: { tramiteId: dto.tramiteId },
      });
      if (expediente) {
        expedienteId = expediente.id;
      }
    }

    if (!expedienteId) {
      throw new NotFoundException('No se encontró un expediente para este documento. Proporcione expedienteId o tramiteId.');
    }

    // Verificar que el expediente existe
    const expediente = await this.expedienteRepository.findOne({
      where: { id: expedienteId },
    });
    if (!expediente) {
      throw new NotFoundException(`Expediente con ID ${expedienteId} no encontrado`);
    }

    // Cifrar el buffer antes de almacenar
    const encryptedBuffer = this.encryptionService.encrypt(file.buffer);

    // Subir al storage
    const uploadResult = await this.storageService.upload(
      encryptedBuffer,
      file.mimetype,
      {
        folder: `expedientes/${expedienteId}`,
        fileName: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      },
    );

    // Auto-clasificar si no se proporcionó categoría
    const categoria = dto.categoria || this.autoClassify(file.mimetype, dto.tramiteId);

    // Crear registro del documento
    const documento = this.documentoRepository.create({
      expedienteId: expedienteId,
      tramiteId: dto.tramiteId || null,
      nombre: dto.nombre,
      categoria,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageKey: uploadResult.key,
      estatus: EstatusDocumento.RECIBIDO,
      fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
      historial: [
        {
          accion: 'SUBIDO',
          usuarioId,
          fecha: new Date().toISOString(),
          detalle: `Documento "${dto.nombre}" subido exitosamente`,
        },
      ],
    });

    const saved = await this.documentoRepository.save(documento);
    this.logger.log(`Documento subido: ${saved.id} para expediente ${expedienteId}`);

    // Registrar actividad
    await this.activityLogService.log({
      userId: usuarioId,
      action: 'DOCUMENTO_SUBIDO',
      resource: 'documento',
      resourceId: saved.id,
      details: { nombre: saved.nombre, categoria: saved.categoria, tramiteId: dto.tramiteId, clienteId: expediente.clienteId },
    });

    // Notificar al admin que se subió un documento nuevo
    try {
      const admins = await this.documentoRepository.manager.query(
        `SELECT id FROM users WHERE role = 'administrador' AND "deletedAt" IS NULL LIMIT 1`
      );
      if (admins?.[0]?.id && admins[0].id !== usuarioId) {
        await this.notificacionesService.sendNotification({
          destinatarioId: admins[0].id,
          tipo: TipoNotificacion.DOCUMENTO_FALTANTE,
          canal: CanalNotificacion.PUSH,
          titulo: '📎 Nuevo documento subido',
          contenido: `Se subió el documento "${dto.nombre}" para revisión.`,
          metadata: { documentoId: saved.id, tramiteId: dto.tramiteId },
        }).catch(() => {});
      }
    } catch {}

    return saved;
  }

  /**
   * Obtener metadatos de un documento por ID.
   */
  async findOne(id: string): Promise<Documento> {
    const documento = await this.documentoRepository.findOne({ where: { id } });
    if (!documento) {
      throw new NotFoundException(`Documento con ID ${id} no encontrado`);
    }
    return documento;
  }

  /**
   * Req 5.5 - Descargar documento individual (descifrado).
   */
  async download(id: string): Promise<{ buffer: Buffer; documento: Documento }> {
    const documento = await this.findOne(id);

    // Descargar del storage
    const encryptedBuffer = await this.storageService.download(documento.storageKey);

    // Descifrar
    const decryptedBuffer = this.encryptionService.decrypt(encryptedBuffer);

    return { buffer: decryptedBuffer, documento };
  }

  /**
   * Req 11.4 - Descargar todos los documentos de un expediente como ZIP.
   * Retorna un JSON con URLs firmadas para cada documento (ZIP real requiere 'archiver' package).
   */
  async downloadAllAsZip(expedienteId: string): Promise<{
    expedienteId: string;
    documentos: Array<{ id: string; nombre: string; url: string }>;
  }> {
    const expediente = await this.expedienteRepository.findOne({
      where: { id: expedienteId },
    });
    if (!expediente) {
      throw new NotFoundException(`Expediente con ID ${expedienteId} no encontrado`);
    }

    const documentos = await this.documentoRepository.find({
      where: { expedienteId },
    });

    if (documentos.length === 0) {
      throw new NotFoundException('No hay documentos en este expediente');
    }

    // Generar URLs firmadas para cada documento
    const documentosConUrl = await Promise.all(
      documentos.map(async (doc) => ({
        id: doc.id,
        nombre: doc.nombre,
        url: await this.storageService.getSignedUrl(doc.storageKey, 3600),
      })),
    );

    // TODO: Para ZIP real, instalar 'archiver' y generar archivo ZIP en memoria
    // Por ahora retornamos URLs firmadas para descarga individual
    return {
      expedienteId,
      documentos: documentosConUrl,
    };
  }

  /**
   * Req 11.2 - Aprobar documento.
   */
  async aprobar(
    id: string,
    usuarioId: string,
    comentario?: string,
  ): Promise<Documento> {
    const documento = await this.findOne(id);

    if (documento.estatus === EstatusDocumento.APROBADO) {
      throw new BadRequestException('El documento ya está aprobado');
    }

    documento.estatus = EstatusDocumento.APROBADO;
    documento.revisadoPor = usuarioId;
    documento.fechaRevision = new Date();
    documento.razonRechazo = null;
    documento.historial = [
      ...documento.historial,
      {
        accion: 'APROBADO',
        usuarioId,
        fecha: new Date().toISOString(),
        detalle: comentario || 'Documento aprobado',
      },
    ];

    const saved = await this.documentoRepository.save(documento);
    this.logger.log(`Documento aprobado: ${id} por usuario ${usuarioId}`);
    return saved;
  }

  /**
   * Req 11.2 - Rechazar documento.
   */
  async rechazar(
    id: string,
    usuarioId: string,
    razon: string,
  ): Promise<Documento> {
    const documento = await this.findOne(id);

    if (documento.estatus === EstatusDocumento.RECHAZADO) {
      throw new BadRequestException('El documento ya está rechazado');
    }

    documento.estatus = EstatusDocumento.RECHAZADO;
    documento.revisadoPor = usuarioId;
    documento.fechaRevision = new Date();
    documento.razonRechazo = razon;
    documento.historial = [
      ...documento.historial,
      {
        accion: 'RECHAZADO',
        usuarioId,
        fecha: new Date().toISOString(),
        detalle: `Rechazado: ${razon}`,
      },
    ];

    const saved = await this.documentoRepository.save(documento);
    this.logger.log(`Documento rechazado: ${id} por usuario ${usuarioId}`);

    // Notificar al extranjero que su documento fue rechazado
    try {
      const expediente = await this.expedienteRepository.findOne({ where: { id: documento.expedienteId } });
      if (expediente?.clienteId) {
        const cliente = await this.documentoRepository.manager.query(
          `SELECT user_id FROM clientes WHERE id = $1`, [expediente.clienteId]
        );
        if (cliente?.[0]?.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cliente[0].userId,
            tipo: TipoNotificacion.DOCUMENTO_RECHAZADO,
            canal: CanalNotificacion.PUSH,
            titulo: '❌ Documento rechazado',
            contenido: `Tu documento "${documento.nombre}" fue rechazado. Motivo: ${razon}. Por favor súbelo de nuevo.`,
            metadata: { documentoId: id, razon },
          }).catch(() => {});
        }
      }
    } catch {}

    return saved;
  }

  /**
   * Req 11.3 - Obtener historial de cambios de un documento.
   */
  async getHistorial(id: string): Promise<Documento['historial']> {
    const documento = await this.findOne(id);
    return documento.historial;
  }

  /**
   * Req 11.6 - Auto-clasificar documento basado en mime type y tipo de trámite.
   */
  autoClassify(mimeType: string, tramiteId?: string): string {
    // Clasificación básica por tipo MIME
    if (mimeType === 'application/pdf') {
      return 'documento_oficial';
    }
    if (mimeType.startsWith('image/')) {
      return 'fotografia';
    }
    return 'otro';
  }

  /**
   * Req 5.7 - Obtener documentos por expediente agrupados por trámite.
   */
  async findByExpediente(expedienteId: string): Promise<{
    expedienteId: string;
    documentos: Documento[];
    porTramite: Record<string, Documento[]>;
  }> {
    const expediente = await this.expedienteRepository.findOne({
      where: { id: expedienteId },
    });
    if (!expediente) {
      throw new NotFoundException(`Expediente con ID ${expedienteId} no encontrado`);
    }

    const documentos = await this.documentoRepository.find({
      where: { expedienteId },
      order: { createdAt: 'DESC' },
    });

    // Agrupar por trámite
    const porTramite: Record<string, Documento[]> = {};
    for (const doc of documentos) {
      const key = doc.tramiteId || 'sin_tramite';
      if (!porTramite[key]) {
        porTramite[key] = [];
      }
      porTramite[key].push(doc);
    }

    return { expedienteId, documentos, porTramite };
  }

  /**
   * Obtener documentos por trámite.
   */
  async findByTramite(tramiteId: string): Promise<Documento[]> {
    return this.documentoRepository.find({
      where: { tramiteId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener documentos pendientes o rechazados para un cliente (dashboard).
   */
  async findPendientesByCliente(clienteId: string): Promise<Documento[]> {
    // Buscar expedientes del cliente
    const expedientes = await this.expedienteRepository.find({
      where: { clienteId },
    });

    if (expedientes.length === 0) {
      return [];
    }

    const expedienteIds = expedientes.map((e) => e.id);

    return this.documentoRepository.find({
      where: {
        expedienteId: In(expedienteIds),
        estatus: In([EstatusDocumento.PENDIENTE, EstatusDocumento.RECHAZADO]),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Req 5.6 - Obtener documentos por vencer (dentro de 30 días).
   */
  async findPorVencer(): Promise<Documento[]> {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    return this.documentoRepository
      .createQueryBuilder('documento')
      .where('documento.fecha_vencimiento IS NOT NULL')
      .andWhere('documento.fecha_vencimiento >= :hoy', { hoy: hoy.toISOString().split('T')[0] })
      .andWhere('documento.fecha_vencimiento <= :en30Dias', {
        en30Dias: en30Dias.toISOString().split('T')[0],
      })
      .andWhere('documento.estatus != :rechazado', {
        rechazado: EstatusDocumento.RECHAZADO,
      })
      .orderBy('documento.fecha_vencimiento', 'ASC')
      .getMany();
  }
}
