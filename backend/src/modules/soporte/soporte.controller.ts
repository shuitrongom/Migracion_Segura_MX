import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { SoporteService } from './soporte.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Soporte')
@ApiBearerAuth()
@Controller('soporte')
export class SoporteController {
  constructor(private readonly soporteService: SoporteService) {}

  /**
   * Req 7.1 - Create ticket
   */
  @Post('tickets')
  @ApiOperation({ summary: 'Crear ticket de soporte' })
  createTicket(
    @Body() dto: CreateTicketDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.soporteService.createTicket(dto, req.user.id);
  }

  /**
   * List my tickets
   */
  @Get('tickets')
  @ApiOperation({ summary: 'Listar mis tickets de soporte' })
  getTickets(
    @Query() pagination: PaginationDto,
    @Request() req: { user: { id: string; role: string } },
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    return this.soporteService.getTickets(req.user.id, req.user.role, page, limit);
  }

  /**
   * Get ticket detail with messages
   */
  @Get('tickets/:id')
  @ApiOperation({ summary: 'Obtener detalle del ticket con mensajes' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  getTicketById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.soporteService.getTicketById(id, req.user.id, req.user.role);
  }

  /**
   * Req 7.3 - Add message to ticket
   */
  @Post('tickets/:id/mensajes')
  @ApiOperation({ summary: 'Agregar mensaje al ticket' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMensajeDto,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.soporteService.addMessage(id, req.user.id, req.user.role, dto);
  }

  /**
   * Close ticket
   */
  @Patch('tickets/:id/cerrar')
  @ApiOperation({ summary: 'Cerrar ticket de soporte' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  closeTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.soporteService.closeTicket(id, req.user.id, req.user.role);
  }
}
