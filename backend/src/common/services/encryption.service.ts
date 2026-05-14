import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Servicio de cifrado AES-256-GCM para documentos en reposo.
 * Utiliza una clave derivada del secreto configurado en variables de entorno.
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;
  private readonly authTagLength = 16;
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>(
      'ENCRYPTION_SECRET',
      'dev-encryption-secret-change-in-production',
    );
    // Derive a 256-bit key from the secret using scrypt
    this.key = scryptSync(secret, 'migracion-segura-salt', this.keyLength);
  }

  /**
   * Cifra un buffer usando AES-256-GCM.
   * Retorna un buffer con formato: [IV (16 bytes)][AuthTag (16 bytes)][CipherText]
   */
  encrypt(data: Buffer): Buffer {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Concatenar: IV + AuthTag + CipherText
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Descifra un buffer cifrado con el formato: [IV (16 bytes)][AuthTag (16 bytes)][CipherText]
   */
  decrypt(encryptedData: Buffer): Buffer {
    const iv = encryptedData.subarray(0, this.ivLength);
    const authTag = encryptedData.subarray(this.ivLength, this.ivLength + this.authTagLength);
    const cipherText = encryptedData.subarray(this.ivLength + this.authTagLength);

    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(cipherText), decipher.final()]);
  }

  /**
   * Cifra un string y retorna el resultado en base64.
   */
  encryptString(text: string): string {
    const encrypted = this.encrypt(Buffer.from(text, 'utf-8'));
    return encrypted.toString('base64');
  }

  /**
   * Descifra un string en base64 y retorna el texto original.
   */
  decryptString(encryptedBase64: string): string {
    const buffer = Buffer.from(encryptedBase64, 'base64');
    const decrypted = this.decrypt(buffer);
    return decrypted.toString('utf-8');
  }
}
