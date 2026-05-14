import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Ticket } from './entities/ticket.entity';
import { MensajeTicket } from './entities/mensaje-ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { EstatusTicket, UserRole } from '../../common/enums';

@Injectable()
export class SoporteService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(MensajeTicket)
    private readonly mensajeRepository: Repository<MensajeTicket>,
  ) {}

  /**
   * Req 7.1, 7.2 - Create ticket, auto-assign to asesor of active tramite.
   */
  async createTicket(dto: CreateTicketDto, userId: string): Promise<Ticket> {
    // Try to auto-assign asesor from active tramite
    const asesorResult = await this.ticketRepository.query(
      `SELECT t.asesor_id FROM tramites t
       WHERE t.cliente_id = $1
       AND t.estatus NOT IN ('cancelado', 'aprobado', 'rechazado')
       AND t.deleted_at IS NULL
       AND t.asesor_id IS NOT NULL
       ORDER BY t.updated_at DESC
       LIMIT 1`,
      [userId],
    );

    const asesorId = asesorResult.length > 0 ? asesorResult[0].asesor_id : null;

    const ticket = this.ticketRepository.create({
      clienteId: userId,
      asesorId,
      asunto: dto.asunto,
      descripcion: dto.descripcion,
      estatus: EstatusTicket.ABIERTO,
    });

    return this.ticketRepository.save(ticket);
  }

  /**
   * List tickets for a user (client sees own, asesor sees assigned).
   */
  async getTickets(
    userId: string,
    role: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<Ticket>> {
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.asesor', 'asesor');

    if (role === UserRole.CLIENTE) {
      qb.where('ticket.clienteId = :userId', { userId });
    } else if (role === UserRole.ASESOR) {
      qb.where('ticket.asesorId = :userId', { userId });
    }
    // ADMINISTRADOR sees all tickets (no filter)

    qb.orderBy('ticket.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Get ticket with messages.
   */
  async getTicketById(id: string, userId: string, role: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['cliente', 'asesor', 'mensajes', 'mensajes.autor'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    // Verify access
    if (
      role === UserRole.CLIENTE && ticket.clienteId !== userId
    ) {
      throw new ForbiddenException('No tiene acceso a este ticket');
    }

    if (
      role === UserRole.ASESOR && ticket.asesorId !== userId
    ) {
      throw new ForbiddenException('No tiene acceso a este ticket');
    }

    return ticket;
  }

  /**
   * Req 7.3 - Add message to ticket.
   */
  async addMessage(
    ticketId: string,
    userId: string,
    role: string,
    dto: CreateMensajeDto,
  ): Promise<MensajeTicket> {
    const ticket = await this.getTicketById(ticketId, userId, role);

    if (ticket.estatus === EstatusTicket.CERRADO) {
      throw new ForbiddenException('No se pueden agregar mensajes a un ticket cerrado');
    }

    // Update ticket status to EN_ATENCION if it was ABIERTO
    if (ticket.estatus === EstatusTicket.ABIERTO && role !== UserRole.CLIENTE) {
      ticket.estatus = EstatusTicket.EN_ATENCION;
      await this.ticketRepository.save(ticket);
    }

    const mensaje = this.mensajeRepository.create({
      ticketId,
      autorId: userId,
      contenido: dto.contenido,
    });

    return this.mensajeRepository.save(mensaje);
  }

  /**
   * Close a ticket.
   */
  async closeTicket(id: string, userId: string, role: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id, userId, role);

    if (ticket.estatus === EstatusTicket.CERRADO) {
      throw new ForbiddenException('El ticket ya está cerrado');
    }

    ticket.estatus = EstatusTicket.CERRADO;
    return this.ticketRepository.save(ticket);
  }
}
