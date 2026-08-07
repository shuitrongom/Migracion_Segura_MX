import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

/**
 * KeepAlive Service — Previene que Supabase Free pause/elimine el proyecto.
 *
 * Ejecuta una query simple cada 4 horas para mantener la DB activa.
 * Supabase Free pausa proyectos después de 7 días sin actividad.
 * Con este cron, el proyecto NUNCA se pausa mientras Railway esté corriendo.
 */
@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Ping a la base de datos cada 4 horas.
   * Mantiene Supabase Free activo permanentemente.
   */
  @Cron('0 */4 * * *')
  async keepDatabaseAlive() {
    try {
      const result = await this.dataSource.query('SELECT NOW() as alive');
      this.logger.log(`[KeepAlive] ✅ DB alive: ${result?.[0]?.alive}`);
    } catch (error: any) {
      this.logger.error(`[KeepAlive] ❌ DB ping failed: ${error.message}`);
    }
  }

  /**
   * Health check completo cada 12 horas — verifica tablas y usuarios.
   */
  @Cron('0 */12 * * *')
  async fullHealthCheck() {
    try {
      const tables = await this.dataSource.query(
        `SELECT count(*) as total FROM information_schema.tables WHERE table_schema = 'public'`
      );
      const users = await this.dataSource.query(`SELECT count(*) as total FROM users`);
      const tramites = await this.dataSource.query(`SELECT count(*) as total FROM tramites WHERE deleted_at IS NULL`);

      this.logger.log(
        `[HealthCheck] ✅ OK | Tablas: ${tables?.[0]?.total} | Usuarios: ${users?.[0]?.total} | Trámites: ${tramites?.[0]?.total}`
      );
    } catch (error: any) {
      this.logger.error(`[HealthCheck] ❌ Error: ${error.message}`);
    }
  }
}
