import { Controller, Get, Post, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateAsesorDto } from './dto/create-asesor.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Listar asesores disponibles
   */
  @Get('asesores')
  @Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR)
  @ApiOperation({ summary: 'Listar asesores disponibles' })
  getAsesores() {
    return this.usersService.findByRole(UserRole.ASESOR);
  }

  /**
   * Crear nuevo asesor (solo admin)
   */
  @Post('asesores')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear nuevo asesor' })
  createAsesor(@Body() dto: CreateAsesorDto) {
    return this.usersService.createAsesor(dto);
  }

  /**
   * Eliminar asesor (solo admin)
   */
  @Delete('asesores/:id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar asesor' })
  @ApiParam({ name: 'id', description: 'UUID del asesor' })
  deleteAsesor(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deleteAsesor(id);
  }
}
