# Migración Segura MX

Plataforma integral de gestión migratoria compuesta por una aplicación móvil (iOS/Android), un panel administrativo web y una API REST.

## Arquitectura

```
migracion-segura-mx/
├── backend/          # API REST (NestJS + TypeORM + PostgreSQL)
├── admin-panel/      # Panel administrativo (Next.js 14 + Tailwind)
├── mobile-app/       # App móvil (React Native + Expo)
├── packages/         # Paquetes compartidos (tipos, utilidades)
├── infra/            # Infraestructura como código (Terraform/CDK)
└── docker-compose.yml
```

## Stack Tecnológico

| Componente | Tecnología | Costo Año 1 |
|---|---|---|
| Backend | NestJS, TypeORM, PostgreSQL, Redis, Bull Queue | Gratis (Railway) |
| Panel Admin | Next.js 14, React, Tailwind CSS, React Query | Gratis (Vercel) |
| App Móvil | React Native, Expo, React Navigation | N/A |
| Base de Datos | PostgreSQL (Supabase) | Gratis (500MB) |
| Cache/Colas | Redis (Upstash) | Gratis (10K cmd/día) |
| Almacenamiento | Supabase Storage / Cloudflare R2 | Gratis (1-10GB) |
| Email | Resend | Gratis (3K emails/mes) |
| Push Notifications | Firebase Cloud Messaging | Gratis (ilimitado) |
| Auth OAuth | Google + Apple Sign-In | Gratis |
| WhatsApp | Enlace directo wa.me | Gratis |

### Estrategia de Costos

- **Año 1 (0-500 clientes):** ~$0/mes usando free tiers
- **Año 2+ (crecimiento):** Migrar a AWS (~$100-300/mes)
- La arquitectura está diseñada para migrar sin cambios de código significativos

## Requisitos Previos

- Node.js >= 20
- Docker y Docker Compose
- npm >= 10

## Inicio Rápido

### 1. Clonar y configurar

```bash
git clone <repo-url>
cd migracion-segura-mx
cp .env.example .env
```

### 2. Levantar servicios de desarrollo

```bash
docker compose up -d
```

Esto inicia:
- PostgreSQL en `localhost:5432`
- Redis en `localhost:6379`
- MinIO (S3 local) en `localhost:9000` (consola: `localhost:9001`)
- MailHog (email testing) en `localhost:8025`

### 3. Instalar dependencias

```bash
npm install
```

### 4. Iniciar backend

```bash
npm run backend:dev
```

API disponible en `http://localhost:3000`
Documentación Swagger en `http://localhost:3000/docs`

### 5. Iniciar panel administrativo

```bash
npm run admin:dev
```

Panel disponible en `http://localhost:3001`

### 6. Iniciar app móvil

```bash
npm run mobile:start
```

## Scripts Disponibles

| Script | Descripción |
|---|---|
| `npm run backend:dev` | Inicia backend en modo desarrollo |
| `npm run admin:dev` | Inicia panel admin en modo desarrollo |
| `npm run mobile:start` | Inicia app móvil con Expo |
| `npm run docker:up` | Levanta servicios Docker |
| `npm run docker:down` | Detiene servicios Docker |
| `npm run lint` | Ejecuta ESLint en todo el proyecto |
| `npm run format` | Formatea código con Prettier |

## Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

## Licencia

Privado - Todos los derechos reservados.
# Migracion_Segura_MX
