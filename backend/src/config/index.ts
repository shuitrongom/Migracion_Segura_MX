import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  name: process.env.DB_NAME || 'migracion_segura',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
  ssl: process.env.DB_SSL === 'true',
}));

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '15m', // 15 minutos - seguridad empresarial
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '4h', // 4 horas - sesión corta
  maxFailedAttempts: 5, // Bloqueo después de 5 intentos
  lockDurationMinutes: 30, // Bloqueo por 30 minutos
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH,
  },
}));

export const storageConfig = registerAs('storage', () => ({
  // Proveedores: 'minio' (local), 'supabase' (año 1), 'r2' (año 1 alt), 's3' (año 2+)
  provider: process.env.STORAGE_PROVIDER || (process.env.NODE_ENV === 'production' ? 'supabase' : 'minio'),
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'documentos',
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME || 'migracion-segura-documents',
    publicUrl: process.env.R2_PUBLIC_URL,
  },
  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET_NAME || 'migracion-segura-documents',
    cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN,
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'migracion-segura-documents',
  },
  maxFileSize: 20 * 1024 * 1024, // 20 MB
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
}));
