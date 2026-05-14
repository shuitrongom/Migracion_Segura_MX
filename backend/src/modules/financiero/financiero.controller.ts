import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

import { FinancieroService } from './financiero.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Financiero')
@ApiBearerAuth()
@Controller('financiero')
export class FinancieroController {
  constructor(private readonly financieroService: FinancieroService) {}

  /**
   * Req 13.1 - Register payment
   */
  @Post('pagos')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Registrar pago' })
  registrarPago(
    @Body() dto: CreatePagoDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.financieroService.registrarPago(dto, req.user.id);
  }

  /**
   * Req 13.6 - Payment history for a client
   */
  @Get('pagos/cliente/:clienteId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Historial de pagos de un cliente' })
  @ApiParam({ name: 'clienteId', description: 'UUID del cliente' })
  getHistorialByCliente(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Query() pagination: PaginationDto,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    return this.financieroService.getHistorialByCliente(clienteId, page, limit);
  }

  /**
   * Req 13.3 - Pending balance for a client
   */
  @Get('saldo/:clienteId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Obtener saldo pendiente de un cliente' })
  @ApiParam({ name: 'clienteId', description: 'UUID del cliente' })
  getSaldoPendiente(@Param('clienteId', ParseUUIDPipe) clienteId: string) {
    return this.financieroService.getSaldoPendiente(clienteId);
  }

  /**
   * Req 13.7 - Monthly income report
   */
  @Get('reporte-mensual')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Reporte mensual de ingresos' })
  @ApiQuery({ name: 'mes', description: 'Mes (1-12)', example: 6 })
  @ApiQuery({ name: 'anio', description: 'Año', example: 2024 })
  getReporteMensual(
    @Query('mes', ParseIntPipe) mes: number,
    @Query('anio', ParseIntPipe) anio: number,
  ) {
    return this.financieroService.getReporteMensual(mes, anio);
  }
}
