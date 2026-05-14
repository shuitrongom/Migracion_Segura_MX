import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Interfaz abstracta para proveedores de almacenamiento.
 */
export interface StorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

/**
 * Resultado de la validación y subida de archivo.
 */
export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

/**
 * Opciones de subida de archivo.
 */
export interface UploadOptions {
  folder?: string;
  fileName?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/**
 * Proveedor MinIO para desarrollo local.
 * Usa el SDK de S3 ya que MinIO es compatible con la API de S3.
 */
class MinioProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(config: { endpoint: string; accessKey: string; secretKey: string; bucket: string }) {
    this.endpoint = config.endpoint;
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    });
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    const stream = response.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

/**
 * Proveedor Supabase Storage para producción (Año 1).
 * Usa el SDK de S3 ya que Supabase Storage es compatible con S3.
 */
class SupabaseProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly supabaseUrl: string;

  constructor(config: { url: string; serviceKey: string; bucket: string }) {
    this.supabaseUrl = config.url;
    this.bucket = config.bucket;
    // Supabase Storage exposes an S3-compatible endpoint
    const s3Endpoint = `${config.url}/storage/v1/s3`;
    this.client = new S3Client({
      endpoint: s3Endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.serviceKey,
        secretAccessKey: config.serviceKey,
      },
      forcePathStyle: true,
    });
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    const stream = response.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

/**
 * Servicio de almacenamiento con soporte multi-proveedor.
 * Valida archivos (tamaño máximo 20MB, solo PDF/JPG/PNG) y abstrae
 * el proveedor de almacenamiento detrás de una interfaz común.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: StorageProvider;

  constructor(private readonly configService: ConfigService) {
    const storageProvider = this.configService.get<string>('storage.provider', 'minio');

    switch (storageProvider) {
      case 'supabase':
        this.provider = new SupabaseProvider({
          url: this.configService.get<string>('storage.supabase.url', ''),
          serviceKey: this.configService.get<string>('storage.supabase.serviceKey', ''),
          bucket: this.configService.get<string>('storage.supabase.bucket', 'documentos'),
        });
        break;
      case 'minio':
      default:
        this.provider = new MinioProvider({
          endpoint: this.configService.get<string>('storage.minio.endpoint', 'http://localhost:9000'),
          accessKey: this.configService.get<string>('storage.minio.accessKey', 'minioadmin'),
          secretKey: this.configService.get<string>('storage.minio.secretKey', 'minioadmin'),
          bucket: this.configService.get<string>('storage.minio.bucket', 'migracion-segura-documents'),
        });
        break;
    }

    this.logger.log(`Storage provider initialized: ${storageProvider}`);
  }

  /**
   * Valida y sube un archivo al almacenamiento.
   * @throws BadRequestException si el archivo excede 20MB o no es PDF/JPG/PNG
   */
  async upload(
    buffer: Buffer,
    mimeType: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    this.validateFile(buffer, mimeType);

    const extension = this.getExtension(mimeType);
    const fileName = options.fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const folder = options.folder || 'uploads';
    const key = `${folder}/${fileName}.${extension}`;

    const url = await this.provider.upload(key, buffer, mimeType);

    this.logger.log(`File uploaded: ${key} (${buffer.length} bytes)`);

    return {
      key,
      url,
      size: buffer.length,
      mimeType,
    };
  }

  /**
   * Descarga un archivo del almacenamiento.
   */
  async download(key: string): Promise<Buffer> {
    return this.provider.download(key);
  }

  /**
   * Elimina un archivo del almacenamiento.
   */
  async delete(key: string): Promise<void> {
    await this.provider.delete(key);
    this.logger.log(`File deleted: ${key}`);
  }

  /**
   * Genera una URL firmada para acceso temporal al archivo.
   */
  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.provider.getSignedUrl(key, expiresInSeconds);
  }

  /**
   * Valida tamaño y tipo MIME del archivo.
   */
  private validateFile(buffer: Buffer, mimeType: string): void {
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
  }

  /**
   * Obtiene la extensión de archivo según el tipo MIME.
   */
  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
    };
    return map[mimeType] || 'bin';
  }
}
