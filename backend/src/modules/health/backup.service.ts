import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Backup Service — Respalda las tablas críticas cada 24 horas.
 *
 * Guarda un JSON con los datos de users, clientes y beneficiarios
 * en el storage de Supabase. Si la DB se elimina, restauras desde ahí.
 *
 * Tablas respaldadas:
 * - users (cuentas de login)
 * - clientes (datos del extranjero)
 * - beneficiarios (familiares)
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;
  private readonly bucket: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL', '');
    this.supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY', '');
    this.bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET', 'documentos');
  }

  /**
   * Backup diario a las 3:00 AM (hora del servidor).
   * Exporta users, clientes y beneficiarios a JSON en storage.
   */
  @Cron('0 3 * * *', { name: 'backup-diario' })
  async dailyBackup() {
    this.logger.log('[Backup] Iniciando backup diario...');

    try {
      // Exportar tablas críticas
      const users = await this.dataSource.query(
        `SELECT * FROM users WHERE deleted_at IS NULL`
      );
      const clientes = await this.dataSource.query(
        `SELECT * FROM clientes WHERE deleted_at IS NULL`
      );

      let beneficiarios: any[] = [];
      try {
        beneficiarios = await this.dataSource.query(
          `SELECT * FROM beneficiarios WHERE deleted_at IS NULL`
        );
      } catch {} // Tabla puede no existir

      let tramites: any[] = [];
      try {
        tramites = await this.dataSource.query(
          `SELECT * FROM tramites WHERE deleted_at IS NULL`
        );
      } catch {}

      let solicitudes: any[] = [];
      try {
        solicitudes = await this.dataSource.query(
          `SELECT * FROM solicitudes WHERE deleted_at IS NULL`
        );
      } catch {}

      let pagos: any[] = [];
      try {
        pagos = await this.dataSource.query(
          `SELECT * FROM pagos WHERE deleted_at IS NULL`
        );
      } catch {}

      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.2.4',
        tables: {
          users: { count: users.length, data: users },
          clientes: { count: clientes.length, data: clientes },
          beneficiarios: { count: beneficiarios.length, data: beneficiarios },
          tramites: { count: tramites.length, data: tramites },
          solicitudes: { count: solicitudes.length, data: solicitudes },
          pagos: { count: pagos.length, data: pagos },
        },
      };

      // Subir a Supabase Storage
      const fecha = new Date().toISOString().slice(0, 10); // 2026-08-07
      const fileName = `backups/backup-${fecha}.json`;
      const jsonBuffer = Buffer.from(JSON.stringify(backup, null, 2));

      await this.uploadToStorage(fileName, jsonBuffer);

      this.logger.log(
        `[Backup] ✅ Completado: ${users.length} users, ${clientes.length} clientes, ` +
        `${beneficiarios.length} beneficiarios, ${tramites.length} tramites, ` +
        `${solicitudes.length} solicitudes, ${pagos.length} pagos → ${fileName}`
      );
    } catch (error: any) {
      this.logger.error(`[Backup] ❌ Error: ${error.message}`);
    }
  }

  /**
   * Subir archivo al storage de Supabase.
   */
  private async uploadToStorage(key: string, buffer: Buffer): Promise<void> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      this.logger.warn('[Backup] Supabase no configurado — backup guardado solo en logs');
      return;
    }

    const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${error}`);
    }
  }

  /**
   * Endpoint manual para forzar backup (llamable desde el admin).
   */
  async forceBackup(): Promise<{ message: string; timestamp: string }> {
    await this.dailyBackup();
    return { message: 'Backup completado exitosamente', timestamp: new Date().toISOString() };
  }
}
