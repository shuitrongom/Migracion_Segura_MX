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
        { nombre: 'tipoVisa', tipo: 'select', requerido: true, label: 'Tipo de visa solicitada', opciones: ['Visitante sin permiso para realizar actividades remuneradas', 'Visitante con permiso para realizar actividades remuneradas', 'Residencia temporal', 'Residencia temporal estudiante', 'Residencia permanente'] },
        { nombre: 'consuladoDestino', tipo: 'text', requerido: true, label: 'Consulado donde se tramitará' },
        { nombre: 'parentescoSolicitante', tipo: 'select', requerido: false, label: 'Parentesco con el solicitante en México', opciones: ['Cónyuge', 'Concubino/a', 'Hijo/a', 'Padre/Madre', 'Hermano/a'] },
        { nombre: 'nombreBeneficiario', tipo: 'text', requerido: true, label: 'Nombre completo del beneficiario' },
      ],
      [TipoTramite.NACIONALIDAD]: [
        { nombre: 'fundamentoNacionalidad', tipo: 'select', requerido: true, label: 'Fundamento', opciones: ['Carta de naturalización', 'Declaratoria de nacionalidad por nacimiento', 'Certificado de nacionalidad mexicana'] },
        { nombre: 'añosResidencia', tipo: 'number', requerido: true, label: 'Años de residencia en México' },
        { nombre: 'idiomaEspanol', tipo: 'select', requerido: true, label: '¿Habla español?', opciones: ['Sí', 'No', 'Básico'] },
        { nombre: 'conocimientoHistoria', tipo: 'select', requerido: true, label: '¿Conoce la historia de México?', opciones: ['Sí', 'En proceso de estudio'] },
      ],
      [TipoTramite.PERMISO_TRABAJO]: [
        { nombre: 'tipoPermiso', tipo: 'select', requerido: true, label: 'Tipo de permiso', opciones: ['Oferta de empleo', 'Cuenta propia', 'Temporal por proyecto'] },
        { nombre: 'empresaEmpleadora', tipo: 'text', requerido: true, label: 'Empresa empleadora' },
        { nombre: 'rfcEmpresa', tipo: 'text', requerido: true, label: 'RFC de la empresa' },
        { nombre: 'puestoOfrecido', tipo: 'text', requerido: true, label: 'Puesto ofrecido' },
        { nombre: 'salarioMensual', tipo: 'number', requerido: true, label: 'Salario mensual (MXN)' },
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
      { nombre: 'Pasaporte vigente', obligatorio: true, descripcion: 'Original y copia de la página de datos y de la última entrada a México' },
      { nombre: 'Formato de solicitud', obligatorio: true, descripcion: 'Formato oficial llenado y firmado (se genera en el sistema)' },
      { nombre: 'Fotografía', obligatorio: true, descripcion: 'Una fotografía tamaño infantil, fondo blanco, de frente' },
      { nombre: 'Comprobante de domicilio', obligatorio: true, descripcion: 'No mayor a 3 meses (luz, agua, teléfono o estado de cuenta bancario)' },
    ];

    const typeRequisitos: Record<string, Array<{ nombre: string; obligatorio: boolean; descripcion: string }>> = {
      [TipoTramite.RESIDENCIA_TEMPORAL]: [
        { nombre: 'Carta de empleo o inscripción escolar', obligatorio: true, descripcion: 'Según el motivo de estancia' },
        { nombre: 'Solvencia económica', obligatorio: true, descripcion: 'Estados de cuenta bancarios de los últimos 3 meses' },
        { nombre: 'Documento migratorio vigente', obligatorio: true, descripcion: 'FMM o tarjeta de visitante original y copia' },
      ],
      [TipoTramite.RESIDENCIA_PERMANENTE]: [
        { nombre: 'Tarjeta de residente temporal', obligatorio: true, descripcion: 'Original y copia (si aplica por 4 años de temporal)' },
        { nombre: 'Acta de nacimiento/matrimonio', obligatorio: true, descripcion: 'Apostillada y traducida si es por vínculo familiar' },
        { nombre: 'Identificación del familiar mexicano', obligatorio: false, descripcion: 'INE o pasaporte del familiar mexicano' },
      ],
      [TipoTramite.REGULARIZACION]: [
        { nombre: 'Documento migratorio vencido', obligatorio: false, descripcion: 'Si lo tiene disponible' },
        { nombre: 'Acreditación de vínculo familiar', obligatorio: false, descripcion: 'Si aplica regularización por familia' },
        { nombre: 'Constancia de situación migratoria', obligatorio: false, descripcion: 'Emitida por el INM si fue detenido' },
      ],
      [TipoTramite.CAMBIO_CONDICION]: [
        { nombre: 'Documento migratorio actual', obligatorio: true, descripcion: 'Original y copia del documento vigente' },
        { nombre: 'Justificación del cambio', obligatorio: true, descripcion: 'Carta explicando el motivo del cambio' },
        { nombre: 'Documentos de soporte', obligatorio: true, descripcion: 'Según la nueva condición solicitada' },
      ],
      [TipoTramite.VISA]: [
        { nombre: 'Acta de nacimiento del familiar', obligatorio: false, descripcion: 'Si es visa por vínculo familiar' },
        { nombre: 'Comprobante de solvencia económica', obligatorio: true, descripcion: 'Del solicitante en México' },
        { nombre: 'Carta de invitación', obligatorio: false, descripcion: 'Si aplica' },
      ],
      [TipoTramite.NACIONALIDAD]: [
        { nombre: 'Tarjeta de residente permanente', obligatorio: true, descripcion: 'Vigente, original y copia' },
        { nombre: 'Constancia de residencia', obligatorio: true, descripcion: 'Emitida por autoridad local' },
        { nombre: 'Carta de antecedentes no penales', obligatorio: true, descripcion: 'De los últimos 5 años' },
        { nombre: 'Acta de nacimiento apostillada', obligatorio: true, descripcion: 'Del país de origen, traducida al español' },
        { nombre: 'Comprobante de ingresos', obligatorio: true, descripcion: 'Que demuestre medios de subsistencia' },
      ],
      [TipoTramite.PERMISO_TRABAJO]: [
        { nombre: 'Oferta de empleo', obligatorio: true, descripcion: 'En papel membretado con datos del empleador' },
        { nombre: 'Constancia de inscripción al IMSS', obligatorio: true, descripcion: 'Del empleador' },
        { nombre: 'RFC del empleador', obligatorio: true, descripcion: 'Copia de la cédula fiscal' },
        { nombre: 'Documento migratorio vigente', obligatorio: true, descripcion: 'Original y copia' },
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
      [TipoTramite.VISA]: { concepto: 'Expedición de visa', monto: 2_741, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción IV, Ley Federal de Derechos' },
      [TipoTramite.NACIONALIDAD]: { concepto: 'Carta de naturalización', monto: 8_183, moneda: 'MXN', fundamentoLegal: 'Art. 20-A, Ley Federal de Derechos' },
      [TipoTramite.PERMISO_TRABAJO]: { concepto: 'Permiso de trabajo', monto: 3_686, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción V, Ley Federal de Derechos' },
      [TipoTramite.RENOVACION]: { concepto: 'Renovación de documento', monto: 1_523, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción VI, Ley Federal de Derechos' },
      [TipoTramite.CAMBIO_DOMICILIO]: { concepto: 'Notificación de cambio de domicilio', monto: 0, moneda: 'MXN', fundamentoLegal: 'Sin costo - trámite gratuito' },
      [TipoTramite.REPOSICION_DOCUMENTO]: { concepto: 'Reposición de documento migratorio', monto: 1_523, moneda: 'MXN', fundamentoLegal: 'Art. 8, fracción VI, Ley Federal de Derechos' },
      [TipoTramite.CAMBIO_NACIONALIDAD]: { concepto: 'Notificación de cambio de nacionalidad', monto: 0, moneda: 'MXN', fundamentoLegal: 'Sin costo - trámite gratuito' },
    };

    return costos[tipo] || { concepto: 'Trámite migratorio', monto: 0, moneda: 'MXN', fundamentoLegal: 'Consultar con asesor' };
  }
}
