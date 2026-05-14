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
import { EstatusTramite, TipoTramite } from '../../common/enums';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

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
  ) {}

  /**
   * Req 3.1, 3.5, 3.7 - Crear trámite con selección de tipo.
   * Si no es borrador, genera número de pieza automáticamente.
   * Req 10.9 - Auto-genera expediente al crear trámite.
   */
  async create(dto: CreateTramiteDto): Promise<Tramite> {
    const esBorrador = dto.esBorrador ?? false;

    const tramite = this.tramiteRepository.create({
      clienteId: dto.clienteId,
      tipo: dto.tipo,
      datosFormulario: dto.datosFormulario || null,
      asesorId: dto.asesorId || null,
      estatus: esBorrador ? EstatusTramite.BORRADOR : EstatusTramite.RECIBIDO,
      numeroPieza: esBorrador ? null : await this.generateNumeroPieza(),
    });

    const saved = await this.tramiteRepository.save(tramite);

    // Aplicar plantilla si existe una activa para este tipo
    await this.applyPlantillaIfExists(saved);

    // Req 10.9 - Auto-generar expediente
    if (!esBorrador) {
      await this.createExpediente(saved.clienteId, saved.id);
    }

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
   * Req 10.1 - Cambiar estatus del trámite
   */
  async updateEstatus(tramiteId: string, dto: UpdateEstatusDto): Promise<Tramite> {
    const tramite = await this.findOneOrFail(tramiteId);

    tramite.estatus = dto.estatus;

    if (dto.resolucion) {
      tramite.resolucion = dto.resolucion;
    }

    if (
      dto.estatus === EstatusTramite.APROBADO ||
      dto.estatus === EstatusTramite.RECHAZADO ||
      dto.estatus === EstatusTramite.CANCELADO
    ) {
      tramite.fechaCierre = new Date();
    }

    const saved = await this.tramiteRepository.save(tramite);

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

    return saved;
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
  async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Tramite>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const [data, total] = await this.tramiteRepository.findAndCount({
      relations: ['cliente', 'asesor', 'responsable'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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
  private async createExpediente(clienteId: string, tramiteId: string): Promise<void> {
    await this.tramiteRepository.query(
      `INSERT INTO expedientes (id, cliente_id, tramite_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [clienteId, tramiteId],
    );
  }

  /**
   * Retorna los campos del formulario según el tipo de trámite
   */
  private getFormFieldsByType(
    tipo: TipoTramite,
  ): Array<{ nombre: string; tipo: string; requerido: boolean; opciones?: string[] }> {
    const commonFields = [
      { nombre: 'nombreCompleto', tipo: 'text', requerido: true },
      { nombre: 'nacionalidad', tipo: 'text', requerido: true },
      { nombre: 'fechaNacimiento', tipo: 'date', requerido: true },
      { nombre: 'pasaporteNumero', tipo: 'text', requerido: true },
      { nombre: 'domicilioMexico', tipo: 'text', requerido: true },
    ];

    const typeSpecificFields: Record<string, Array<{ nombre: string; tipo: string; requerido: boolean; opciones?: string[] }>> = {
      [TipoTramite.RESIDENCIA_TEMPORAL]: [
        { nombre: 'motivoEstancia', tipo: 'select', requerido: true, opciones: ['trabajo', 'estudio', 'familia', 'otro'] },
        { nombre: 'tiempoSolicitado', tipo: 'select', requerido: true, opciones: ['1_año', '2_años', '3_años', '4_años'] },
      ],
      [TipoTramite.RESIDENCIA_PERMANENTE]: [
        { nombre: 'fundamentoLegal', tipo: 'select', requerido: true, opciones: ['vinculo_familiar', 'jubilado', '4_años_temporal', 'puntos'] },
      ],
      [TipoTramite.REGULARIZACION]: [
        { nombre: 'situacionActual', tipo: 'text', requerido: true },
        { nombre: 'fechaIngreso', tipo: 'date', requerido: true },
      ],
      [TipoTramite.VISA]: [
        { nombre: 'tipoVisa', tipo: 'select', requerido: true, opciones: ['turista', 'negocios', 'trabajo', 'estudiante'] },
        { nombre: 'consuladoDestino', tipo: 'text', requerido: true },
      ],
      [TipoTramite.NACIONALIDAD]: [
        { nombre: 'fundamentoNacionalidad', tipo: 'select', requerido: true, opciones: ['nacimiento', 'naturalizacion', 'matrimonio'] },
        { nombre: 'añosResidencia', tipo: 'number', requerido: true },
      ],
    };

    return [...commonFields, ...(typeSpecificFields[tipo] || [])];
  }
}
