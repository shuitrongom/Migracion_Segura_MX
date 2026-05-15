import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Cliente } from './entities/cliente.entity';
import { NotaInterna } from './entities/nota-interna.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { SearchClientesDto } from './dto/search-clientes.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { StorageService } from '../../common/services/storage.service';
import { UserRole } from '../../common/enums';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(NotaInterna)
    private readonly notaInternaRepository: Repository<NotaInterna>,
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Req 9.1 - Crear cliente
   */
  async create(dto: CreateClienteDto, userId: string): Promise<Cliente> {
    const existing = await this.clienteRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe un cliente con ese correo electrónico');
    }

    const cliente = this.clienteRepository.create({
      ...dto,
      userId,
    });
    return this.clienteRepository.save(cliente);
  }

  /**
   * Req 9.2 - Editar cliente
   */
  async update(id: string, dto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOneOrFail(id);

    if (dto.email && dto.email !== cliente.email) {
      const existing = await this.clienteRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Ya existe un cliente con ese correo electrónico');
      }
    }

    Object.assign(cliente, dto);
    return this.clienteRepository.save(cliente);
  }

  /**
   * Req 9.3 - Asignar/reasignar asesor
   */
  async assignAsesor(clienteId: string, asesorId: string): Promise<Cliente> {
    const cliente = await this.findOneOrFail(clienteId);

    if (asesorId === 'auto') {
      // Auto-asignar: gestor con menos clientes, o admin si no hay gestores
      const gestores = await this.usersService.findByRole(UserRole.ASESOR);
      if (gestores.length > 0) {
        // Round-robin por carga
        const counts = await Promise.all(
          gestores.map(async (g) => {
            const count = await this.clienteRepository.count({ where: { asesorId: g.id } });
            return { id: g.id, count };
          }),
        );
        counts.sort((a, b) => a.count - b.count);
        cliente.asesorId = counts[0].id;
      } else {
        const admins = await this.usersService.findByRole(UserRole.ADMINISTRADOR);
        if (admins.length > 0) {
          cliente.asesorId = admins[0].id;
        }
      }
    } else {
      cliente.asesorId = asesorId;
    }

    const saved = await this.clienteRepository.save(cliente);
    return this.clienteRepository.findOne({ where: { id: saved.id }, relations: ['asesor'] }) as Promise<Cliente>;
  }

  /**
   * Eliminar cliente permanentemente (hard delete)
   */
  async remove(id: string): Promise<{ message: string }> {
    const cliente = await this.findOneOrFail(id);
    await this.clienteRepository.remove(cliente);
    return { message: 'Cliente eliminado permanentemente' };
  }

  /**
   * Subir foto del extranjero - guarda en storage y URL en metadata
   */
  async uploadFoto(id: string, file: Express.Multer.File): Promise<{ fotoUrl: string }> {
    const cliente = await this.findOneOrFail(id);

    const result = await this.storageService.upload(file.buffer, file.mimetype, {
      folder: `clientes/${id}`,
      fileName: `foto-${Date.now()}`,
    });

    const metadata = cliente.metadata || {};
    metadata.fotoUrl = result.url;
    cliente.metadata = metadata;
    await this.clienteRepository.save(cliente);

    return { fotoUrl: result.url };
  }

  /**
   * Eliminar foto del extranjero
   */
  async deleteFoto(id: string): Promise<{ message: string }> {
    const cliente = await this.findOneOrFail(id);
    const metadata = cliente.metadata || {};
    delete metadata.fotoUrl;
    cliente.metadata = Object.keys(metadata).length > 0 ? metadata : null;
    await this.clienteRepository.save(cliente);
    return { message: 'Foto eliminada' };
  }

  /**
   * Req 9.4, 9.5 - Buscar y filtrar clientes
   */
  async search(dto: SearchClientesDto, user?: { id: string; role: string }): Promise<PaginatedResponseDto<Cliente>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const qb: SelectQueryBuilder<Cliente> = this.clienteRepository
      .createQueryBuilder('cliente')
      .leftJoinAndSelect('cliente.asesor', 'asesor');

    // Si es gestor (ASESOR), solo ve sus clientes asignados
    if (user && user.role === 'asesor') {
      qb.andWhere('cliente.asesorId = :currentUserId', { currentUserId: user.id });
    }

    // Req 9.4 - Búsqueda por nombre, email, teléfono o número de pieza
    if (dto.q) {
      const search = `%${dto.q}%`;
      qb.andWhere(
        `(
          cliente.nombreCompleto ILIKE :search
          OR cliente.email ILIKE :search
          OR cliente.telefono ILIKE :search
          OR EXISTS (
            SELECT 1 FROM tramites t
            WHERE t.cliente_id = cliente.id
            AND t.numero_pieza ILIKE :search
            AND t.deleted_at IS NULL
          )
        )`,
        { search },
      );
    }

    // Req 9.5 - Filtrar por estatus de trámite
    if (dto.estatusTramite) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM tramites t
          WHERE t.cliente_id = cliente.id
          AND t.estatus = :estatus
          AND t.deleted_at IS NULL
        )`,
        { estatus: dto.estatusTramite },
      );
    }

    // Filtrar por etiqueta
    if (dto.etiqueta) {
      qb.andWhere(':etiqueta = ANY(cliente.etiquetas)', { etiqueta: dto.etiqueta });
    }

    // Filtrar por asesor
    if (dto.asesorId) {
      qb.andWhere('cliente.asesorId = :asesorId', { asesorId: dto.asesorId });
    }

    qb.orderBy('cliente.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  /**
   * Req 9.6 - Historial de actividad del cliente
   */
  async getActivityHistory(clienteId: string): Promise<{
    tramites: unknown[];
    documentos: unknown[];
    notas: unknown[];
  }> {
    await this.findOneOrFail(clienteId);

    // Obtener trámites del cliente con sus etapas
    const tramites = await this.clienteRepository.query(
      `SELECT t.id, t.tipo, t.estatus, t.numero_pieza, t.created_at, t.updated_at
       FROM tramites t
       WHERE t.cliente_id = $1 AND t.deleted_at IS NULL
       ORDER BY t.updated_at DESC
       LIMIT 50`,
      [clienteId],
    );

    // Obtener documentos del cliente
    const documentos = await this.clienteRepository.query(
      `SELECT d.id, d.nombre, d.estatus, d.created_at
       FROM documentos d
       JOIN expedientes e ON e.id = d.expediente_id
       WHERE e.cliente_id = $1 AND d.deleted_at IS NULL
       ORDER BY d.created_at DESC
       LIMIT 50`,
      [clienteId],
    );

    // Obtener notas internas
    const notas = await this.notaInternaRepository.find({
      where: { clienteId },
      relations: ['autor'],
      order: { fecha: 'DESC' },
      take: 50,
    });

    return { tramites, documentos, notas };
  }

  /**
   * Req 9.7 - CRUD de notas internas
   */
  async createNota(clienteId: string, autorId: string, contenido: string): Promise<NotaInterna> {
    await this.findOneOrFail(clienteId);
    const nota = this.notaInternaRepository.create({
      clienteId,
      autorId,
      contenido,
      fecha: new Date(),
    });
    return this.notaInternaRepository.save(nota);
  }

  async getNotas(clienteId: string): Promise<NotaInterna[]> {
    await this.findOneOrFail(clienteId);
    return this.notaInternaRepository.find({
      where: { clienteId },
      relations: ['autor'],
      order: { fecha: 'DESC' },
    });
  }

  async updateNota(notaId: string, contenido: string): Promise<NotaInterna> {
    const nota = await this.notaInternaRepository.findOne({ where: { id: notaId } });
    if (!nota) {
      throw new NotFoundException('Nota interna no encontrada');
    }
    nota.contenido = contenido;
    return this.notaInternaRepository.save(nota);
  }

  async deleteNota(notaId: string): Promise<void> {
    const nota = await this.notaInternaRepository.findOne({ where: { id: notaId } });
    if (!nota) {
      throw new NotFoundException('Nota interna no encontrada');
    }
    await this.notaInternaRepository.softRemove(nota);
  }

  /**
   * Req 9.8 - Etiquetas personalizadas
   */
  async addTag(clienteId: string, tag: string): Promise<Cliente> {
    const cliente = await this.findOneOrFail(clienteId);
    if (!cliente.etiquetas.includes(tag)) {
      cliente.etiquetas = [...cliente.etiquetas, tag];
    }
    return this.clienteRepository.save(cliente);
  }

  async removeTag(clienteId: string, tag: string): Promise<Cliente> {
    const cliente = await this.findOneOrFail(clienteId);
    cliente.etiquetas = cliente.etiquetas.filter((t) => t !== tag);
    return this.clienteRepository.save(cliente);
  }

  /**
   * Obtener un cliente por ID
   */
  async findOne(id: string): Promise<Cliente> {
    return this.findOneOrFail(id);
  }

  private async findOneOrFail(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id },
      relations: ['asesor'],
    });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return cliente;
  }
}
