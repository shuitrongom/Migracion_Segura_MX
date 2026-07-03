import { registerAs } from '@nestjs/config';

// En producción, validar que las variables críticas existen
function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Variable de entorno requerida en producción: ${key}`);
  }
  return value || '';
}

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: requireEnv('FRONTEND_URL', 'http://localhost:3001'),
}));

export const databaseConfig = registerAs('database', () => ({
  host: requireEnv('DB_HOST', 'localhost'),
  port: parseInt(process.env.DB_PORT || '5432', 10),
  name: requireEnv('DB_NAME', 'migracion_segura'),
  user: requireEnv('DB_USER', 'postgres'),
  password: requireEnv('DB_PASSWORD'),
  ssl: process.env.DB_SSL === 'true',
}));

export const authConfig = registerAs('auth', () => ({
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  maxFailedAttempts: 5,
  lockDurationMinutes: 30,
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
  provider: process.env.STORAGE_PROVIDER || (process.env.NODE_ENV === 'production' ? 'supabase' : 'minio'),
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceKey: requireEnv('SUPABASE_SERVICE_KEY'),
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
