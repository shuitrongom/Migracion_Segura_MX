import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { Cita } from './entities/cita.entity';
import { CreateCitaDto } from './dto/create-cita.dto';
import { RescheduleCitaDto } from './dto/reschedule-cita.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { EstatusCita } from '../../common/enums';

@Injectable()
export class CitasService {
  constructor(
    @InjectRepository(Cita)
    private readonly citaRepository: Repository<Cita>,
  ) {}

  /**
   * Req 12.2 - Create appointment.
   */
  async create(dto: CreateCitaDto): Promise<Cita> {
    const cita = this.citaRepository.create({
      clienteId: dto.clienteId,
      asesorId: dto.asesorId,
      fecha: dto.fecha as unknown as Date,
      hora: dto.hora,
      duracionMinutos: dto.duracionMinutos ?? 30,
      modalidad: dto.modalidad,
      notas: dto.notas ?? null,
      estatus: EstatusCita.PROGRAMADA,
    });

    return this.citaRepository.save(cita);
  }

  /**
   * List appointments with filters (by date range, asesor).
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    fechaInicio?: string,
    fechaFin?: string,
    asesorId?: string,
  ): Promise<PaginatedResponseDto<Cita>> {
    const qb = this.citaRepository
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.cliente', 'cliente')
      .leftJoinAndSelect('cita.asesor', 'asesor');

    if (fechaInicio && fechaFin) {
      qb.andWhere('cita.fecha BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio,
        fechaFin,
      });
    } else if (fechaInicio) {
      qb.andWhere('cita.fecha >= :fechaInicio', { fechaInicio });
    } else if (fechaFin) {
      qb.andWhere('cita.fecha <= :fechaFin', { fechaFin });
    }

    if (asesorId) {
      qb.andWhere('cita.asesorId = :asesorId', { asesorId });
    }

    qb.orderBy('cita.fecha', 'ASC')
      .addOrderBy('cita.hora', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Get appointment by ID.
   */
  async findOne(id: string): Promise<Cita> {
    const cita = await this.citaRepository.findOne({
      where: { id },
      relations: ['cliente', 'asesor'],
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    return cita;
  }

  /**
   * Req 12.4 - Reschedule appointment.
   */
  async reschedule(id: string, dto: RescheduleCitaDto): Promise<Cita> {
    const cita = await this.findOne(id);

    if (cita.estatus === EstatusCita.CANCELADA || cita.estatus === EstatusCita.COMPLETADA) {
      throw new BadRequestException(
        'No se puede reagendar una cita cancelada o completada',
      );
    }

    cita.fecha = dto.fecha as unknown as Date;
    cita.hora = dto.hora;
    cita.estatus = EstatusCita.REAGENDADA;

    return this.citaRepository.save(cita);
  }

  /**
   * Req 12.6 - Cancel appointment.
   */
  async cancel(id: string): Promise<Cita> {
    const cita = await this.findOne(id);

    if (cita.estatus === EstatusCita.CANCELADA) {
      throw new BadRequestException('La cita ya está cancelada');
    }

    if (cita.estatus === EstatusCita.COMPLETADA) {
      throw new BadRequestException('No se puede cancelar una cita completada');
    }

    cita.estatus = EstatusCita.CANCELADA;
    return this.citaRepository.save(cita);
  }

  /**
   * Req 8.5 - Get today's appointments for admin dashboard.
   */
  async getTodayAppointments(): Promise<Cita[]> {
    const today = new Date().toISOString().split('T')[0];

    return this.citaRepository.find({
      where: { fecha: today as unknown as Date },
      relations: ['cliente', 'asesor'],
      order: { hora: 'ASC' },
    });
  }

  /**
   * Get appointments for a client.
   */
  async getByCliente(
    clienteId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<Cita>> {
    const [data, total] = await this.citaRepository.findAndCount({
      where: { clienteId },
      relations: ['asesor'],
      order: { fecha: 'DESC', hora: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }
}
