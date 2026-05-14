# Guía de Despliegue — Migración Segura MX

## Paso 1: Crear cuentas gratuitas (10 minutos)

### 1.1 Supabase (Base de datos + Storage)
1. Ve a https://supabase.com y crea una cuenta con tu email
2. Crea un nuevo proyecto llamado "migracion-segura-mx"
3. Selecciona la región más cercana (us-east-1 o sa-east-1)
4. Anota estos valores del dashboard:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Service Role Key**: (Settings → API → service_role key)
   - **Database URL**: (Settings → Database → Connection string → URI)

### 1.2 Upstash (Redis)
1. Ve a https://upstash.com y crea una cuenta
2. Crea una nueva base de datos Redis
3. Selecciona la región más cercana
4. Anota:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

### 1.3 Resend (Email)
1. Ve a https://resend.com y crea una cuenta
2. Ve a API Keys y crea una nueva
3. Anota:
   - **RESEND_API_KEY**: `re_xxxxxxxxx`

### 1.4 Firebase (Push Notifications)
1. Ve a https://console.firebase.google.com
2. Crea un nuevo proyecto "migracion-segura-mx"
3. Agrega una app Android y una iOS
4. Ve a Project Settings → Service Accounts → Generate new private key
5. Del JSON descargado, anota:
   - **FIREBASE_PROJECT_ID**
   - **FIREBASE_PRIVATE_KEY**
   - **FIREBASE_CLIENT_EMAIL**

### 1.5 Railway (Backend hosting)
1. Ve a https://railway.app y crea una cuenta con GitHub
2. Crea un nuevo proyecto
3. Conecta tu repositorio de GitHub
4. Configura el servicio para que use la carpeta `backend/`
5. Railway detectará automáticamente que es un proyecto Node.js

### 1.6 Vercel (Panel Admin hosting)
1. Ve a https://vercel.com y crea una cuenta con GitHub
2. Importa tu repositorio
3. Configura:
   - Root Directory: `admin-panel`
   - Framework: Next.js
   - Build Command: `npm run build`

---

## Paso 2: Configurar variables de entorno

### En Railway (Backend):

```env
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1
FRONTEND_URL=https://tu-app.vercel.app

# Supabase PostgreSQL
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_de_supabase
DB_SSL=true

# Upstash Redis
REDIS_HOST=xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=tu_password_upstash

# JWT
JWT_SECRET=genera_un_string_aleatorio_de_64_caracteres
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=genera_otro_string_aleatorio_de_64_caracteres
JWT_REFRESH_EXPIRATION=7d

# Resend
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=noreply@tu-dominio.com
EMAIL_FROM_NAME=Migración Segura MX

# Firebase
FIREBASE_PROJECT_ID=migracion-segura-mx
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@migracion-segura-mx.iam.gserviceaccount.com

# Supabase Storage
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_STORAGE_BUCKET=documentos

# Cifrado
DOCUMENT_ENCRYPTION_KEY=genera_un_string_base64_de_32_bytes

# WhatsApp (enlace directo)
WHATSAPP_PHONE_NUMBER=+5215512345678
WHATSAPP_MODE=direct_link

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### En Vercel (Panel Admin):

```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api/v1
```

### En la App Móvil (archivo .env o app.config.js):

```env
EXPO_PUBLIC_API_URL=https://tu-backend.railway.app/api/v1
```

---

## Paso 3: Crear bucket de Storage en Supabase

1. Ve a tu proyecto en Supabase → Storage
2. Crea un nuevo bucket llamado `documentos`
3. Configura como "Private" (los archivos se acceden con signed URLs)

---

## Paso 4: Desplegar

### Backend en Railway:
1. Push tu código a GitHub
2. Railway detectará el cambio y desplegará automáticamente
3. Verifica que el health check funcione: `https://tu-backend.railway.app/api/v1/health`

### Panel Admin en Vercel:
1. Push tu código a GitHub
2. Vercel desplegará automáticamente
3. Verifica en: `https://tu-app.vercel.app`

### App Móvil (desarrollo):
```bash
cd mobile-app
npx expo start
```

Para build de producción (cuando estés listo):
```bash
npx eas build --platform all
```

---

## Paso 5: Verificar que todo funciona

1. ✅ Backend health: `GET /api/v1/health`
2. ✅ Swagger docs: `https://tu-backend.railway.app/docs`
3. ✅ Panel Admin login: `https://tu-app.vercel.app/login`
4. ✅ App Móvil conecta al backend

---

## Generar secretos seguros

Para generar los JWT secrets y encryption keys, usa estos comandos:

```bash
# JWT Secret (64 caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (base64, 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Costos (Año 1)

| Servicio | Plan | Costo |
|---|---|---|
| Supabase | Free | $0/mes (500MB DB, 1GB storage) |
| Upstash | Free | $0/mes (10K comandos/día) |
| Railway | Starter | $0/mes (500 hrs, $5 crédito) |
| Vercel | Hobby | $0/mes |
| Resend | Free | $0/mes (3K emails) |
| Firebase | Spark | $0/mes (ilimitado FCM) |
| **TOTAL** | | **$0/mes** |

---

## Troubleshooting

### El backend no conecta a la base de datos
- Verifica que `DB_SSL=true` esté configurado en Railway
- Verifica que la IP de Railway esté permitida en Supabase (Settings → Database → Network)

### CORS errors en el panel admin
- Verifica que `FRONTEND_URL` en Railway apunte a tu dominio de Vercel exacto

### La app móvil no conecta
- Verifica que `EXPO_PUBLIC_API_URL` apunte al backend correcto
- En desarrollo local, usa la IP de tu máquina (no localhost) para que el emulador conecte
