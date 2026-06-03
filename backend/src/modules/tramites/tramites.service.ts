import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tramite } from './entities/tramite.entity';
import { EtapaTramite } from './entities/etapa-tramite.entity';
import { TareaInterna } from './entities/tarea-interna.entity';
import { PlantillaProceso } from './entities/plantilla-proceso.entity';
import { CreateTramiteDto } from './dto/create-tramite.dto';
import {
  UpdateEstatusDto,
  AsignarResponsableDto,
  AgregarObservacionDto,
  CreateTareaInternaDto,
  CreatePlantillaProcesoDto,
} from './dto/update-estatus.dto';
import { EstatusTramite, TipoTramite, UserRole } from '../../common/enums';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { ActivityLogService } from '../users/activity-log.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { EmailService } from '../email/email.service';
import { TipoNotificacion, CanalNotificacion } from '../../common/enums';

@Injectable()
export class TramitesService {
  constructor(
    @InjectRepository(Tramite)
    private readonly tramiteRepository: Repository<Tramite>,
    @InjectRepository(EtapaTramite)
    private readonly etapaRepository: Repository<EtapaTramite>,
    @InjectRepository(TareaInterna)
    private readonly tareaInternaRepository: Repository<TareaInterna>,
    @InjectRepository(PlantillaProceso)
    private readonly plantillaRepository: Repository<PlantillaProceso>,
    private readonly usersService: UsersService,
    private readonly activityLogService: ActivityLogService,
    private readonly notificacionesService: NotificacionesService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Req 3.1, 3.5, 3.7 - Crear trámite con selección de tipo.
   * Si no es borrador, genera número de pieza automáticamente.
   * Req 10.9 - Auto-genera expediente al crear trámite.
   */
  async create(dto: CreateTramiteDto): Promise<Tramite> {
    const esBorrador = dto.esBorrador ?? false;

    // Extraer pieza y contraseña del INM si vienen en datosFormulario
    const datosFormulario = dto.datosFormulario || null;
    const numeroPiezaINM = datosFormulario?.numeroPiezaINM as string | undefined;
    const contrasenaINM = datosFormulario?.contrasenaINM as string | undefined;

    // Auto-crear cliente si no existe (cuando viene de la app móvil)
    let clienteId = dto.clienteId;
    if (clienteId && datosFormulario?.nombre) {
      try {
        // Verificar si el clienteId es un ID de cliente válido
        const existingCliente = await this.tramiteRepository.manager.query(
          `SELECT id FROM clientes WHERE id = $1`, [clienteId]
        );
        if (!existingCliente || existingCliente.length === 0) {
          // El clienteId probablemente es un userId, buscar si ya tiene un cliente asociado
          const clienteByUser = await this.tramiteRepository.manager.query(
            `SELECT id FROM clientes WHERE user_id = $1 LIMIT 1`, [clienteId]
          );
          if (clienteByUser && clienteByUser.length > 0) {
            clienteId = clienteByUser[0].id;
          } else {
            // Crear nuevo cliente con el userId
            const nombreCompleto = `${datosFormulario.nombre} ${datosFormulario.apellidos || ''}`.trim();
            const email = (datosFormulario.solicitanteEmail || datosFormulario.email || `app-${Date.now()}@pendiente.com`) as string;
            const telefono = (datosFormulario.telefono || 'pendiente') as string;
            try {
              const result = await this.tramiteRepository.manager.query(
                `INSERT INTO clientes (id, nombre_completo, email, telefono, user_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
                [nombreCompleto, email, telefono, dto.clienteId]
              );
              if (result?.[0]?.id) {
                clienteId = result[0].id;
              }
            } catch (insertErr: any) {
              // Si falla por email duplicado, buscar por email
              try {
                const byEmail = await this.tramiteRepository.manager.query(
                  `SELECT id FROM clientes WHERE email = $1 LIMIT 1`, [email]
                );
                if (byEmail?.[0]?.id) {
                  clienteId = byEmail[0].id;
                }
              } catch {}
            }
          }
        }
      } catch {
        // Si falla la consulta, continuar sin modificar clienteId
      }
    }

    const tramite = this.tramiteRepository.create({
      clienteId,
      tipo: dto.tipo,
      datosFormulario,
      asesorId: dto.asesorId || await this.autoAssignGestor(),
      estatus: esBorrador ? EstatusTramite.BORRADOR : EstatusTramite.RECIBIDO,
      numeroPieza: numeroPiezaINM || (esBorrador ? null : await this.generateNumeroPieza()),
      contrasenaTramite: contrasenaINM || null,
    });

    const saved = await this.tramiteRepository.save(tramite);

    // Aplicar plantilla si existe una activa para este tipo
    await this.applyPlantillaIfExists(saved);

    // Req 10.9 - Auto-generar expediente
    if (!esBorrador) {
      await this.createExpediente(saved.clienteId, saved.id);
    }

    // Registrar actividad
    await this.activityLogService.log({
      action: 'TRAMITE_CREADO',
      resource: 'tramite',
      resourceId: saved.id,
      details: { tipo: saved.tipo, estatus: saved.estatus, clienteId: saved.clienteId, numeroPieza: saved.numeroPieza },
    });

    // Notificar al admin/gestor asignado que hay un nuevo trámite
    if (saved.asesorId && !esBorrador) {
      const nombreExtranjero = datosFormulario?.nombre
        ? `${datosFormulario.nombre} ${datosFormulario.apellidos || ''}`.trim()
        : 'Nuevo extranjero';
      await this.notificacionesService.sendNotification({
        destinatarioId: saved.asesorId,
        tipo: TipoNotificacion.CAMBIO_ESTATUS,
        canal: CanalNotificacion.PUSH,
        titulo: '📄 Nuevo trámite recibido',
        contenido: `${nombreExtranjero} ha enviado una solicitud de ${(saved.tipo || '').replace(/_/g, ' ')}. Número: ${saved.numeroPieza || 'pendiente'}`,
        metadata: { tramiteId: saved.id, tipo: saved.tipo },
      }).catch(() => {}); // No bloquear si falla la notificación
    }

    // Notificar al admin por email
    try {
      const nombreExtranjeroEmail = `${datosFormulario?.nombre || ''} ${datosFormulario?.apellidos || ''}`.trim();
      await this.emailService.sendAdminNotificationEmail({
        subject: `Nuevo trámite: ${dto.tipo?.replace(/_/g, ' ')}`,
        event: '🆕 Nuevo trámite creado desde la app',
        details: `El extranjero ${nombreExtranjeroEmail || 'Sin nombre'} ha iniciado un trámite de ${(dto.tipo || '').replace(/_/g, ' ')}.`,
        extraInfo: `Pieza: ${saved.numeroPieza || 'Pendiente'} · Tipo: ${dto.tipo}`,
      });
    } catch {}

    return this.findOneOrFail(saved.id);
  }

  /**
   * Req 3.2 - Obtener formulario por tipo de trámite
   */
  async getFormByType(tipo: TipoTramite): Promise<{
    tipo: TipoTramite;
    campos: Array<{ nombre: string; tipo: string; requerido: boolean; opciones?: string[] }>;
    documentosRequeridos: Array<{ nombre: string; categoria: string; obligatorio: boolean }>;
  }> {
    // Buscar plantilla activa para obtener documentos requeridos
    const plantilla = await this.plantillaRepository.findOne({
      where: { tipoTramite: tipo, activa: true },
    });

    const campos = this.getFormFieldsByType(tipo);
    const documentosRequeridos = plantilla?.documentosRequeridos || [];

    return { tipo, campos, documentosRequeridos };
  }

  /**
   * Req 3.5 - Enviar solicitud (cambiar de borrador a recibido)
   */
  async submitDraft(tramiteId: string): Promise<Tramite> {
    const tramite = await this.findOneOrFail(tramiteId);

    if (tramite.estatus !== EstatusTramite.BORRADOR) {
      throw new BadRequestException('Solo se pueden enviar trámites en estado borrador');
    }

    tramite.estatus = EstatusTramite.RECIBIDO;
    tramite.numeroPieza = await this.generateNumeroPieza();

    const saved = await this.tramiteRepository.save(tramite);

    // Crear expediente al enviar
    await this.createExpediente(saved.clienteId, saved.id);

    return saved;
  }

  /**
   * Req 3.7 - Guardar borrador
   */
  async saveDraft(tramiteId: string, datosFormulario: Record<string, unknown>): Promise<Tramite> {
    const tramite = await this.findOneOrFail(tramiteId);

    if (tramite.estatus !== EstatusTramite.BORRADOR) {
      throw new BadRequestException('Solo se pueden editar trámites en estado borrador');
    }

    tramite.datosFormulario = datosFormulario;
    return this.tramiteRepository.save(tramite);
  }

  /**
   * Continuar trámite - Permite al gestor actualizar pieza, contraseña y datos
   * sin importar el estatus actual (para trámites creados por el extranjero)
   */
  async continuarTramite(tramiteId: string, dto: { numeroPieza?: string; contrasenaTramite?: string; datosFormulario?: Record<string, unknown> }): Promise<Tramite> {
    const tramite = await this.findOneOrFail(tramiteId);

    // Usar update directo para evitar que TypeORM sobreescriba campos con null
    const updateData: Record<string, unknown> = {};

    if (dto.numeroPieza) {
      updateData.numeroPieza = dto.numeroPieza;
    }
    if (dto.contrasenaTramite) {
      updateData.contrasenaTramite = dto.contrasenaTramite;
    }
    if (dto.datosFormulario) {
      updateData.datosFormulario = { ...tramite.datosFormulario, ...dto.datosFormulario };
    }

    if (Object.keys(updateData).length > 0) {
      await this.tramiteRepository.update(tramiteId, updateData);
    }

    return this.findOneOrFail(tramiteId);
  }

  /**
   * Req 10.1 - Cambiar estatus del trámite
   */
  async updateEstatus(tramiteId: string, dto: UpdateEstatusDto): Promise<Tramite> {
    const tramite = await this.findOneOrFail(tramiteId);

    // Usar update directo para evitar que TypeORM sobreescriba campos con null
    const updateData: Record<string, unknown> = { estatus: dto.estatus };

    if (dto.resolucion) {
      updateData.resolucion = dto.resolucion;
    }

    if (
      dto.estatus === EstatusTramite.APROBADO ||
      dto.estatus === EstatusTramite.RECHAZADO ||
      dto.estatus === EstatusTramite.CANCELADO ||
      dto.estatus === EstatusTramite.COMPLETADO
    ) {
      updateData.fechaCierre = new Date();
    }

    await this.tramiteRepository.update(tramiteId, updateData);

    // Registrar cambio de estatus en actividad
    await this.activityLogService.log({
      action: 'CAMBIO_ESTATUS',
      resource: 'tramite',
      resourceId: tramiteId,
      details: {
        estatusAnterior: tramite.estatus,
        estatusNuevo: dto.estatus,
        observaciones: dto.observaciones || null,
        clienteId: tramite.clienteId,
      },
    });

    // Si hay observaciones, agregarlas a la etapa actual
    if (dto.observaciones) {
      const etapaActual = await this.etapaRepository.findOne({
        where: { tramiteId, completada: false },
        order: { orden: 'ASC' },
      });
      if (etapaActual) {
        etapaActual.observaciones = dto.observaciones;
        await this.etapaRepository.save(etapaActual);
      }
    }

    // Notificar al extranjero del cambio de estatus
    if (tramite.clienteId) {
      const estatusLabel = (dto.estatus || '').replace(/_/g, ' ');
      // Buscar el userId del cliente para enviarle la notificación
      try {
        const cliente = await this.tramiteRepository.manager.query(
          `SELECT user_id FROM clientes WHERE id = $1`, [tramite.clienteId]
        );
        if (cliente?.[0]?.user_id) {
          await this.notificacionesService.sendNotification({
            destinatarioId: cliente[0].userId,
            tipo: TipoNotificacion.CAMBIO_ESTATUS,
            canal: CanalNotificacion.PUSH,
            titulo: '📋 Tu trámite cambió de estatus',
            contenido: `Tu trámite ${tramite.numeroPieza || ''} ahora está: ${estatusLabel}${dto.observaciones ? '. Observaciones: ' + dto.observaciones : ''}`,
            metadata: { tramiteId, estatus: dto.estatus },
          }).catch(() => {});

          // Notificación especial cuando se aprueba
          if (dto.estatus === EstatusTramite.APROBADO) {
            await this.notificacionesService.sendNotification({
              destinatarioId: cliente[0].userId,
              tipo: TipoNotificacion.FELICITACION_APROBADO,
              canal: CanalNotificacion.PUSH,
              titulo: '🎉 ¡Tu trámite fue aprobado!',
              contenido: '🎉 ¡Tu trámite fue aprobado! Agenda una cita para recoger tu documento.',
              metadata: { tramiteId, estatus: dto.estatus },
            }).catch(() => {});
          }

          // Notificación cuando se entrega el documento
          if (dto.estatus === EstatusTramite.ENTREGADO) {
            await this.notificacionesService.sendNotification({
              destinatarioId: cliente[0].userId,
              tipo: TipoNotificacion.CAMBIO_ESTATUS,
              canal: CanalNotificacion.PUSH,
              titulo: '📄 Documento entregado',
              contenido: '📄 Documento entregado. Por favor evalúa nuestro servicio y toma foto de tu documento para respaldo.',
              metadata: { tramiteId, estatus: dto.estatus },
            }).catch(() => {});
          }
        }
      } catch {}
    }

    return this.findOneOrFail(tramiteId);
  }

  /**
   * Req 10.3 - Asignar responsable interno
   */
  async assignResponsable(tramiteId: string, dto: AsignarResponsableDto): Promise<Tramite> {
    const tramite = await this.findOneOrFail(tramiteId);
    tramite.responsableId = dto.responsableId;
    return this.tramiteRepository.save(tramite);
  }

  /**
   * Req 10.4 - Agregar observaciones a etapa
   */
  async addObservacion(etapaId: string, dto: AgregarObservacionDto): Promise<EtapaTramite> {
    const etapa = await this.etapaRepository.findOne({ where: { id: etapaId } });
    if (!etapa) {
      throw new NotFoundException('Etapa no encontrada');
    }
    etapa.observaciones = dto.observaciones;
    return this.etapaRepository.save(etapa);
  }

  /**
   * Completar una etapa y avanzar a la siguiente
   */
  async completeEtapa(etapaId: string): Promise<EtapaTramite> {
    const etapa = await this.etapaRepository.findOne({ where: { id: etapaId } });
    if (!etapa) {
      throw new NotFoundException('Etapa no encontrada');
    }
    etapa.completada = true;
    etapa.fechaCompletada = new Date();
    return this.etapaRepository.save(etapa);
  }

  /**
   * Req 10.5 - Crear tarea interna
   */
  async createTareaInterna(tramiteId: string, dto: CreateTareaInternaDto): Promise<TareaInterna> {
    await this.findOneOrFail(tramiteId);

    const tarea = this.tareaInternaRepository.create({
      tramiteId,
      descripcion: dto.descripcion,
      responsableId: dto.responsableId,
      fechaLimite: new Date(dto.fechaLimite),
    });
    return this.tareaInternaRepository.save(tarea);
  }

  /**
   * Req 10.5 - Listar tareas internas de un trámite
   */
  async getTareasInternas(tramiteId: string): Promise<TareaInterna[]> {
    return this.tareaInternaRepository.find({
      where: { tramiteId },
      relations: ['responsable'],
      order: { fechaLimite: 'ASC' },
    });
  }

  /**
   * Req 10.5 - Completar tarea interna
   */
  async completeTareaInterna(tareaId: string): Promise<TareaInterna> {
    const tarea = await this.tareaInternaRepository.findOne({ where: { id: tareaId } });
    if (!tarea) {
      throw new NotFoundException('Tarea interna no encontrada');
    }
    tarea.completada = true;
    tarea.fechaCompletada = new Date();
    return this.tareaInternaRepository.save(tarea);
  }

  /**
   * Req 10.6 - Obtener tareas con alerta de 48h
   */
  async getTareasProximasVencer(): Promise<TareaInterna[]> {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return this.tareaInternaRepository
      .createQueryBuilder('tarea')
      .leftJoinAndSelect('tarea.responsable', 'responsable')
      .leftJoinAndSelect('tarea.tramite', 'tramite')
      .where('tarea.completada = false')
      .andWhere('tarea.fechaLimite <= :in48h', { in48h })
      .andWhere('tarea.fechaLimite >= :now', { now })
      .orderBy('tarea.fechaLimite', 'ASC')
      .getMany();
  }

  /**
   * Req 10.8 - Crear plantilla de proceso
   */
  async createPlantilla(dto: CreatePlantillaProcesoDto): Promise<PlantillaProceso> {
    const plantilla = this.plantillaRepository.create({
      tipoTramite: dto.tipoTramite as TipoTramite,
      nombre: dto.nombre,
      etapas: dto.etapas || [],
      documentosRequeridos: dto.documentosRequeridos || [],
      activa: true,
    });
    return this.plantillaRepository.save(plantilla);
  }

  /**
   * Req 10.8 - Listar plantillas
   */
  async getPlantillas(): Promise<PlantillaProceso[]> {
    return this.plantillaRepository.find({
      where: { activa: true },
      order: { tipoTramite: 'ASC' },
    });
  }

  /**
   * Req 4.1 - Consultar trámite por número de pieza (sin autenticación)
   */
  async findByNumeroPieza(numeroPieza: string): Promise<{
    numeroPieza: string;
    tipo: TipoTramite;
    estatus: EstatusTramite;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    etapas: Array<{ nombre: string; completada: boolean; fechaCompletada: Date | null }>;
  }> {
    const tramite = await this.tramiteRepository.findOne({
      where: { numeroPieza },
      relations: ['etapas'],
    });

    if (!tramite) {
      throw new NotFoundException('Trámite no encontrado con ese número de pieza');
    }

    return {
      numeroPieza: tramite.numeroPieza!,
      tipo: tramite.tipo,
      estatus: tramite.estatus,
      fechaCreacion: tramite.createdAt,
      fechaActualizacion: tramite.updatedAt,
      etapas: (tramite.etapas || [])
        .sort((a, b) => a.orden - b.orden)
        .map((e) => ({
          nombre: e.nombre,
          completada: e.completada,
          fechaCompletada: e.fechaCompletada,
        })),
    };
  }

  /**
   * Req 4.2, 4.3 - Timeline del trámite
   */
  async getTimeline(tramiteId: string): Promise<{
    tramite: Tramite;
    etapas: EtapaTramite[];
    tareas: TareaInterna[];
  }> {
    const tramite = await this.findOneOrFail(tramiteId);

    const etapas = await this.etapaRepository.find({
      where: { tramiteId },
      order: { orden: 'ASC' },
    });

    const tareas = await this.tareaInternaRepository.find({
      where: { tramiteId },
      relations: ['responsable'],
      order: { fechaLimite: 'ASC' },
    });

    return { tramite, etapas, tareas };
  }

  /**
   * Listar trámites con paginación
   */
  async findAll(pagination: PaginationDto, user?: { id: string; role: string }): Promise<PaginatedResponseDto<Tramite>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const qb = this.tramiteRepository
      .createQueryBuilder('tramite')
      .leftJoinAndSelect('tramite.cliente', 'cliente')
      .leftJoinAndSelect('tramite.asesor', 'asesor')
      .leftJoinAndSelect('tramite.responsable', 'responsable')
      .orderBy('tramite.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Si es gestor (ASESOR), solo ve sus trámites asignados
    if (user && user.role === UserRole.ASESOR) {
      qb.where('tramite.asesorId = :userId', { userId: user.id });
    }

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Obtener un trámite por ID
   */
  async findOne(id: string): Promise<Tramite> {
    return this.findOneOrFail(id);
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private async findOneOrFail(id: string): Promise<Tramite> {
    const tramite = await this.tramiteRepository.findOne({
      where: { id },
      relations: ['cliente', 'asesor', 'responsable', 'etapas'],
    });
    if (!tramite) {
      throw new NotFoundException('Trámite no encontrado');
    }
    return tramite;
  }

  /**
   * Genera un número de pieza único con formato MSX-YYYY-NNNNNN
   */
  private async generateNumeroPieza(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MSX-${year}-`;

    const lastTramite = await this.tramiteRepository
      .createQueryBuilder('tramite')
      .where('tramite.numeroPieza LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('tramite.numeroPieza', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastTramite?.numeroPieza) {
      const lastNumber = parseInt(lastTramite.numeroPieza.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Aplica la plantilla de proceso activa al trámite (crea etapas)
   */
  private async applyPlantillaIfExists(tramite: Tramite): Promise<void> {
    const plantilla = await this.plantillaRepository.findOne({
      where: { tipoTramite: tramite.tipo, activa: true },
    });

    if (plantilla && plantilla.etapas.length > 0) {
      const etapas = plantilla.etapas.map((e) =>
        this.etapaRepository.create({
          tramiteId: tramite.id,
          nombre: e.nombre,
          orden: e.orden,
          completada: false,
        }),
      );
      await this.etapaRepository.save(etapas);
    }
  }

  /**
   * Req 10.9 - Crea un expediente para el trámite
   */
  private async createExpediente(clienteId: string, tramiteId: string): Promise<string> {
    const result = await this.tramiteRepository.query(
      `INSERT INTO expedientes (id, cliente_id, tramite_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [clienteId, tramiteId],
    );
    return result?.[0]?.id || tramiteId;
  }

  /**
   * Auto-asignar gestor al trámite usando round-robin.
   * Si hay gestores, asigna al que tenga menos trámites activos.
   * Si no hay gestores, asigna al primer admin.
   */
  private async autoAssignGestor(): Promise<string | null> {
    // Por ahora, asignar siempre al administrador principal
    // Cuando se necesiten gestores, el admin los reasigna manualmente
    const admins = await this.usersService.findByRole(UserRole.ADMINISTRADOR);
    if (admins.length > 0) {
      return admins[0].id;
    }

    // Fallback: si no hay admin, buscar gestores
    const gestores = await this.usersService.findByRole(UserRole.ASESOR);
    if (gestores.length > 0) {
      const counts = await Promise.all(
        gestores.map(async (g) => {
          const count = await this.tramiteRepository.count({
            where: { asesorId: g.id, estatus: EstatusTramite.RECIBIDO },
          });
          return { id: g.id, count };
        }),
      );
      counts.sort((a, b) => a.count - b.count);
      return counts[0].id;
    }

    return null;
  }

  /**
   * Retorna los campos del formulario según el tipo de trámite
   */
  private getFormFieldsByType(
    tipo: TipoTramite,
  ): Array<{ nombre: string; tipo: string; requerido: boolean; opciones?: string[]; label?: string }> {
    const commonFields = [
      { nombre: 'nombreCompleto', tipo: 'text', requerido: true, label: 'Nombre completo' },
      { nombre: 'nacionalidad', tipo: 'text', requerido: true, label: 'Nacionalidad' },
      { nombre: 'fechaNacimiento', tipo: 'date', requerido: true, label: 'Fecha de nacimiento' },
      { nombre: 'pasaporteNumero', tipo: 'text', requerido: true, label: 'Número de pasaporte' },
      { nombre: 'curp', tipo: 'text', requerido: false, label: 'CURP (si aplica)' },
      { nombre: 'domicilioMexico', tipo: 'text', requerido: true, label: 'Domicilio en México' },
      { nombre: 'telefono', tipo: 'text', requerido: true, label: 'Teléfono de contacto' },
      { nombre: 'correoElectronico', tipo: 'text', requerido: true, label: 'Correo electrónico' },
    ];

    const typeSpecificFields: Record<string, Array<{ nombre: string; tipo: string; requerido: boolean; opciones?: string[]; label?: string }>> = {
      [TipoTramite.RESIDENCIA_TEMPORAL]: [
        { nombre: 'motivoEstancia', tipo: 'select', requerido: true, label: 'Motivo de estancia', opciones: ['Trabajo', 'Estudio', 'Unidad familiar', 'Inversionista', 'Otro'] },
        { nombre: 'tiempoSolicitado', tipo: 'select', requerido: true, label: 'Tiempo solicitado', opciones: ['1 año', '2 años', '3 años', '4 años'] },
        { nombre: 'empresaInvitante', tipo: 'text', requerido: false, label: 'Empresa o institución invitante' },
        { nombre: 'actividadEspecifica', tipo: 'text', requerido: true, label: 'Actividad específica a realizar' },
      ],
      [TipoTramite.RESIDENCIA_PERMANENTE]: [
        { nombre: 'fundamentoLegal', tipo: 'select', requerido: true, label: 'Fundamento legal', opciones: ['Vínculo familiar con mexicano', 'Jubilado/pensionado', '4 años como residente temporal', 'Sistema por puntos', 'Asilo político', 'Protección complementaria'] },
        { nombre: 'vinculoFamiliar', tipo: 'select', requerido: false, label: 'Tipo de vínculo familiar', opciones: ['Cónyuge', 'Concubino/a', 'Hijo/a', 'Padre/Madre', 'Hermano/a menor'] },
        { nombre: 'numeroResidenciaTemporal', tipo: 'text', requerido: false, label: 'Número de tarjeta de residente temporal' },
      ],
      [TipoTramite.REGULARIZACION]: [
        { nombre: 'situacionActual', tipo: 'select', requerido: true, label: 'Situación migratoria actual', opciones: ['Documento vencido', 'Ingreso sin documentación', 'Actividad no autorizada', 'Otro'] },
        { nombre: 'fechaIngreso', tipo: 'date', requerido: true, label: 'Fecha de ingreso a México' },
        { nombre: 'puntoIngreso', tipo: 'text', requerido: true, label: 'Punto de ingreso' },
        { nombre: 'documentoVencido', tipo: 'text', requerido: false, label: 'Número de documento vencido (si aplica)' },
      ],
      [TipoTramite.CAMBIO_CONDICION]: [
        { nombre: 'condicionActual', tipo: 'select', requerido: true, label: 'Condición de estancia actual', opciones: ['Visitante', 'Residente temporal estudiante', 'Residente temporal'] },
        { nombre: 'condicionSolicitada', tipo: 'select', requerido: true, label: 'Condición de estancia solicitada', opciones: ['Residente temporal', 'Residente temporal estudiante', 'Residente permanente'] },
        { nombre: 'motivoCambio', tipo: 'text', requerido: true, label: 'Motivo del cambio' },
        { nombre: 'documentoActual', tipo: 'text', requerido: true, label: 'Número de documento migratorio actual' },
      ],
      [TipoTramite.VISA]: [
        { nombre: 'tipoVisa', tipo: 'select', requerido: true, label: 'Tipo de visa solicitada', opciones: ['Residencia Temporal por Unidad Familiar', 'Visitante sin permiso para actividades remuneradas (Razones Humanitarias)', 'Residencia Temporal o Visitante con permiso para actividades remuneradas (Oferta de Empleo)'] },
        { nombre: 'consuladoDestino', tipo: 'text', requerido: true, label: 'Consulado donde se tramitará la visa' },
        { nombre: 'parentescoSolicitante', tipo: 'select', requerido: false, label: 'Parentesco con el extranjero (si aplica)', opciones: ['Cónyuge', 'Concubino/a', 'Hijo/a', 'Padre/Madre', 'Hermano/a', 'Tutor/a', 'Empleador'] },
        { nombre: 'nombreBeneficiario', tipo: 'text', requerido: true, label: 'Nombre completo del extranjero beneficiario' },
        { nombre: 'nacionalidadBeneficiario', tipo: 'text', requerido: true, label: 'Nacionalidad del extranjero' },
      ],
      [TipoTramite.NACIONALIDAD]: [
        { nombre: 'fundamentoNacionalidad', tipo: 'select', requerido: true, label: 'Fundamento', opciones: ['Carta de naturalización', 'Declaratoria de nacionalidad por nacimiento', 'Certificado de nacionalidad mexicana'] },
        { nombre: 'añosResidencia', tipo: 'number', requerido: true, label: 'Años de residencia en México' },
        { nombre: 'idiomaEspanol', tipo: 'select', requerido: true, label: '¿Habla español?', opciones: ['Sí', 'No', 'Básico'] },
        { nombre: 'conocimientoHistoria', tipo: 'select', requerido: true, label: '¿Conoce la historia de México?', opciones: ['Sí', 'En proceso de estudio'] },
      ],
      [TipoTramite.PERMISO_TRABAJO]: [
        { nombre: 'queDeseasHacer', tipo: 'select', requerido: true, label: '¿Qué deseas hacer?', opciones: ['Obtener permiso para trabajar', 'Obtener permiso de salida y regreso'] },
        { nombre: 'especifica', tipo: 'select', requerido: false, label: 'Especifica', opciones: ['Obtener permiso para trabajar con empleador', 'Obtener permiso para trabajar (actividades independientes/autoempleo)'] },
        { nombre: 'curp', tipo: 'text', requerido: false, label: 'CURP' },
        { nombre: 'domicilioCodigoPostal', tipo: 'text', requerido: true, label: 'Código postal (domicilio en México)' },
        { nombre: 'domicilioEstado', tipo: 'text', requerido: true, label: 'Estado' },
        { nombre: 'domicilioMunicipio', tipo: 'text', requerido: true, label: 'Municipio o Alcaldía' },
        { nombre: 'domicilioColonia', tipo: 'text', requerido: true, label: 'Colonia' },
        { nombre: 'domicilioCalle', tipo: 'text', requerido: true, label: 'Calle' },
        { nombre: 'domicilioNumeroExterior', tipo: 'text', requerido: true, label: 'Número exterior' },
        { nombre: 'domicilioNumeroInterior', tipo: 'text', requerido: false, label: 'Número interior' },
        { nombre: 'domicilioLada', tipo: 'text', requerido: false, label: 'Lada' },
        { nombre: 'domicilioTelefono', tipo: 'text', requerido: false, label: 'Teléfono fijo' },
      ],
      [TipoTramite.RENOVACION]: [
        { nombre: 'documentoARenovar', tipo: 'select', requerido: true, label: 'Documento a renovar', opciones: ['Tarjeta de residente temporal', 'Tarjeta de residente permanente', 'Tarjeta de visitante'] },
        { nombre: 'numeroDocumentoActual', tipo: 'text', requerido: true, label: 'Número de documento actual' },
        { nombre: 'fechaVencimiento', tipo: 'date', requerido: true, label: 'Fecha de vencimiento' },
        { nombre: 'motivoRenovacion', tipo: 'select', requerido: true, label: 'Motivo de renovación', opciones: ['Vencimiento próximo', 'Documento dañado', 'Robo o extravío', 'Cambio de datos'] },
      ],
      [TipoTramite.CAMBIO_DOMICILIO]: [
        { nombre: 'domicilioAnterior', tipo: 'text', requerido: true, label: 'Domicilio anterior' },
        { nombre: 'domicilioNuevo', tipo: 'text', requerido: true, label: 'Nuevo domicilio' },
        { nombre: 'codigoPostalNuevo', tipo: 'text', requerido: true, label: 'Código postal nuevo' },
        { nombre: 'entidadFederativa', tipo: 'select', requerido: true, label: 'Entidad federativa', opciones: ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'] },
        { nombre: 'numeroDocumentoMigratorio', tipo: 'text', requerido: true, label: 'Número de documento migratorio' },
      ],
      [TipoTramite.REPOSICION_DOCUMENTO]: [
        { nombre: 'documentoReponer', tipo: 'select', requerido: true, label: 'Documento a reponer', opciones: ['Tarjeta de residente temporal', 'Tarjeta de residente permanente', 'Tarjeta de visitante', 'FMM'] },
        { nombre: 'motivoReposicion', tipo: 'select', requerido: true, label: 'Motivo de reposición', opciones: ['Robo', 'Extravío', 'Deterioro'] },
        { nombre: 'numeroDocumentoOriginal', tipo: 'text', requerido: false, label: 'Número de documento original (si lo recuerda)' },
        { nombre: 'fechaEvento', tipo: 'date', requerido: true, label: 'Fecha del robo/extravío/deterioro' },
        { nombre: 'actaMinisterioPublico', tipo: 'select', requerido: true, label: '¿Cuenta con acta del Ministerio Público?', opciones: ['Sí', 'No', 'En trámite'] },
      ],
      [TipoTramite.CAMBIO_NACIONALIDAD]: [
        { nombre: 'nacionalidadAnterior', tipo: 'text', requerido: true, label: 'Nacionalidad anterior' },
        { nombre: 'nacionalidadNueva', tipo: 'text', requerido: true, label: 'Nueva nacionalidad' },
        { nombre: 'fechaCambio', tipo: 'date', requerido: true, label: 'Fecha del cambio de nacionalidad' },
        { nombre: 'documentoMigratorioActual', tipo: 'text', requerido: true, label: 'Número de documento migratorio actual' },
      ],
    };

    return [...commonFields, ...(typeSpecificFields[tipo] || [])];
  }

  /**
   * Retorna los requisitos (documentos) por tipo de trámite
   */
  getRequisitosByType(tipo: TipoTramite): Array<{ nombre: string; obligatorio: boolean; descripcion: string }> {
    const commonRequisitos = [
      { nombre: 'Pasaporte o documento de identidad vigente', obligatorio: true, descripcion: 'Copia legible del pasaporte o documento de identidad y viaje válido conforme al derecho internacional' },
      { nombre: 'Formato de solicitud', obligatorio: true, descripcion: 'Formato oficial llenado y firmado (se genera en el sistema del INM). Solo original' },
      { nombre: 'Comprobante de pago de derechos', obligatorio: true, descripcion: 'Original y copia del comprobante de pago por recepción, estudio y autorización de visa' },
    ];

    const typeRequisitos: Record<string, Array<{ nombre: string; obligatorio: boolean; descripcion: string }>> = {
      [TipoTramite.VISA]: [
        { nombre: 'Identificación oficial vigente del promovente', obligatorio: true, descripcion: 'Pasaporte, INE, cédula profesional, cartilla militar, matrícula consular, carta de naturalización, licencia de conducir o tarjeta de residencia vigente. Original y copia' },
        { nombre: 'Acta de nacimiento del promovente', obligatorio: false, descripcion: 'Si el vínculo es padre/madre del promovente. Original y copia. Apostillada si es extranjera' },
        { nombre: 'Acta de nacimiento del extranjero', obligatorio: false, descripcion: 'Si el vínculo es hijo/a del promovente (menor de edad o en interdicción). Original y copia' },
        { nombre: 'Acta de matrimonio', obligatorio: false, descripcion: 'Si el vínculo es cónyuge. Si el promovente es mexicano debe ser acta mexicana. Original y copia' },
        { nombre: 'Documento de disolución matrimonial', obligatorio: false, descripcion: 'Si el promovente acreditó vínculo de matrimonio con otra persona previamente. Original y copia' },
        { nombre: 'Documento de concubinato', obligatorio: false, descripcion: 'Otorgado ante autoridad competente que acredite convivencia mínima de 5 años. Original y copia' },
        { nombre: 'Consentimiento del otro padre/madre', obligatorio: false, descripcion: 'Para menores: documento emitido por autoridad competente donde el otro padre consiente la salida del menor. Original y copia' },
        { nombre: 'Documento de tutela o curatela', obligatorio: false, descripcion: 'Si aplica para menores bajo tutela del promovente. Emitido por autoridad competente. Original y copia' },
        { nombre: 'Oferta de empleo en papel membretado', obligatorio: false, descripcion: 'Para visa por oferta de empleo: señalando ocupación (SINCO), temporalidad, lugar de trabajo y remuneración. Original' },
        { nombre: 'Constancia de inscripción del empleador', obligatorio: false, descripcion: 'Para visa por oferta de empleo: debidamente actualizada. Copia' },
        { nombre: 'Carta responsiva de gastos', obligatorio: false, descripcion: 'Para visa por razones humanitarias: carta asumiendo gastos de viaje y permanencia. Original' },
        { nombre: 'Documentos que acrediten razón humanitaria', obligatorio: false, descripcion: 'Certificado médico, constancia de desastre natural, o escrito de autoridad pública según el caso. Original' },
        { nombre: 'Reconocimiento de condición de refugiado', obligatorio: false, descripcion: 'Si el promovente obtuvo residencia permanente por refugio. Emitido por COMAR. Original y copia' },
      ],
      [TipoTramite.NACIONALIDAD]: [
        { nombre: 'Tarjeta de residente permanente', obligatorio: true, descripcion: 'Vigente, original y copia' },
        { nombre: 'Constancia de residencia', obligatorio: true, descripcion: 'Emitida por autoridad local' },
        { nombre: 'Carta de antecedentes no penales', obligatorio: true, descripcion: 'De los últimos 5 años' },
        { nombre: 'Acta de nacimiento apostillada', obligatorio: true, descripcion: 'Del país de origen, traducida al español' },
        { nombre: 'Comprobante de ingresos', obligatorio: true, descripcion: 'Que demuestre medios de subsistencia' },
      ],
      [TipoTramite.PERMISO_TRABAJO]: [
        { nombre: 'Tarjeta de residente temporal o residente temporal estudiante vigente', obligatorio: true, descripcion: 'Original' },
        { nombre: 'Comprobante de pago de derechos para permiso de trabajo', obligatorio: true, descripcion: 'Original y copia, de acuerdo con la Ley Federal de Derechos' },
        { nombre: 'Carta oferta de empleo en papel membretado', obligatorio: false, descripcion: 'Para permiso con empleador: indicar actividad, temporalidad, lugar de trabajo y datos de constancia de inscripción del empleador actualizada. Original' },
        { nombre: 'Escrito bajo protesta de decir verdad (actividades independientes)', obligatorio: false, descripcion: 'Para autoempleo: manifestar ocupación y lugar donde desarrollará actividades. Original' },
        { nombre: 'Comprobante de inscripción en el RFC', obligatorio: false, descripcion: 'Para actividades independientes. Copia' },
        { nombre: 'Carta de conformidad de institución educativa', obligatorio: false, descripcion: 'Para residente temporal estudiante con oferta de empleo relacionada a sus estudios. Original' },
        { nombre: 'Permisos laborales para menores (15-17 años)', obligatorio: false, descripcion: 'Autorizaciones previstas en la normatividad laboral. Original' },
      ],
      [TipoTramite.RENOVACION]: [
        { nombre: 'Documento migratorio a renovar', obligatorio: true, descripcion: 'Original y copia' },
        { nombre: 'Comprobante de actividad vigente', obligatorio: true, descripcion: 'Carta de empleo, inscripción escolar, etc.' },
        { nombre: 'Comprobante de domicilio reciente', obligatorio: true, descripcion: 'No mayor a 3 meses' },
      ],
      [TipoTramite.CAMBIO_DOMICILIO]: [
        { nombre: 'Documento migratorio vigente', obligatorio: true, descripcion: 'Original y copia' },
        { nombre: 'Comprobante de domicilio nuevo', obligatorio: true, descripcion: 'No mayor a 3 meses del nuevo domicilio' },
        { nombre: 'Comprobante de domicilio anterior', obligatorio: false, descripcion: 'Para verificación' },
      ],
      [TipoTramite.REPOSICION_DOCUMENTO]: [
        { nombre: 'Acta ante Ministerio Público', obligatorio: true, descripcion: 'Por robo o extravío del documento' },
        { nombre: 'Copia del documento extraviado', obligatorio: false, descripcion: 'Si cuenta con ella' },
        { nombre: 'Identificación oficial', obligatorio: true, descripcion: 'Pasaporte u otro documento de identidad' },
      ],
      [TipoTramite.CAMBIO_NACIONALIDAD]: [
        { nombre: 'Documento migratorio vigente', obligatorio: true, descripcion: 'Original y copia' },
        { nombre: 'Documento que acredite nueva nacionalidad', obligatorio: true, descripcion: 'Carta de naturalización o certificado del país correspondiente' },
        { nombre: 'Carta bajo protesta de decir verdad', obligatorio: true, descripcion: 'Indicando nacionalidad anterior y nueva' },
      ],
      ['notificacion_cambio']: [
        { nombre: 'Carta firmada por la persona extranjera bajo protesta de decir verdad', obligatorio: true, descripcion: 'Manifestando el cambio a notificar (EC, nombre, nacionalidad, domicilio o lugar de trabajo), señalando el anterior y el nuevo dato. En caso de doble nacionalidad indicarlo. Original' },
        { nombre: 'Acta de matrimonio, sentencia de divorcio o acta de defunción', obligatorio: false, descripcion: 'Para cambio de estado civil. Original y copia' },
        { nombre: 'Pasaporte de la nueva nacionalidad, certificado de nacionalidad o carta de naturalización', obligatorio: false, descripcion: 'Para cambio de nacionalidad. Original y copia' },
        { nombre: 'Pasaporte o documento de identidad con el nuevo nombre', obligatorio: false, descripcion: 'Para cambio de nombre. Y en su caso, documento de autoridad competente que conste el cambio. Original y copia' },
      ],
      ['expedicion_documento']: [
        { nombre: 'Comprobante de pago de derechos por expedición de documento migratorio', obligatorio: true, descripcion: 'Original y copia, de conformidad con la Ley Federal de Derechos' },
        { nombre: 'Tarjeta de residente o visitante vigente (para renovación)', obligatorio: false, descripcion: 'Con vigencia de hasta 30 días naturales para su cancelación. Original' },
        { nombre: 'Constancia de continuidad laboral (renovación por oferta de empleo)', obligatorio: false, descripcion: 'En papel membretado del empleador indicando periodo de vigencia. Original y copia' },
        { nombre: 'Carta o constancia de institución educativa (renovación estudiante)', obligatorio: false, descripcion: 'Indicando que continúan estudios o está en proceso de obtención de título. Original y copia' },
        { nombre: 'Escrito bajo protesta de decir verdad (renovación por unidad familiar)', obligatorio: false, descripcion: 'Manifestando que subsisten las condiciones. Firma de ambos cónyuges si aplica. Original' },
        { nombre: 'Pasaporte o documento de identidad vigente (para canje)', obligatorio: false, descripcion: 'Válido conforme al derecho internacional. Original y copia' },
        { nombre: 'Visa mexicana (para canje)', obligatorio: false, descripcion: 'Original y copia' },
        { nombre: 'FMM válida y vigente (para canje)', obligatorio: false, descripcion: 'Forma Migratoria Múltiple. Original y copia' },
        { nombre: 'Documento oficial para reposición', obligatorio: false, descripcion: 'Pasaporte o documento con el que obtuvo la condición de estancia. Original y copia' },
        { nombre: 'Oficio de la Dirección General de Protocolo de la SRE (por acuerdo)', obligatorio: false, descripcion: 'Informando suspensión de privilegios o conclusión de encargo oficial. Original y copia' },
      ],
      ['regularizacion_migratoria']: [
        { nombre: 'Escrito solicitando la regularización de situación migratoria', obligatorio: true, descripcion: 'Especificando la irregularidad en la que incurrió (Art. 135 Ley de Migración). Original' },
        { nombre: 'Pasaporte o documento de identidad y viaje', obligatorio: true, descripcion: 'Documento oficial con nombre, nacionalidad, fecha de nacimiento y fotografía. Original y copia' },
        { nombre: 'Comparecer ante autoridad migratoria (entrevista)', obligatorio: true, descripcion: 'Se asentará en acta las circunstancias del caso y motivos para solicitar la regularización' },
        { nombre: 'Comprobante de pago de derechos por regularización', obligatorio: false, descripcion: 'Para unidad familiar y documento vencido. Original y copia' },
        { nombre: 'Comprobante de pago de multa', obligatorio: false, descripcion: 'Para unidad familiar (20-40 UMA) y documento vencido (20-100 UMA). Original y copia' },
        { nombre: 'Documentos que acrediten el supuesto humanitario', obligatorio: false, descripcion: 'Para razones humanitarias: documental de autoridad competente según el caso. Original y copia' },
        { nombre: 'Documentos que acrediten vínculo familiar', obligatorio: false, descripcion: 'Para unidad familiar: acta de matrimonio, nacimiento, tutela, etc. Original y copia' },
        { nombre: 'FMM, tarjeta de visitante o residente temporal (documento vencido)', obligatorio: false, descripcion: 'No mayor a 60 días naturales de vencimiento. Original' },
      ],
      ['constancia_empleador']: [
        { nombre: 'Acta constitutiva o instrumento público (persona moral)', obligatorio: false, descripcion: 'Que acredite la legal existencia y sus modificaciones. Original y copia' },
        { nombre: 'Instrumento público de poder o mandato (persona moral)', obligatorio: false, descripcion: 'Con facultades conferidas a representantes legales o apoderados. Original y copia' },
        { nombre: 'Identificación oficial vigente del representante o apoderado', obligatorio: true, descripcion: 'Original y copia' },
        { nombre: 'Comprobante de domicilio (no mayor a 30 días)', obligatorio: true, descripcion: 'Original y copia' },
        { nombre: 'Constancia de inscripción en el RFC', obligatorio: true, descripcion: 'Copia' },
        { nombre: 'Constancia de presentación de última declaración de impuestos', obligatorio: true, descripcion: 'Emitida por autoridad competente. Copia' },
        { nombre: 'Lista de empleados y su nacionalidad (persona moral)', obligatorio: false, descripcion: 'Original' },
        { nombre: 'Comprobante de pago de derechos por CIE', obligatorio: true, descripcion: 'Por recepción, estudio y expedición de la constancia. Original y copia' },
      ],
      ['cambio_condicion_estancia']: [
        { nombre: 'Pasaporte o documento de identidad y viaje', obligatorio: true, descripcion: 'Documento oficial exhibido para obtener la condición de estancia actual. Original y copia' },
        { nombre: 'Tarjeta de residente, visitante o FMM vigente', obligatorio: true, descripcion: 'Documento migratorio actual válido y vigente. Original' },
        { nombre: 'Comprobante de pago de derechos por cambio de condición', obligatorio: true, descripcion: 'Por recepción y estudio del cambio. Original y copia' },
        { nombre: 'Identificación oficial de la persona mexicana o tarjeta de residente', obligatorio: false, descripcion: 'Para acreditar vínculo familiar. Original y copia' },
        { nombre: 'Documentos que acrediten vínculo familiar', obligatorio: false, descripcion: 'Acta de nacimiento, matrimonio, concubinato, tutela según el caso. Original y copia' },
        { nombre: 'Resolución de COMAR, SRE o autoridad migratoria', obligatorio: false, descripcion: 'Para cambio por razones humanitarias (refugio, asilo, apátrida). Original y copia' },
        { nombre: 'Comprobante de pago por expedición de documento migratorio', obligatorio: true, descripcion: 'Por la expedición del nuevo documento según condición autorizada. Original y copia' },
      ],
    };

    return [...commonRequisitos, ...(typeRequisitos[tipo] || [])];
  }

  /**
   * Retorna el costo del trámite (pago de derechos) por tipo
   */
  getCostoByType(tipo: TipoTramite): { concepto: string; monto: number; moneda: string; fundamentoLegal: string } {
    const costos: Record<string, { concepto: string; monto: number; moneda: string; fundamentoLegal: string }> = {
      [TipoTramite.RESIDENCIA_TEMPORAL]: { concepto: 'Residencia Temporal', monto: 4_613, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción I, Ley Federal de Derechos' },
      [TipoTramite.RESIDENCIA_PERMANENTE]: { concepto: 'Residencia Permanente', monto: 5_765, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción II, Ley Federal de Derechos' },
      [TipoTramite.REGULARIZACION]: { concepto: 'Regularización migratoria', monto: 6_073, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción VII, Ley Federal de Derechos' },
      [TipoTramite.CAMBIO_CONDICION]: { concepto: 'Cambio de condición de estancia', monto: 4_613, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción III, Ley Federal de Derechos' },
      [TipoTramite.VISA]: { concepto: 'Recepción y estudio de la solicitud, y en su caso, autorización de visa por unidad familiar u oferta de empleo', monto: 248, moneda: 'MXN', fundamentoLegal: 'Nota: Visa por razones humanitarias está exenta de pago. Pago con tarjeta Visa/MasterCard en oficina del INM o mediante hoja de ayuda bancaria. El INM no acepta pagos en efectivo.' },
      [TipoTramite.NACIONALIDAD]: { concepto: 'Carta de naturalización', monto: 8_183, moneda: 'MXN', fundamentoLegal: 'Art. 20-A, Ley Federal de Derechos' },
      [TipoTramite.PERMISO_TRABAJO]: { concepto: 'Permiso para trabajar o permiso de salida y regreso', monto: 3_686, moneda: 'MXN', fundamentoLegal: 'Ley Federal de Derechos. Pago con tarjeta Visa/MasterCard en oficina del INM o mediante hoja de ayuda bancaria. El INM no acepta pagos en efectivo.' },
      [TipoTramite.RENOVACION]: { concepto: 'Renovación de documento', monto: 1_523, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción VI, Ley Federal de Derechos' },
      [TipoTramite.CAMBIO_DOMICILIO]: { concepto: 'Notificación de cambio de domicilio', monto: 0, moneda: 'MXN', fundamentoLegal: 'Sin costo - trámite gratuito' },
      [TipoTramite.REPOSICION_DOCUMENTO]: { concepto: 'Reposición de documento migratorio', monto: 1_523, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción VI, Ley Federal de Derechos' },
      [TipoTramite.CAMBIO_NACIONALIDAD]: { concepto: 'Notificación de cambio de nacionalidad', monto: 0, moneda: 'MXN', fundamentoLegal: 'Sin costo - trámite gratuito' },
      ['notificacion_cambio']: { concepto: 'Notificación de cambio (estado civil, nombre, nacionalidad, domicilio o lugar de trabajo)', monto: 0, moneda: 'MXN', fundamentoLegal: 'Sin costo - trámite gratuito. Art. 158 Ley de Migración: susceptible de multa si no se notifica o se hace de forma extemporánea.' },
      ['expedicion_documento']: { concepto: 'Expedición de documento migratorio (renovación, canje, reposición o acuerdo)', monto: 1_523, moneda: 'MXN', fundamentoLegal: 'Art. 8, Ley Federal de Derechos. Pago con tarjeta Visa/MasterCard en oficina del INM o mediante hoja de ayuda bancaria. Visitantes por razones humanitarias exentos de pago (Art. 16 LFD).' },
    };

    return costos[tipo] || { concepto: 'Trámite migratorio', monto: 0, moneda: 'MXN', fundamentoLegal: 'Consultar con asesor' };
  }
}
