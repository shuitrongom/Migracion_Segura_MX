import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Feedback, FeedbackEstatus, FeedbackPrioridad, FeedbackTipo } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  /**
   * Crear un nuevo reporte de feedback desde la app móvil.
   * Auto-calcula prioridad basándose en el tipo y rating.
   */
  async create(dto: CreateFeedbackDto, clienteId: string): Promise<Feedback> {
    const prioridad = this.calcularPrioridad(dto.tipo, dto.rating);

    const feedback = this.feedbackRepository.create({
      clienteId,
      tipo: dto.tipo,
      pantalla: dto.pantalla ?? null,
      descripcion: dto.descripcion,
      pasosReproduccion: dto.pasosReproduccion ?? null,
      rating: dto.rating ?? null,
      prioridad,
      estatus: FeedbackEstatus.NUEVO,
      deviceInfo: dto.deviceInfo ?? null,
    });

    return this.feedbackRepository.save(feedback);
  }

  /**
   * Listar todos los reportes (solo admin).
   * Soporta filtros por tipo, estatus y prioridad.
   */
  async findAll(
    page = 1,
    limit = 25,
    tipo?: FeedbackTipo,
    estatus?: FeedbackEstatus,
    prioridad?: FeedbackPrioridad,
  ): Promise<PaginatedResponseDto<Feedback>> {
    const qb = this.feedbackRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.cliente', 'cliente')
      .orderBy('f.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (tipo) qb.andWhere('f.tipo = :tipo', { tipo });
    if (estatus) qb.andWhere('f.estatus = :estatus', { estatus });
    if (prioridad) qb.andWhere('f.prioridad = :prioridad', { prioridad });

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Obtener un reporte por ID (solo admin).
   */
  async findOne(id: string): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });
    if (!feedback) throw new NotFoundException('Reporte no encontrado');
    return feedback;
  }

  /**
   * Actualizar estatus, prioridad o notas de un reporte (solo admin).
   */
  async update(id: string, dto: UpdateFeedbackDto, adminId: string): Promise<Feedback> {
    const feedback = await this.findOne(id);

    if (dto.estatus !== undefined) feedback.estatus = dto.estatus;
    if (dto.prioridad !== undefined) feedback.prioridad = dto.prioridad;
    if (dto.notasAdmin !== undefined) feedback.notasAdmin = dto.notasAdmin;

    // Registrar quién atendió
    if (dto.estatus && dto.estatus !== FeedbackEstatus.NUEVO) {
      feedback.atendidoPor = adminId;
    }

    return this.feedbackRepository.save(feedback);
  }

  /**
   * Estadísticas de feedback para el dashboard admin.
   */
  async getStats(): Promise<{
    total: number;
    nuevos: number;
    porTipo: Record<string, number>;
    porEstatus: Record<string, number>;
    porPrioridad: Record<string, number>;
    ratingPromedio: number | null;
  }> {
    const [total, nuevos, byTipo, byEstatus, byPrioridad, ratingResult] = await Promise.all([
      this.feedbackRepository.count(),
      this.feedbackRepository.count({ where: { estatus: FeedbackEstatus.NUEVO } }),
      this.feedbackRepository
        .createQueryBuilder('f')
        .select('f.tipo', 'tipo')
        .addSelect('COUNT(*)', 'count')
        .groupBy('f.tipo')
        .getRawMany(),
      this.feedbackRepository
        .createQueryBuilder('f')
        .select('f.estatus', 'estatus')
        .addSelect('COUNT(*)', 'count')
        .groupBy('f.estatus')
        .getRawMany(),
      this.feedbackRepository
        .createQueryBuilder('f')
        .select('f.prioridad', 'prioridad')
        .addSelect('COUNT(*)', 'count')
        .groupBy('f.prioridad')
        .getRawMany(),
      this.feedbackRepository
        .createQueryBuilder('f')
        .select('AVG(f.rating)', 'avg')
        .where('f.rating IS NOT NULL')
        .getRawOne(),
    ]);

    return {
      total,
      nuevos,
      porTipo: Object.fromEntries(byTipo.map((r) => [r.tipo, parseInt(r.count)])),
      porEstatus: Object.fromEntries(byEstatus.map((r) => [r.estatus, parseInt(r.count)])),
      porPrioridad: Object.fromEntries(byPrioridad.map((r) => [r.prioridad, parseInt(r.count)])),
      ratingPromedio: ratingResult?.avg ? parseFloat(Number(ratingResult.avg).toFixed(1)) : null,
    };
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  private calcularPrioridad(tipo: FeedbackTipo, rating?: number): FeedbackPrioridad {
    // Errores con rating muy bajo = crítico
    if (tipo === FeedbackTipo.ERROR && rating !== undefined && rating <= 2) {
      return FeedbackPrioridad.CRITICA;
    }
    // Errores sin rating = alta
    if (tipo === FeedbackTipo.ERROR) return FeedbackPrioridad.ALTA;
    // Confusión de UX = media
    if (tipo === FeedbackTipo.CONFUSION) return FeedbackPrioridad.MEDIA;
    // Sugerencias = baja
    return FeedbackPrioridad.BAJA;
  }
}
