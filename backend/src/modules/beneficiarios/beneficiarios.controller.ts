import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BeneficiariosService } from './beneficiarios.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Beneficiarios')
@ApiBearerAuth()
@Controller('beneficiarios')
export class BeneficiariosController {
  constructor(private readonly beneficiariosService: BeneficiariosService) {}

  /**
   * Cliente: crear un nuevo beneficiario (extranjero)
   */
  @Post()
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Crear beneficiario (extranjero) vinculado a mi cuenta' })
  create(@Body() dto: any, @Request() req: any) {
    return this.beneficiariosService.create(req.user.id, dto);
  }

  /**
   * Cliente: obtener mis beneficiarios
   */
  @Get('mis-beneficiarios')
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener mis beneficiarios (extranjeros registrados)' })
  getMisBeneficiarios(@Request() req: any) {
    return this.beneficiariosService.getByUser(req.user.id);
  }

  /**
   * Cliente: obtener un beneficiario por ID
   */
  @Get('mis-beneficiarios/:id')
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Obtener detalle de un beneficiario' })
  @ApiParam({ name: 'id', description: 'UUID del beneficiario' })
  getOneBeneficiario(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.beneficiariosService.findOne(id, req.user.id);
  }

  /**
   * Cliente: actualizar beneficiario
   */
  @Put('mis-beneficiarios/:id')
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Actualizar datos de un beneficiario' })
  @ApiParam({ name: 'id', description: 'UUID del beneficiario' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any, @Request() req: any) {
    return this.beneficiariosService.update(id, req.user.id, dto);
  }

  /**
   * Cliente: eliminar beneficiario
   */
  @Delete('mis-beneficiarios/:id')
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Eliminar un beneficiario' })
  @ApiParam({ name: 'id', description: 'UUID del beneficiario' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.beneficiariosService.remove(id, req.user.id);
  }

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  /**
   * Admin: listar todos los beneficiarios
   */
  @Get()
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Listar todos los beneficiarios (admin)' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.beneficiariosService.findAll(
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }

  /**
   * Admin: ver beneficiarios de una cuenta específica
   */
  @Get('cuenta/:userId')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Ver beneficiarios de una cuenta (admin)' })
  @ApiParam({ name: 'userId', description: 'UUID del usuario/cuenta' })
  getByCuenta(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.beneficiariosService.findByAccount(userId);
  }
}
