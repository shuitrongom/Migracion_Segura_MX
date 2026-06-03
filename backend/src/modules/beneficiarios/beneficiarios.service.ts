import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficiario } from './entities/beneficiario.entity';

@Injectable()
export class BeneficiariosService {
  constructor(
    @InjectRepository(Beneficiario)
    private readonly beneficiarioRepository: Repository<Beneficiario>,
  ) {}

  /**
   * Crear un nuevo beneficiario para el usuario
   */
  async create(userId: string, data: Partial<Beneficiario>): Promise<Beneficiario> {
    const beneficiario = this.beneficiarioRepository.create({
      ...data,
      userId,
      nombre: data.nombre ? data.nombre.replace(/\b\w/g, c => c.toUpperCase()) : '',
      apellidos: data.apellidos ? data.apellidos.replace(/\b\w/g, c => c.toUpperCase()) : '',
    });
    return this.beneficiarioRepository.save(beneficiario);
  }

  /**
   * Obtener todos los beneficiarios del usuario
   */
  async getByUser(userId: string): Promise<Beneficiario[]> {
    return this.beneficiarioRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener beneficiario por ID (verificando que pertenece al usuario)
   */
  async findOne(id: string, userId: string): Promise<Beneficiario> {
    const beneficiario = await this.beneficiarioRepository.findOne({
      where: { id, userId },
    });
    if (!beneficiario) {
      throw new NotFoundException('Beneficiario no encontrado');
    }
    return beneficiario;
  }

  /**
   * Actualizar beneficiario
   */
  async update(id: string, userId: string, data: Partial<Beneficiario>): Promise<Beneficiario> {
    const beneficiario = await this.findOne(id, userId);
    Object.assign(beneficiario, data);
    if (data.nombre) beneficiario.nombre = data.nombre.replace(/\b\w/g, c => c.toUpperCase());
    if (data.apellidos) beneficiario.apellidos = data.apellidos.replace(/\b\w/g, c => c.toUpperCase());
    return this.beneficiarioRepository.save(beneficiario);
  }

  /**
   * Eliminar beneficiario (soft delete)
   */
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const beneficiario = await this.findOne(id, userId);
    await this.beneficiarioRepository.softRemove(beneficiario);
    return { message: 'Beneficiario eliminado' };
  }

  /**
   * Admin: obtener todos los beneficiarios (para vista en admin panel)
   */
  async findAll(page = 1, limit = 50): Promise<{ data: Beneficiario[]; total: number }> {
    const [data, total] = await this.beneficiarioRepository.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  /**
   * Admin: obtener beneficiarios por userId (ver los extranjeros de una cuenta)
   */
  async findByAccount(userId: string): Promise<Beneficiario[]> {
    return this.beneficiarioRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }
}
