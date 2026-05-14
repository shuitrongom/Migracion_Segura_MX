# Documento de Diseño Técnico: Migración Segura MX

## Visión General

**Migración Segura MX** es una plataforma integral de gestión migratoria compuesta por tres capas principales: una aplicación móvil multiplataforma (React Native) para clientes, un panel administrativo web (Next.js) para el equipo interno, y un backend API REST (Node.js + Express) respaldado por PostgreSQL en infraestructura AWS.

El elemento diferenciador central de la plataforma es el **Módulo de Integración INM**, que actúa como intermediario inteligente entre el usuario y el portal oficial del Instituto Nacional de Migración de México (https://www.inm.gob.mx/mpublic/publico/inm-tramites.html). Este módulo embebe el micrositio del INM dentro de la app mediante WebView con JavaScript Bridge, permitiendo consultar requisitos, verificar estatus de trámites, agendar citas y descargar documentos oficiales sin salir de la aplicación, almacenando todos los resultados localmente para acceso offline.

La plataforma atiende a tres tipos de usuarios: **Clientes** (migrantes que gestionan sus trámites), **Asesores** (empleados que gestionan casos) y **Administradores** (con acceso total al sistema).

---

## 1. Arquitectura General del Sistema

### 1.1 Diagrama de Arquitectura

```mermaid
graph TB
    subgraph "Clientes"
        APP[App Móvil<br/>React Native<br/>iOS / Android]
        BROWSER[Navegador Web<br/>Panel Admin]
    end

    subgraph "CDN / Edge"
        CF[AWS CloudFront<br/>CDN]
    end

    subgraph "Frontend"
        ADMIN[Panel Admin<br/>Next.js + React<br/>AWS Amplify / S3]
    end

    subgraph "API Gateway"
        APIGW[AWS API Gateway<br/>+ WAF]
    end

    subgraph "Backend - ECS Fargate"
        API[API REST<br/>Node.js + Express]
        AUTH[Servicio Auth<br/>JWT + OAuth2]
        NOTIF[Motor Notificaciones<br/>FCM + Twilio + SendGrid]
        AUTO[Motor Automatizaciones<br/>Bull Queue + Redis]
        INM[Módulo INM<br/>WebView Bridge + Scraper]
        DOCS[Gestor Documentos<br/>S3 + Validación]
        FIN[Módulo Financiero<br/>Pagos + Recibos]
    end

    subgraph "Base de Datos"
        PG[(PostgreSQL<br/>AWS RDS)]
        REDIS[(Redis<br/>Cache + Queues)]
    end

    subgraph "Almacenamiento"
        S3[AWS S3<br/>Documentos cifrados]
    end

    subgraph "Servicios Externos"
        GOOGLE[Google OAuth2<br/>+ Calendar API]
        APPLE[Apple Sign In]
        FCM[Firebase Cloud<br/>Messaging]
        TWILIO[Twilio<br/>SMS + WhatsApp]
        SENDGRID[SendGrid<br/>Email]
        DOCUSIGN[DocuSign<br/>Firma Electrónica]
        INM_PORTAL[Portal INM<br/>inm.gob.mx]
    end

    APP --> CF
    BROWSER --> CF
    CF --> ADMIN
    CF --> APIGW
    APIGW --> API
    API --> AUTH
    API --> NOTIF
    API --> AUTO
    API --> INM
    API --> DOCS
    API --> FIN
    API --> PG
    API --> REDIS
    DOCS --> S3
    INM --> INM_PORTAL
    NOTIF --> FCM
    NOTIF --> TWILIO
    NOTIF --> SENDGRID
    AUTH --> GOOGLE
    AUTH --> APPLE
    FIN --> DOCUSIGN
```

### 1.2 Principios de Diseño

- **Separación de responsabilidades**: Cada servicio del backend tiene una responsabilidad única y bien definida.
- **Seguridad por defecto**: TLS 1.3 en tránsito, AES-256 en reposo, JWT con expiración de 24h.
- **Offline-first en móvil**: La app almacena datos localmente (SQLite/AsyncStorage) y sincroniza al recuperar conexión.
- **Integración no invasiva con INM**: WebView embebido con JavaScript Bridge; sin modificar el portal del INM.
- **Escalabilidad horizontal**: Contenedores ECS Fargate con auto-scaling basado en métricas de CPU/memoria.
- **Observabilidad**: Logs centralizados en AWS CloudWatch, trazas distribuidas con AWS X-Ray.

---

## 2. Módulo de Integración INM (Componente Central)

Este es el módulo más crítico y diferenciador de la plataforma. Permite que la app actúe como intermediario inteligente entre el usuario y el portal oficial del INM.

### 2.1 Arquitectura del Módulo INM

```mermaid
graph TD
    subgraph "App Móvil - React Native"
        UI[Pantalla INM<br/>React Native UI]
        WV[WebView Embebido<br/>react-native-webview]
        BRIDGE[JavaScript Bridge<br/>postMessage / onMessage]
        LOCAL[Almacenamiento Local<br/>SQLite + AsyncStorage]
        PREFILL[Pre-llenado de Formularios<br/>Datos del perfil del usuario]
    end

    subgraph "Portal INM"
        INM_HOME[inm.gob.mx<br/>Micrositio Público]
        INM_REQ[Consulta de Requisitos<br/>por tipo de trámite]
        INM_STATUS[Consulta de Estatus<br/>número de pieza + contraseña]
        INM_CITA[Generación de Cita<br/>32 oficinas del INM]
        INM_REG[Registro de Trámite<br/>ante el INM]
        INM_FMM[Descarga FMMd<br/>Forma Migratoria Múltiple]
    end

    subgraph "Backend - Módulo INM"
        INM_SVC[INM Service<br/>Node.js]
        INM_CACHE[Cache de Requisitos<br/>Redis - TTL 24h]
        INM_LOG[Log de Interacciones<br/>PostgreSQL]
    end

    UI --> WV
    WV <--> BRIDGE
    BRIDGE --> LOCAL
    BRIDGE --> INM_SVC
    WV --> INM_HOME
    INM_HOME --> INM_REQ
    INM_HOME --> INM_STATUS
    INM_HOME --> INM_CITA
    INM_HOME --> INM_REG
    INM_HOME --> INM_FMM
    INM_SVC --> INM_CACHE
    INM_SVC --> INM_LOG
    PREFILL --> WV
```

### 2.2 Flujo de Integración INM Paso a Paso

#### Flujo 1: Consulta de Requisitos por Tipo de Trámite

```mermaid
sequenceDiagram
    participant U as Usuario
    participant APP as App Móvil
    participant WV as WebView
    participant INM as Portal INM
    participant CACHE as Redis Cache
    participant DB as PostgreSQL

    U->>APP: Selecciona tipo de trámite
    APP->>CACHE: ¿Requisitos en caché? (TTL 24h)
    alt Datos en caché
        CACHE-->>APP: Retorna requisitos cacheados
        APP-->>U: Muestra requisitos (modo rápido)
    else Sin caché
        APP->>WV: Abre WebView con URL INM
        WV->>INM: GET /inm-tramites.html
        INM-->>WV: HTML del micrositio
        WV->>WV: JavaScript Bridge extrae requisitos
        WV-->>APP: postMessage con datos JSON
        APP->>CACHE: Almacena requisitos (TTL 24h)
        APP->>DB: Guarda snapshot de requisitos
        APP-->>U: Muestra requisitos extraídos
    end
```

#### Flujo 2: Consulta de Estatus de Trámite

```mermaid
sequenceDiagram
    participant U as Usuario
    participant APP as App Móvil
    participant WV as WebView
    participant INM as Portal INM
    participant DB as PostgreSQL

    U->>APP: Ingresa número de pieza + contraseña
    APP->>WV: Abre WebView oculto con URL de estatus INM
    WV->>INM: Navega a formulario de consulta
    WV->>WV: JS Bridge inyecta número de pieza y contraseña
    WV->>INM: Envía formulario de consulta
    INM-->>WV: Página de resultado con estatus
    WV->>WV: JS Bridge extrae datos de estatus
    WV-->>APP: postMessage con estatus JSON
    APP->>DB: Guarda estatus consultado con timestamp
    APP-->>U: Muestra línea de tiempo del trámite
```

#### Flujo 3: Generación de Cita ante el INM

```mermaid
sequenceDiagram
    participant U as Usuario
    participant APP as App Móvil
    participant WV as WebView
    participant INM as Portal INM
    participant DB as PostgreSQL
    participant NOTIF as Motor Notificaciones

    U->>APP: Solicita agendar cita INM
    APP->>APP: Pre-llena datos del perfil del usuario
    APP->>WV: Abre WebView con formulario de citas INM
    WV->>INM: Navega a módulo de citas
    WV->>WV: JS Bridge inyecta datos pre-llenados
    U->>WV: Selecciona oficina, fecha y hora disponibles
    U->>WV: Confirma cita
    WV->>INM: Envía solicitud de cita
    INM-->>WV: Confirmación con folio de cita
    WV->>WV: JS Bridge extrae folio y detalles
    WV-->>APP: postMessage con datos de cita confirmada
    APP->>DB: Guarda cita con folio INM
    APP->>NOTIF: Solicita envío de confirmación
    NOTIF-->>U: Push + Email + WhatsApp con detalles de cita
    APP-->>U: Muestra confirmación con folio INM
```

### 2.3 Implementación del JavaScript Bridge

```typescript
// INMWebViewBridge.ts - React Native
import { WebView } from 'react-native-webview';

interface INMBridgeMessage {
  type: 'REQUISITOS' | 'ESTATUS' | 'CITA_CONFIRMADA' | 'FMM_DESCARGADO' | 'ERROR';
  payload: Record<string, unknown>;
  timestamp: string;
}

// Script inyectado en el WebView del INM
const INM_INJECTION_SCRIPT = `
  (function() {
    // Observador de mutaciones para detectar cambios en el DOM del INM
    const observer = new MutationObserver(function(mutations) {
      const statusElement = document.querySelector('.estatus-tramite');
      const reqElement = document.querySelector('.requisitos-lista');
      const citaElement = document.querySelector('.confirmacion-cita');
      
      if (statusElement) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ESTATUS',
          payload: {
            estatus: statusElement.textContent.trim(),
            etapas: extractEtapas(),
            observaciones: extractObservaciones()
          },
          timestamp: new Date().toISOString()
        }));
      }
      
      if (reqElement) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REQUISITOS',
          payload: { requisitos: extractRequisitos() },
          timestamp: new Date().toISOString()
        }));
      }
      
      if (citaElement) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CITA_CONFIRMADA',
          payload: extractDatosCita(),
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    function extractEtapas() {
      const etapas = [];
      document.querySelectorAll('.timeline-step').forEach(el => {
        etapas.push({
          nombre: el.querySelector('.step-name')?.textContent?.trim(),
          completada: el.classList.contains('completed'),
          fecha: el.querySelector('.step-date')?.textContent?.trim()
        });
      });
      return etapas;
    }
    
    function extractRequisitos() {
      const requisitos = [];
      document.querySelectorAll('.requisito-item').forEach(el => {
        requisitos.push({
          nombre: el.querySelector('.req-nombre')?.textContent?.trim(),
          descripcion: el.querySelector('.req-desc')?.textContent?.trim(),
          obligatorio: el.classList.contains('obligatorio')
        });
      });
      return requisitos;
    }
    
    function extractObservaciones() {
      const obs = [];
      document.querySelectorAll('.observacion-item').forEach(el => {
        obs.push(el.textContent.trim());
      });
      return obs;
    }
    
    function extractDatosCita() {
      return {
        folio: document.querySelector('.folio-cita')?.textContent?.trim(),
        oficina: document.querySelector('.oficina-nombre')?.textContent?.trim(),
        fecha: document.querySelector('.cita-fecha')?.textContent?.trim(),
        hora: document.querySelector('.cita-hora')?.textContent?.trim(),
        direccion: document.querySelector('.oficina-direccion')?.textContent?.trim()
      };
    }
  })();
`;

// Pre-llenado de formularios INM con datos del usuario
const generatePrefillScript = (userData: UserProfile): string => `
  (function() {
    function waitForElement(selector, callback, maxAttempts = 20) {
      let attempts = 0;
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el || attempts >= maxAttempts) {
          clearInterval(interval);
          if (el) callback(el);
        }
        attempts++;
      }, 500);
    }
    
    // Pre-llenar nombre
    waitForElement('input[name="nombre"]', el => { el.value = '${userData.nombre}'; });
    waitForElement('input[name="apellidoPaterno"]', el => { el.value = '${userData.apellidoPaterno}'; });
    waitForElement('input[name="apellidoMaterno"]', el => { el.value = '${userData.apellidoMaterno}'; });
    waitForElement('input[name="email"]', el => { el.value = '${userData.email}'; });
    waitForElement('input[name="telefono"]', el => { el.value = '${userData.telefono}'; });
    waitForElement('input[name="nacionalidad"]', el => { el.value = '${userData.nacionalidad}'; });
    waitForElement('input[name="numeroPieza"]', el => { el.value = '${userData.numeroPieza || ""}'; });
  })();
`;
```

### 2.4 Almacenamiento Local de Datos INM

```typescript
// INMLocalStorage.ts - Esquema SQLite en React Native
interface INMLocalRecord {
  id: string;
  userId: string;
  tipo: 'REQUISITOS' | 'ESTATUS' | 'CITA' | 'FMM';
  tramiteId?: string;
  numeroPieza?: string;
  datos: string; // JSON serializado
  fuenteUrl: string;
  capturedAt: string; // ISO timestamp
  syncedAt?: string;
}

// Tabla SQLite: inm_records
const CREATE_INM_TABLE = `
  CREATE TABLE IF NOT EXISTS inm_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    tramite_id TEXT,
    numero_pieza TEXT,
    datos TEXT NOT NULL,
    fuente_url TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    synced_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_inm_user ON inm_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_inm_tipo ON inm_records(tipo);
  CREATE INDEX IF NOT EXISTS idx_inm_pieza ON inm_records(numero_pieza);
`;
```

---

## 3. Modelo de Datos

### 3.1 Diagrama Entidad-Relación

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string telefono
        string nombre_completo
        string foto_url
        enum rol "cliente|asesor|administrador"
        boolean email_verificado
        boolean telefono_verificado
        boolean two_fa_habilitado
        string two_fa_secreto
        int intentos_fallidos
        timestamp bloqueado_hasta
        timestamp created_at
        timestamp updated_at
    }

    TRAMITES {
        uuid id PK
        uuid cliente_id FK
        uuid asesor_id FK
        string numero_pieza UK
        string contrasena_tramite
        enum tipo "residencia_temporal|residencia_permanente|regularizacion|cambio_condicion|visa|nacionalidad|permiso_trabajo|renovacion"
        enum estatus "borrador|recibido|en_revision|en_espera|aprobado|rechazado"
        int porcentaje_progreso
        date fecha_limite
        int tiempo_estimado_dias
        jsonb datos_formulario
        timestamp created_at
        timestamp updated_at
    }

    ETAPAS_TRAMITE {
        uuid id PK
        uuid tramite_id FK
        string nombre
        string descripcion
        boolean completada
        string observaciones
        uuid completada_por FK
        timestamp completada_at
        int orden
    }

    DOCUMENTOS {
        uuid id PK
        uuid tramite_id FK
        uuid subido_por FK
        string nombre
        string tipo_documento
        string s3_key
        string s3_url
        bigint tamano_bytes
        enum formato "pdf|jpg|png"
        enum estatus "pendiente|recibido|en_revision|aprobado|rechazado"
        string razon_rechazo
        date fecha_vencimiento
        boolean alerta_vencimiento_enviada
        uuid revisado_por FK
        timestamp revisado_at
        timestamp created_at
    }

    CITAS {
        uuid id PK
        uuid cliente_id FK
        uuid asesor_id FK
        uuid tramite_id FK
        timestamp fecha_hora
        int duracion_minutos
        enum modalidad "presencial|videollamada"
        enum estatus "programada|confirmada|cancelada|completada"
        string google_event_id
        string folio_inm
        string notas
        timestamp created_at
        timestamp updated_at
    }

    TICKETS {
        uuid id PK
        uuid cliente_id FK
        uuid asesor_id FK
        uuid tramite_id FK
        string asunto
        enum estatus "abierto|en_atencion|cerrado"
        enum prioridad "baja|media|alta"
        timestamp created_at
        timestamp updated_at
    }

    MENSAJES_TICKET {
        uuid id PK
        uuid ticket_id FK
        uuid autor_id FK
        text contenido
        boolean es_interno
        timestamp created_at
    }

    PAGOS {
        uuid id PK
        uuid cliente_id FK
        uuid tramite_id FK
        uuid registrado_por FK
        decimal monto
        enum metodo "transferencia|tarjeta|efectivo"
        string concepto
        string recibo_s3_key
        date fecha_pago
        timestamp created_at
    }

    NOTIFICACIONES {
        uuid id PK
        uuid usuario_id FK
        string titulo
        text contenido
        enum canal "push|email|whatsapp"
        enum tipo "cambio_estatus|documento_rechazado|cita_proxima|pago_pendiente|mensaje_asesor|vencimiento_doc"
        boolean leida
        enum resultado_envio "pendiente|entregado|fallido"
        timestamp enviada_at
        timestamp leida_at
    }

    INM_RECORDS {
        uuid id PK
        uuid usuario_id FK
        uuid tramite_id FK
        enum tipo "requisitos|estatus|cita|fmm"
        string numero_pieza
        jsonb datos
        string fuente_url
        timestamp captured_at
        timestamp synced_at
    }

    AUTOMATIZACIONES_LOG {
        uuid id PK
        uuid usuario_id FK
        string flujo
        enum canal "email|whatsapp|push"
        enum resultado "entregado|fallido"
        text mensaje
        timestamp ejecutado_at
    }

    ACTIVITY_LOG {
        uuid id PK
        uuid usuario_id FK
        string accion
        string recurso
        string recurso_id
        string ip_address
        jsonb metadata
        timestamp created_at
    }

    USERS ||--o{ TRAMITES : "cliente_id"
    USERS ||--o{ TRAMITES : "asesor_id"
    TRAMITES ||--o{ ETAPAS_TRAMITE : "tramite_id"
    TRAMITES ||--o{ DOCUMENTOS : "tramite_id"
    TRAMITES ||--o{ CITAS : "tramite_id"
    TRAMITES ||--o{ TICKETS : "tramite_id"
    TRAMITES ||--o{ PAGOS : "tramite_id"
    TRAMITES ||--o{ INM_RECORDS : "tramite_id"
    USERS ||--o{ CITAS : "cliente_id"
    USERS ||--o{ TICKETS : "cliente_id"
    TICKETS ||--o{ MENSAJES_TICKET : "ticket_id"
    USERS ||--o{ NOTIFICACIONES : "usuario_id"
    USERS ||--o{ INM_RECORDS : "usuario_id"
    USERS ||--o{ ACTIVITY_LOG : "usuario_id"
```

### 3.2 Definición de Tipos Principales

```typescript
// types/domain.ts

type Rol = 'cliente' | 'asesor' | 'administrador';

type TipoTramite =
  | 'residencia_temporal'
  | 'residencia_permanente'
  | 'regularizacion'
  | 'cambio_condicion'
  | 'visa'
  | 'nacionalidad'
  | 'permiso_trabajo'
  | 'renovacion';

type EstatusTramite =
  | 'borrador'
  | 'recibido'
  | 'en_revision'
  | 'en_espera'
  | 'aprobado'
  | 'rechazado';

type EstatusDocumento = 'pendiente' | 'recibido' | 'en_revision' | 'aprobado' | 'rechazado';

interface User {
  id: string;
  email: string;
  telefono: string;
  nombreCompleto: string;
  fotoUrl?: string;
  rol: Rol;
  emailVerificado: boolean;
  telefonoVerificado: boolean;
  twoFaHabilitado: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Tramite {
  id: string;
  clienteId: string;
  asesorId?: string;
  numeroPieza: string;
  contrasenaTramite: string;
  tipo: TipoTramite;
  estatus: EstatusTramite;
  porcentajeProgreso: number; // 0-100
  fechaLimite?: Date;
  tiempoEstimadoDias?: number;
  datosFormulario: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Documento {
  id: string;
  tramiteId: string;
  subidoPor: string;
  nombre: string;
  tipoDocumento: string;
  s3Key: string;
  s3Url: string;
  tamanoByte: number;
  formato: 'pdf' | 'jpg' | 'png';
  estatus: EstatusDocumento;
  razonRechazo?: string;
  fechaVencimiento?: Date;
  revisadoPor?: string;
  revisadoAt?: Date;
  createdAt: Date;
}

interface Cita {
  id: string;
  clienteId: string;
  asesorId: string;
  tramiteId?: string;
  fechaHora: Date;
  duracionMinutos: number;
  modalidad: 'presencial' | 'videollamada';
  estatus: 'programada' | 'confirmada' | 'cancelada' | 'completada';
  googleEventId?: string;
  folioInm?: string;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface INMRecord {
  id: string;
  usuarioId: string;
  tramiteId?: string;
  tipo: 'requisitos' | 'estatus' | 'cita' | 'fmm';
  numeroPieza?: string;
  datos: Record<string, unknown>;
  fuenteUrl: string;
  capturedAt: Date;
  syncedAt?: Date;
}
```

---

## 4. Diseño de la API REST

### 4.1 Convenciones

- Base URL: `https://api.migracionmx.com/v1`
- Autenticación: `Authorization: Bearer <JWT>`
- Formato: JSON
- Paginación: `?page=1&limit=20`
- Errores: `{ "error": { "code": "ERROR_CODE", "message": "...", "details": {} } }`

### 4.2 Endpoints Principales

#### Autenticación

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/auth/register` | Registro con email + teléfono | Público |
| POST | `/auth/verify-code` | Verificar código OTP | Público |
| POST | `/auth/login` | Login email + contraseña | Público |
| POST | `/auth/login/google` | Login con Google OAuth2 | Público |
| POST | `/auth/login/apple` | Login con Apple ID | Público |
| POST | `/auth/refresh` | Renovar JWT | Autenticado |
| POST | `/auth/logout` | Cerrar sesión | Autenticado |
| POST | `/auth/forgot-password` | Solicitar reset de contraseña | Público |
| POST | `/auth/reset-password` | Aplicar nueva contraseña | Público |
| POST | `/auth/2fa/enable` | Habilitar 2FA | Autenticado |
| POST | `/auth/2fa/verify` | Verificar código 2FA | Autenticado |

#### Usuarios y Perfil

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/users/me` | Obtener perfil propio | Autenticado |
| PUT | `/users/me` | Actualizar perfil | Autenticado |
| GET | `/users` | Listar usuarios | Asesor, Admin |
| GET | `/users/:id` | Obtener usuario por ID | Asesor, Admin |
| PUT | `/users/:id` | Actualizar usuario | Admin |
| DELETE | `/users/:id` | Desactivar usuario | Admin |

#### Trámites

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/tramites` | Crear nuevo trámite | Cliente, Asesor |
| GET | `/tramites` | Listar trámites | Asesor, Admin |
| GET | `/tramites/mis-tramites` | Trámites del cliente autenticado | Cliente |
| GET | `/tramites/:id` | Detalle de trámite | Autenticado |
| PUT | `/tramites/:id` | Actualizar trámite | Asesor, Admin |
| PUT | `/tramites/:id/estatus` | Cambiar estatus | Asesor, Admin |
| GET | `/tramites/:id/etapas` | Línea de tiempo del trámite | Autenticado |
| POST | `/tramites/:id/etapas` | Agregar etapa/observación | Asesor, Admin |
| GET | `/tramites/consulta-publica` | Consulta por número de pieza (sin auth) | Público |

#### Documentos

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/tramites/:id/documentos` | Subir documento | Cliente, Asesor |
| GET | `/tramites/:id/documentos` | Listar documentos del trámite | Autenticado |
| GET | `/documentos/:id` | Obtener documento | Autenticado |
| PUT | `/documentos/:id/revisar` | Aprobar/rechazar documento | Asesor, Admin |
| GET | `/documentos/:id/download` | URL firmada de descarga S3 | Autenticado |
| GET | `/tramites/:id/documentos/zip` | Descarga masiva ZIP | Asesor, Admin |

#### Citas

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/citas` | Crear cita | Asesor, Admin |
| GET | `/citas` | Listar citas | Asesor, Admin |
| GET | `/citas/mis-citas` | Citas del cliente | Cliente |
| GET | `/citas/:id` | Detalle de cita | Autenticado |
| PUT | `/citas/:id` | Reagendar cita | Asesor, Admin |
| DELETE | `/citas/:id` | Cancelar cita | Asesor, Admin |

#### Módulo INM

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/inm/requisitos/:tipo-tramite` | Requisitos por tipo (con caché) | Autenticado |
| POST | `/inm/estatus` | Guardar estatus consultado | Autenticado |
| POST | `/inm/citas` | Guardar cita INM confirmada | Autenticado |
| GET | `/inm/records/:tramiteId` | Historial de consultas INM | Autenticado |
| POST | `/inm/fmm` | Guardar FMMd descargado | Autenticado |

#### Tickets de Soporte

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/tickets` | Abrir ticket | Cliente |
| GET | `/tickets` | Listar tickets | Asesor, Admin |
| GET | `/tickets/mis-tickets` | Tickets del cliente | Cliente |
| GET | `/tickets/:id` | Detalle de ticket | Autenticado |
| POST | `/tickets/:id/mensajes` | Enviar mensaje en ticket | Autenticado |
| PUT | `/tickets/:id/cerrar` | Cerrar ticket | Asesor, Admin |

#### Módulo Financiero

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/pagos` | Registrar pago | Asesor, Admin |
| GET | `/pagos` | Listar pagos | Asesor, Admin |
| GET | `/pagos/:clienteId` | Pagos de un cliente | Asesor, Admin |
| GET | `/pagos/:id/recibo` | Descargar recibo PDF | Autenticado |
| GET | `/reportes/financiero` | Reporte mensual de ingresos | Admin |

#### Dashboard y Reportes

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/dashboard/admin` | Métricas del dashboard admin | Admin |
| GET | `/reportes/asesores` | Rendimiento por asesor | Admin |
| GET | `/reportes/tramites` | Tiempos por tipo de trámite | Admin |
| GET | `/reportes/documentos-pendientes` | Documentos faltantes | Asesor, Admin |
| GET | `/reportes/conversion` | Conversión de clientes | Admin |

### 4.3 Estructura de Respuestas

```typescript
// Respuesta exitosa paginada
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Respuesta de error
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Ejemplo: POST /tramites
// Request
interface CreateTramiteRequest {
  tipo: TipoTramite;
  datosFormulario: Record<string, unknown>;
  documentos?: File[];
}

// Response 201
interface CreateTramiteResponse {
  data: {
    tramite: Tramite;
    numeroPieza: string;
    documentosRequeridos: string[];
  };
}
```

---

## 5. Arquitectura de la App Móvil (React Native)

### 5.1 Estructura de Navegación

```mermaid
graph TD
    ROOT[Root Navigator]
    AUTH[Auth Stack]
    MAIN[Main Tab Navigator]
    
    ROOT --> AUTH
    ROOT --> MAIN
    
    AUTH --> LOGIN[Login Screen]
    AUTH --> REGISTER[Register Screen]
    AUTH --> VERIFY[Verify Code Screen]
    AUTH --> FORGOT[Forgot Password Screen]
    
    MAIN --> TAB1[Inicio Tab]
    MAIN --> TAB2[Trámite Tab]
    MAIN --> TAB3[Documentos Tab]
    MAIN --> TAB4[Perfil Tab]
    
    TAB1 --> DASHBOARD[Dashboard Screen]
    TAB1 --> NOTIF_CENTER[Centro de Notificaciones]
    
    TAB2 --> TRAMITE_LIST[Lista de Trámites]
    TAB2 --> TRAMITE_DETAIL[Detalle de Trámite]
    TAB2 --> TRAMITE_NEW[Nuevo Trámite]
    TAB2 --> INM_MODULE[Módulo INM]
    
    INM_MODULE --> INM_REQUISITOS[Consulta Requisitos]
    INM_MODULE --> INM_ESTATUS[Consulta Estatus]
    INM_MODULE --> INM_CITA[Agendar Cita INM]
    INM_MODULE --> INM_FMM[Descargar FMMd]
    INM_MODULE --> INM_WEBVIEW[WebView INM]
    
    TAB3 --> DOC_LIST[Lista Documentos]
    TAB3 --> DOC_UPLOAD[Subir Documento]
    TAB3 --> DOC_VIEWER[Visor de Documento]
    
    TAB4 --> PROFILE[Perfil Screen]
    TAB4 --> SETTINGS[Configuración]
    TAB4 --> SUPPORT[Soporte]
    TAB4 --> TICKETS[Mis Tickets]
```

### 5.2 Estructura de Directorios

```
src/
├── api/                    # Clientes HTTP (axios)
│   ├── auth.api.ts
│   ├── tramites.api.ts
│   ├── documentos.api.ts
│   ├── inm.api.ts
│   └── index.ts
├── components/             # Componentes reutilizables
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ProgressBar.tsx
│   ├── tramite/
│   │   ├── TramiteCard.tsx
│   │   ├── EtapaTimeline.tsx
│   │   └── DocumentoItem.tsx
│   └── inm/
│       ├── INMWebView.tsx
│       ├── INMBridge.tsx
│       └── CitaINMCard.tsx
├── screens/                # Pantallas
│   ├── auth/
│   ├── dashboard/
│   ├── tramites/
│   ├── documentos/
│   ├── inm/
│   ├── soporte/
│   └── perfil/
├── navigation/             # Configuración de navegación
│   ├── AuthStack.tsx
│   ├── MainTabNavigator.tsx
│   └── RootNavigator.tsx
├── store/                  # Estado global (Zustand)
│   ├── auth.store.ts
│   ├── tramites.store.ts
│   ├── documentos.store.ts
│   └── inm.store.ts
├── hooks/                  # Custom hooks
│   ├── useAuth.ts
│   ├── useTramite.ts
│   ├── useINMBridge.ts
│   └── useOfflineSync.ts
├── services/               # Servicios locales
│   ├── sqlite.service.ts   # Base de datos local
│   ├── notifications.service.ts
│   ├── sync.service.ts     # Sincronización offline
│   └── inm-bridge.service.ts
├── utils/
│   ├── validators.ts
│   ├── formatters.ts
│   └── constants.ts
└── theme/                  # Diseño visual
    ├── colors.ts           # #1A1A2E, #16213E, #C9A84C, #F5E6C8
    ├── typography.ts
    └── spacing.ts
```

### 5.3 Paleta de Colores y Tema Visual

```typescript
// theme/colors.ts
export const Colors = {
  // Fondos oscuros
  background: {
    primary: '#1A1A2E',    // Fondo principal
    secondary: '#16213E',  // Fondo secundario / cards
    surface: '#0F3460',    // Superficies elevadas
  },
  // Acentos dorados
  accent: {
    gold: '#C9A84C',       // Dorado principal - CTAs, iconos activos
    goldLight: '#F5E6C8',  // Dorado claro - textos secundarios
    goldDark: '#A07830',   // Dorado oscuro - estados pressed
  },
  // Texto
  text: {
    primary: '#FFFFFF',
    secondary: '#F5E6C8',
    muted: '#8892A4',
  },
  // Estados
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  // Trámite estatus
  tramite: {
    borrador: '#8892A4',
    recibido: '#2196F3',
    en_revision: '#FF9800',
    en_espera: '#9C27B0',
    aprobado: '#4CAF50',
    rechazado: '#F44336',
  }
};
```

### 5.4 Gestión de Estado (Zustand)

```typescript
// store/tramites.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TramitesStore {
  tramites: Tramite[];
  tramiteActivo: Tramite | null;
  inmRecords: INMRecord[];
  isLoading: boolean;
  lastSyncAt: Date | null;
  
  // Acciones
  fetchTramites: () => Promise<void>;
  setTramiteActivo: (tramite: Tramite) => void;
  updateEstatus: (tramiteId: string, estatus: EstatusTramite) => void;
  addINMRecord: (record: INMRecord) => void;
  syncPendingData: () => Promise<void>;
}

const useTramitesStore = create<TramitesStore>()(
  persist(
    (set, get) => ({
      tramites: [],
      tramiteActivo: null,
      inmRecords: [],
      isLoading: false,
      lastSyncAt: null,
      
      fetchTramites: async () => {
        set({ isLoading: true });
        try {
          const tramites = await tramitesApi.getMisTramites();
          set({ tramites, lastSyncAt: new Date() });
        } finally {
          set({ isLoading: false });
        }
      },
      
      setTramiteActivo: (tramite) => set({ tramiteActivo: tramite }),
      
      updateEstatus: (tramiteId, estatus) =>
        set(state => ({
          tramites: state.tramites.map(t =>
            t.id === tramiteId ? { ...t, estatus } : t
          )
        })),
      
      addINMRecord: (record) =>
        set(state => ({ inmRecords: [...state.inmRecords, record] })),
      
      syncPendingData: async () => {
        const { inmRecords } = get();
        const unsynced = inmRecords.filter(r => !r.syncedAt);
        for (const record of unsynced) {
          await inmApi.syncRecord(record);
        }
      }
    }),
    { name: 'tramites-storage' }
  )
);
```

### 5.5 Modo Offline

```typescript
// hooks/useOfflineSync.ts
import NetInfo from '@react-native-community/netinfo';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const { syncPendingData } = useTramitesStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      const nowOnline = state.isConnected && state.isInternetReachable;
      
      setIsOnline(!!nowOnline);
      
      // Al recuperar conexión, sincronizar datos pendientes
      if (wasOffline && nowOnline) {
        syncPendingData();
      }
    });
    
    return unsubscribe;
  }, [isOnline]);

  return { isOnline };
};
```

---

## 6. Arquitectura del Panel Administrativo (Next.js)

### 6.1 Estructura de Páginas

```
app/                        # Next.js App Router
├── (auth)/
│   ├── login/page.tsx
│   └── layout.tsx
├── (admin)/
│   ├── layout.tsx          # Sidebar + Header
│   ├── dashboard/page.tsx  # KPIs y métricas
│   ├── clientes/
│   │   ├── page.tsx        # Lista de clientes
│   │   └── [id]/page.tsx   # Detalle de cliente
│   ├── tramites/
│   │   ├── page.tsx        # Lista de trámites
│   │   └── [id]/page.tsx   # Detalle de trámite
│   ├── documentos/
│   │   └── page.tsx        # Control documental
│   ├── agenda/
│   │   └── page.tsx        # Calendario de citas
│   ├── soporte/
│   │   ├── page.tsx        # Lista de tickets
│   │   └── [id]/page.tsx   # Detalle de ticket
│   ├── financiero/
│   │   ├── page.tsx        # Registro de pagos
│   │   └── reportes/page.tsx
│   ├── reportes/page.tsx   # Reportes operativos
│   ├── automatizaciones/page.tsx
│   └── configuracion/page.tsx
└── api/                    # API Routes Next.js (proxy al backend)
    └── [...path]/route.ts
```

### 6.2 Componentes del Panel Admin

```typescript
// components/layout/AdminSidebar.tsx
// Sidebar oscuro (#1A1A2E) con iconos y navegación

const SIDEBAR_ITEMS = [
  { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { icon: 'people', label: 'Clientes', href: '/clientes' },
  { icon: 'folder', label: 'Trámites', href: '/tramites' },
  { icon: 'description', label: 'Documentos', href: '/documentos' },
  { icon: 'calendar', label: 'Agenda', href: '/agenda' },
  { icon: 'support', label: 'Soporte', href: '/soporte' },
  { icon: 'payments', label: 'Financiero', href: '/financiero' },
  { icon: 'bar_chart', label: 'Reportes', href: '/reportes' },
  { icon: 'auto_awesome', label: 'Automatizaciones', href: '/automatizaciones' },
  { icon: 'settings', label: 'Configuración', href: '/configuracion' },
];

// components/dashboard/KPICard.tsx
interface KPICardProps {
  titulo: string;
  valor: number | string;
  variacion?: number;    // % de cambio vs período anterior
  icono: string;
  color: 'gold' | 'blue' | 'green' | 'red';
}

// components/tramites/TramiteStatusBadge.tsx
// Badge con colores por estatus del trámite

// components/agenda/CalendarioAdmin.tsx
// Integración con FullCalendar + Google Calendar API

// components/reportes/GraficaBarras.tsx
// Recharts para visualizaciones
```

### 6.3 Dashboard Administrativo - Métricas en Tiempo Real

```typescript
// app/(admin)/dashboard/page.tsx
// Polling cada 5 minutos con SWR

import useSWR from 'swr';

export default function DashboardPage() {
  const { data: metricas } = useSWR('/api/dashboard/admin', fetcher, {
    refreshInterval: 5 * 60 * 1000, // 5 minutos
  });

  return (
    <div className="grid grid-cols-4 gap-6">
      <KPICard titulo="Clientes Registrados" valor={metricas?.totalClientes} icono="people" color="blue" />
      <KPICard titulo="Trámites Activos" valor={metricas?.tramitesActivos} icono="folder" color="gold" />
      <KPICard titulo="Casos Aprobados" valor={metricas?.casosAprobados} icono="check_circle" color="green" />
      <KPICard titulo="Casos Rechazados" valor={metricas?.casosRechazados} icono="cancel" color="red" />
      
      <div className="col-span-2">
        <GraficaDistribucionEstatus data={metricas?.distribucionEstatus} />
      </div>
      <div className="col-span-2">
        <GraficaKPIs data={metricas?.kpis} />
      </div>
      
      <div className="col-span-2">
        <ActividadReciente actividades={metricas?.ultimasActividades} />
      </div>
      <div className="col-span-2">
        <CitasHoy citas={metricas?.citasHoy} />
      </div>
    </div>
  );
}
```

---

## 7. Arquitectura del Backend (Node.js + Express)

### 7.1 Estructura de Capas

```
src/
├── config/
│   ├── database.ts         # Conexión PostgreSQL (pg / Knex)
│   ├── redis.ts            # Conexión Redis
│   ├── aws.ts              # AWS SDK config
│   └── env.ts              # Variables de entorno validadas (zod)
├── middleware/
│   ├── auth.middleware.ts  # Verificación JWT
│   ├── rbac.middleware.ts  # Control de acceso por rol
│   ├── validate.middleware.ts # Validación de request (zod)
│   ├── rateLimit.middleware.ts
│   └── audit.middleware.ts # Log de actividad
├── routes/
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   ├── tramites.routes.ts
│   ├── documentos.routes.ts
│   ├── citas.routes.ts
│   ├── inm.routes.ts
│   ├── tickets.routes.ts
│   ├── pagos.routes.ts
│   ├── dashboard.routes.ts
│   └── reportes.routes.ts
├── controllers/            # Manejo de request/response
├── services/               # Lógica de negocio
│   ├── auth.service.ts
│   ├── tramites.service.ts
│   ├── documentos.service.ts
│   ├── inm.service.ts
│   ├── notificaciones.service.ts
│   ├── automatizaciones.service.ts
│   ├── calendario.service.ts
│   ├── financiero.service.ts
│   └── reportes.service.ts
├── repositories/           # Acceso a datos (PostgreSQL)
│   ├── users.repository.ts
│   ├── tramites.repository.ts
│   ├── documentos.repository.ts
│   └── inm.repository.ts
├── queues/                 # Bull Queue workers
│   ├── notificaciones.queue.ts
│   ├── automatizaciones.queue.ts
│   └── documentos.queue.ts
└── utils/
    ├── jwt.utils.ts
    ├── s3.utils.ts
    ├── pdf.utils.ts        # Generación de recibos PDF
    └── crypto.utils.ts
```

### 7.2 Servicio de Autenticación

```typescript
// services/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  async register(email: string, telefono: string, password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await usersRepository.create({ email, telefono, hashedPassword });
    const code = generateOTPCode();
    await redisClient.setex(`otp:${user.id}`, 600, code); // TTL 10 min
    await notificacionesService.sendVerificationCode(email, code);
  }

  async loginWithGoogle(idToken: string): Promise<AuthTokens> {
    const ticket = await this.googleClient.verifyIdToken({ idToken });
    const payload = ticket.getPayload();
    let user = await usersRepository.findByEmail(payload.email);
    if (!user) {
      user = await usersRepository.createFromGoogle(payload);
    }
    return this.generateTokens(user);
  }

  generateTokens(user: User): AuthTokens {
    const accessToken = jwt.sign(
      { sub: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    return { accessToken, refreshToken };
  }
}
```

### 7.3 Servicio INM

```typescript
// services/inm.service.ts
import { redisClient } from '../config/redis';
import { inmRepository } from '../repositories/inm.repository';

export class INMService {
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 horas en segundos

  async getRequisitos(tipoTramite: TipoTramite): Promise<INMRequisitos> {
    const cacheKey = `inm:requisitos:${tipoTramite}`;
    
    // Intentar desde caché Redis
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Intentar desde base de datos (snapshot más reciente)
    const dbRecord = await inmRepository.getLatestRequisitos(tipoTramite);
    if (dbRecord && this.isRecent(dbRecord.capturedAt, 24)) {
      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dbRecord.datos));
      return dbRecord.datos as INMRequisitos;
    }
    
    // Retornar datos base si no hay caché (el WebView los actualizará)
    return this.getBaseRequisitos(tipoTramite);
  }

  async saveINMRecord(record: Omit<INMRecord, 'id' | 'syncedAt'>): Promise<INMRecord> {
    const saved = await inmRepository.create(record);
    
    // Si es requisitos, actualizar caché
    if (record.tipo === 'requisitos' && record.datos) {
      const cacheKey = `inm:requisitos:${record.datos.tipoTramite}`;
      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(record.datos));
    }
    
    return saved;
  }

  private isRecent(date: Date, hoursThreshold: number): boolean {
    const diffMs = Date.now() - new Date(date).getTime();
    return diffMs < hoursThreshold * 60 * 60 * 1000;
  }

  private getBaseRequisitos(tipo: TipoTramite): INMRequisitos {
    // Requisitos base hardcodeados como fallback
    const baseRequisitos: Record<TipoTramite, INMRequisitos> = {
      residencia_temporal: {
        documentos: ['Pasaporte vigente', 'Forma migratoria', 'Comprobante de domicilio'],
        descripcion: 'Residencia Temporal - hasta 4 años renovables'
      },
      // ... otros tipos
    };
    return baseRequisitos[tipo];
  }
}
```

### 7.4 Motor de Notificaciones

```typescript
// services/notificaciones.service.ts
import * as admin from 'firebase-admin';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

export class NotificacionesService {
  private twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

  async enviarNotificacion(params: {
    usuarioId: string;
    tipo: TipoNotificacion;
    titulo: string;
    contenido: string;
    canales: ('push' | 'email' | 'whatsapp')[];
    datos?: Record<string, unknown>;
  }): Promise<void> {
    const usuario = await usersRepository.findById(params.usuarioId);
    const preferencias = await this.getPreferencias(params.usuarioId);
    
    const promesas: Promise<void>[] = [];
    
    if (params.canales.includes('push') && preferencias.push) {
      promesas.push(this.enviarPush(usuario.fcmToken, params.titulo, params.contenido));
    }
    
    if (params.canales.includes('email') && preferencias.email) {
      promesas.push(this.enviarEmail(usuario.email, params.titulo, params.contenido));
    }
    
    if (params.canales.includes('whatsapp') && preferencias.whatsapp && usuario.telefono) {
      promesas.push(this.enviarWhatsApp(usuario.telefono, params.contenido));
    }
    
    const resultados = await Promise.allSettled(promesas);
    await this.registrarResultados(params.usuarioId, params.tipo, resultados);
  }

  private async enviarPush(fcmToken: string, titulo: string, body: string): Promise<void> {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title: titulo, body },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } }
    });
  }

  private async enviarEmail(to: string, subject: string, html: string): Promise<void> {
    await sgMail.send({
      to,
      from: 'noreply@migracionmx.com',
      subject,
      html
    });
  }

  private async enviarWhatsApp(telefono: string, mensaje: string): Promise<void> {
    await this.twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${telefono}`,
      body: mensaje
    });
  }
}
```

### 7.5 Motor de Automatizaciones (Bull Queue)

```typescript
// queues/automatizaciones.queue.ts
import Bull from 'bull';

const automatizacionesQueue = new Bull('automatizaciones', {
  redis: { host: process.env.REDIS_HOST, port: 6379 }
});

// Definición de flujos automáticos
const FLUJOS = {
  SEGUIMIENTO_INACTIVIDAD: {
    nombre: 'seguimiento_inactividad',
    descripcion: 'Cliente sin actividad por 14 días',
    habilitado: true,
  },
  RENOVACION_DOCUMENTO: {
    nombre: 'renovacion_documento',
    descripcion: 'Documento próximo a vencer (30 días)',
    habilitado: true,
  },
  AVANCE_ETAPA: {
    nombre: 'avance_etapa',
    descripcion: 'Trámite avanza a nueva etapa',
    habilitado: true,
  },
  TRAMITE_APROBADO: {
    nombre: 'tramite_aprobado',
    descripcion: 'Trámite alcanza estatus Aprobado',
    habilitado: true,
  },
};

// Worker que procesa los jobs
automatizacionesQueue.process(async (job) => {
  const { flujo, usuarioId, datos } = job.data;
  
  switch (flujo) {
    case 'seguimiento_inactividad':
      await notificacionesService.enviarNotificacion({
        usuarioId,
        tipo: 'seguimiento',
        titulo: 'Te echamos de menos',
        contenido: 'Han pasado 14 días sin actividad en tu expediente. ¿Necesitas ayuda?',
        canales: ['email', 'whatsapp'],
      });
      break;
      
    case 'renovacion_documento':
      await notificacionesService.enviarNotificacion({
        usuarioId,
        tipo: 'vencimiento_doc',
        titulo: 'Documento próximo a vencer',
        contenido: `Tu documento "${datos.nombreDocumento}" vence en ${datos.diasRestantes} días.`,
        canales: ['email', 'push'],
      });
      break;
  }
  
  await automatizacionesLogRepository.create({
    usuarioId,
    flujo,
    resultado: 'entregado',
    ejecutadoAt: new Date(),
  });
});

// Cron job: revisar inactividad cada día a las 9am
automatizacionesQueue.add(
  { flujo: 'check_inactividad' },
  { repeat: { cron: '0 9 * * *' } }
);
```

---

## 8. Estrategia de Seguridad

### 8.1 Capas de Seguridad

```mermaid
graph TD
    subgraph "Capa 1: Red"
        WAF[AWS WAF<br/>Reglas OWASP Top 10]
        DDOS[AWS Shield<br/>Protección DDoS]
        TLS[TLS 1.3<br/>Cifrado en tránsito]
    end

    subgraph "Capa 2: Autenticación"
        JWT[JWT RS256<br/>Expiración 24h]
        OAUTH[OAuth2<br/>Google + Apple]
        TFA[2FA TOTP<br/>Google Authenticator]
        RATE[Rate Limiting<br/>100 req/min por IP]
    end

    subgraph "Capa 3: Autorización"
        RBAC[RBAC<br/>Cliente / Asesor / Admin]
        ROW[Row-Level Security<br/>PostgreSQL RLS]
        AUDIT[Audit Log<br/>Todas las acciones]
    end

    subgraph "Capa 4: Datos"
        AES[AES-256<br/>Documentos en reposo]
        S3ENC[S3 Server-Side<br/>Encryption SSE-S3]
        PRESIGNED[URLs Pre-firmadas<br/>Expiración 15 min]
    end

    subgraph "Capa 5: Infraestructura"
        VPC[AWS VPC<br/>Red privada]
        SG[Security Groups<br/>Mínimo privilegio]
        BACKUP[Backups automáticos<br/>RDS cada 24h]
    end

    WAF --> JWT
    DDOS --> TLS
    TLS --> JWT
    JWT --> RBAC
    OAUTH --> JWT
    TFA --> JWT
    RATE --> JWT
    RBAC --> ROW
    ROW --> AES
    RBAC --> AUDIT
    AES --> S3ENC
    S3ENC --> PRESIGNED
    VPC --> SG
    SG --> BACKUP
```

### 8.2 Control de Acceso por Rol (RBAC)

```typescript
// middleware/rbac.middleware.ts
const PERMISOS: Record<Rol, Record<string, string[]>> = {
  cliente: {
    tramites: ['read:own', 'create'],
    documentos: ['read:own', 'create:own'],
    citas: ['read:own'],
    tickets: ['read:own', 'create'],
    pagos: ['read:own'],
    perfil: ['read:own', 'update:own'],
  },
  asesor: {
    tramites: ['read:assigned', 'update:assigned'],
    documentos: ['read:assigned', 'update:assigned'],
    clientes: ['read:assigned', 'update:assigned', 'create'],
    citas: ['read:all', 'create', 'update', 'delete'],
    tickets: ['read:assigned', 'update:assigned'],
    pagos: ['read:all', 'create'],
    reportes: ['read'],
  },
  administrador: {
    '*': ['*'], // Acceso total
  },
};

export const requirePermiso = (recurso: string, accion: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { rol, sub: userId } = req.user;
    const permisos = PERMISOS[rol]?.[recurso] || PERMISOS[rol]?.['*'];
    
    if (!permisos || !tienePermiso(permisos, accion, req.params.id, userId)) {
      auditLog.warn({ userId, recurso, accion, ip: req.ip, resultado: 'DENEGADO' });
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Acceso denegado' } });
    }
    
    next();
  };
```

### 8.3 Gestión de Documentos con S3

```typescript
// utils/s3.utils.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private client = new S3Client({ region: process.env.AWS_REGION });
  private bucket = process.env.S3_BUCKET_DOCUMENTOS;

  async uploadDocumento(file: Buffer, key: string, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      ServerSideEncryption: 'AES256', // SSE-S3
      Metadata: {
        uploadedAt: new Date().toISOString(),
      }
    }));
    return key;
  }

  async getPresignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    // URL pre-firmada con expiración de 15 minutos
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds }
    );
  }

  generateDocumentoKey(tramiteId: string, documentoId: string, filename: string): string {
    return `tramites/${tramiteId}/documentos/${documentoId}/${filename}`;
  }
}
```

---

## 9. Infraestructura AWS

### 9.1 Diagrama de Infraestructura

```mermaid
graph TB
    subgraph "Internet"
        USERS[Usuarios<br/>App + Browser]
    end

    subgraph "AWS - us-east-1"
        subgraph "Edge"
            R53[Route 53<br/>DNS]
            CF[CloudFront<br/>CDN + WAF]
            SHIELD[AWS Shield<br/>DDoS Protection]
        end

        subgraph "VPC - 10.0.0.0/16"
            subgraph "Public Subnets"
                ALB[Application<br/>Load Balancer]
                NAT[NAT Gateway]
            end

            subgraph "Private Subnets - App"
                ECS[ECS Fargate<br/>API Backend<br/>Auto Scaling 2-20 tasks]
                ADMIN_S3[S3 + CloudFront<br/>Panel Admin Next.js]
            end

            subgraph "Private Subnets - Data"
                RDS_PRIMARY[(RDS PostgreSQL<br/>db.r6g.large<br/>Primary)]
                RDS_REPLICA[(RDS PostgreSQL<br/>Read Replica)]
                REDIS_CLUSTER[(ElastiCache Redis<br/>cache.r6g.large<br/>Cluster Mode)]
            end

            subgraph "Storage"
                S3_DOCS[S3 Bucket<br/>Documentos<br/>SSE-AES256]
                S3_BACKUPS[S3 Bucket<br/>Backups RDS]
            end
        end

        subgraph "Servicios Gestionados"
            SES[AWS SES<br/>Email]
            SNS[AWS SNS<br/>Notificaciones]
            CW[CloudWatch<br/>Logs + Métricas]
            XRAY[AWS X-Ray<br/>Trazas distribuidas]
            SM[Secrets Manager<br/>Credenciales]
            ECR[ECR<br/>Docker Images]
        end
    end

    USERS --> R53
    R53 --> CF
    CF --> SHIELD
    CF --> ALB
    CF --> ADMIN_S3
    ALB --> ECS
    ECS --> RDS_PRIMARY
    ECS --> REDIS_CLUSTER
    ECS --> S3_DOCS
    ECS --> SES
    ECS --> SNS
    RDS_PRIMARY --> RDS_REPLICA
    RDS_PRIMARY --> S3_BACKUPS
    ECS --> CW
    ECS --> XRAY
    ECS --> SM
    ECR --> ECS
    NAT --> ECS
```

### 9.2 Configuración de ECS Fargate

```yaml
# task-definition.json (simplificado)
TaskDefinition:
  Family: migracion-segura-api
  Cpu: "1024"        # 1 vCPU
  Memory: "2048"     # 2 GB RAM
  NetworkMode: awsvpc
  
  ContainerDefinitions:
    - Name: api
      Image: !Sub "${ECR_REPO}:latest"
      PortMappings:
        - ContainerPort: 3000
      Environment:
        - Name: NODE_ENV
          Value: production
        - Name: PORT
          Value: "3000"
      Secrets:
        - Name: DATABASE_URL
          ValueFrom: !Sub "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:migracion/db-url"
        - Name: JWT_SECRET
          ValueFrom: !Sub "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:migracion/jwt-secret"
      LogConfiguration:
        LogDriver: awslogs
        Options:
          awslogs-group: /ecs/migracion-segura-api
          awslogs-region: us-east-1
          awslogs-stream-prefix: ecs

# Auto Scaling Policy
AutoScalingPolicy:
  MinCapacity: 2
  MaxCapacity: 20
  TargetTrackingScaling:
    - MetricType: ECSServiceAverageCPUUtilization
      TargetValue: 70.0
    - MetricType: ECSServiceAverageMemoryUtilization
      TargetValue: 80.0
```

### 9.3 Estrategia de Despliegue Blue-Green

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant CI as GitHub Actions CI/CD
    participant ECR as AWS ECR
    participant ECS as ECS Fargate
    participant ALB as Load Balancer
    participant BLUE as Blue (Actual)
    participant GREEN as Green (Nueva)

    DEV->>CI: git push main
    CI->>CI: npm test + npm run build
    CI->>ECR: docker build + push :latest
    CI->>ECS: Deploy nueva task definition
    ECS->>GREEN: Lanzar nuevas tasks (Green)
    GREEN->>GREEN: Health checks pasan
    ALB->>GREEN: Redirigir 100% del tráfico
    ALB->>BLUE: Drenar conexiones
    ECS->>BLUE: Terminar tasks antiguas (Blue)
    CI-->>DEV: Despliegue exitoso
```

### 9.4 Variables de Entorno Requeridas

```bash
# Backend API
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/migracion_db
REDIS_URL=redis://elasticache-endpoint:6379
JWT_SECRET=<secreto-256-bits>
JWT_REFRESH_SECRET=<secreto-256-bits>

# AWS
AWS_REGION=us-east-1
S3_BUCKET_DOCUMENTOS=migracion-segura-documentos
S3_BUCKET_BACKUPS=migracion-segura-backups

# OAuth2
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
APPLE_CLIENT_ID=<apple-client-id>
APPLE_TEAM_ID=<apple-team-id>
APPLE_KEY_ID=<apple-key-id>

# Notificaciones
FIREBASE_PROJECT_ID=<firebase-project-id>
FIREBASE_PRIVATE_KEY=<firebase-private-key>
TWILIO_SID=<twilio-account-sid>
TWILIO_TOKEN=<twilio-auth-token>
TWILIO_WHATSAPP_NUMBER=+14155238886
SENDGRID_API_KEY=<sendgrid-api-key>

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=<calendar-client-id>
GOOGLE_CALENDAR_CLIENT_SECRET=<calendar-client-secret>

# DocuSign
DOCUSIGN_INTEGRATION_KEY=<docusign-key>
DOCUSIGN_ACCOUNT_ID=<docusign-account-id>
```

---

## 10. Estrategia de Notificaciones Multicanal

### 10.1 Flujo de Notificaciones

```mermaid
graph TD
    EVENT[Evento del Sistema<br/>cambio estatus, doc rechazado, etc.]
    QUEUE[Bull Queue<br/>notificaciones]
    WORKER[Worker de Notificaciones]
    PREF[Verificar Preferencias<br/>del Usuario]
    
    PUSH_CHECK{¿Push habilitado?}
    EMAIL_CHECK{¿Email habilitado?}
    WA_CHECK{¿WhatsApp habilitado?}
    
    FCM[Firebase Cloud Messaging<br/>iOS + Android]
    SG[SendGrid<br/>Email HTML]
    TW[Twilio WhatsApp<br/>Business API]
    
    LOG[Registrar resultado<br/>en notificaciones table]
    
    EVENT --> QUEUE
    QUEUE --> WORKER
    WORKER --> PREF
    PREF --> PUSH_CHECK
    PREF --> EMAIL_CHECK
    PREF --> WA_CHECK
    PUSH_CHECK -->|Sí| FCM
    EMAIL_CHECK -->|Sí| SG
    WA_CHECK -->|Sí y tiene teléfono| TW
    FCM --> LOG
    SG --> LOG
    TW --> LOG
```

### 10.2 Matriz de Notificaciones por Evento

| Evento | Push | Email | WhatsApp | Timing |
|--------|------|-------|----------|--------|
| Cambio de estatus de trámite | ✅ | ✅ | ✅ | Inmediato (< 5 min) |
| Documento rechazado | ✅ | ✅ | ❌ | Inmediato |
| Documento faltante | ✅ | ✅ | ❌ | Inmediato |
| Cita programada (confirmación) | ✅ | ✅ | ✅ | Inmediato |
| Recordatorio de cita (24h antes) | ✅ | ✅ | ✅ | 24h antes |
| Recordatorio de cita (1h antes) | ✅ | ❌ | ✅ | 1h antes |
| Cita cancelada | ✅ | ✅ | ❌ | Inmediato |
| Pago pendiente (7 días) | ❌ | ✅ | ❌ | Día 7 |
| Mensaje del asesor | ✅ | ✅ | ❌ | Inmediato |
| Documento próximo a vencer (30 días) | ✅ | ✅ | ❌ | Día 30 |
| Inactividad 14 días | ❌ | ✅ | ✅ | Día 14 |
| Trámite aprobado | ✅ | ✅ | ✅ | Inmediato |
| Código de verificación OTP | ❌ | ✅ | ❌ | Inmediato |
| Avance a nueva etapa (docs requeridos) | ✅ | ✅ | ❌ | Inmediato |

### 10.3 Plantillas de Notificación

```typescript
// utils/notification-templates.ts
export const TEMPLATES = {
  CAMBIO_ESTATUS: {
    push: {
      titulo: (estatus: string) => `Tu trámite está ${estatus}`,
      cuerpo: (tipo: string) => `Tu trámite de ${tipo} ha sido actualizado.`,
    },
    email: {
      asunto: (estatus: string) => `Actualización de tu trámite: ${estatus}`,
      template: 'tramite-estatus-update', // SendGrid template ID
    },
    whatsapp: {
      mensaje: (nombre: string, tipo: string, estatus: string) =>
        `Hola ${nombre}, tu trámite de *${tipo}* ha cambiado a *${estatus}*. Revisa tu app para más detalles.`,
    },
  },
  RECORDATORIO_CITA: {
    push: {
      titulo: () => 'Recordatorio de cita',
      cuerpo: (horas: number, asesor: string) =>
        `Tu cita con ${asesor} es en ${horas} hora${horas > 1 ? 's' : ''}.`,
    },
    whatsapp: {
      mensaje: (nombre: string, fecha: string, hora: string, asesor: string, modalidad: string) =>
        `Hola ${nombre}, te recordamos tu cita:\n📅 *${fecha}* a las *${hora}*\n👤 Asesor: ${asesor}\n📍 Modalidad: ${modalidad}`,
    },
  },
};
```

---

## 11. Propiedades de Corrección (Property-Based Testing)

Las siguientes propiedades deben mantenerse invariantes en todo momento. Se implementarán usando **fast-check** (TypeScript/JavaScript).

### 11.1 Propiedades del Módulo de Autenticación

```typescript
// tests/properties/auth.properties.test.ts
import fc from 'fast-check';

describe('Propiedades de Autenticación', () => {

  // P-AUTH-1: Un JWT generado siempre puede ser verificado con el mismo secreto
  test('JWT generado es siempre verificable', () => {
    fc.assert(fc.property(
      fc.record({ id: fc.uuid(), rol: fc.constantFrom('cliente', 'asesor', 'administrador') }),
      (user) => {
        const tokens = authService.generateTokens(user);
        const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
        return decoded.sub === user.id && decoded.rol === user.rol;
      }
    ));
  });

  // P-AUTH-2: Después de 5 intentos fallidos, la cuenta queda bloqueada
  test('Bloqueo de cuenta tras 5 intentos fallidos', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1 }),
      async (passwordIncorrecto) => {
        const user = await crearUsuarioPrueba();
        for (let i = 0; i < 5; i++) {
          await authService.login(user.email, passwordIncorrecto).catch(() => {});
        }
        const userActualizado = await usersRepository.findById(user.id);
        return userActualizado.intentosFallidos >= 5 && userActualizado.bloqueadoHasta !== null;
      }
    ));
  });

  // P-AUTH-3: El hash de contraseña nunca es igual al texto plano
  test('Hash de contraseña es siempre diferente al texto plano', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 8, maxLength: 100 }),
      async (password) => {
        const hash = await bcrypt.hash(password, 12);
        return hash !== password;
      }
    ));
  });

  // P-AUTH-4: Un token de reset de contraseña expira en exactamente 30 minutos
  test('Token de reset expira en 30 minutos', () => {
    fc.assert(fc.property(
      fc.uuid(),
      (userId) => {
        const token = authService.generateResetToken(userId);
        const decoded = jwt.decode(token) as { exp: number };
        const expiresInMinutes = (decoded.exp - Math.floor(Date.now() / 1000)) / 60;
        return expiresInMinutes <= 30 && expiresInMinutes > 29;
      }
    ));
  });
});
```

### 11.2 Propiedades del Módulo de Trámites

```typescript
// tests/properties/tramites.properties.test.ts

describe('Propiedades de Trámites', () => {

  // P-TRAM-1: El número de pieza es siempre único en el sistema
  test('Número de pieza es único para cada trámite', () => {
    fc.assert(fc.property(
      fc.array(fc.record({ clienteId: fc.uuid(), tipo: fc.constantFrom(...TIPOS_TRAMITE) }), { minLength: 2, maxLength: 50 }),
      async (tramitesData) => {
        const tramites = await Promise.all(tramitesData.map(d => tramitesService.crear(d)));
        const numeroPiezas = tramites.map(t => t.numeroPieza);
        return new Set(numeroPiezas).size === numeroPiezas.length;
      }
    ));
  });

  // P-TRAM-2: El porcentaje de progreso siempre está entre 0 y 100
  test('Porcentaje de progreso siempre entre 0 y 100', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 20 }),
      fc.integer({ min: 1, max: 20 }),
      (etapasCompletadas, totalEtapas) => {
        const completadas = Math.min(etapasCompletadas, totalEtapas);
        const progreso = tramitesService.calcularProgreso(completadas, totalEtapas);
        return progreso >= 0 && progreso <= 100;
      }
    ));
  });

  // P-TRAM-3: Un trámite aprobado o rechazado no puede volver a estado anterior
  test('Trámite en estado terminal no puede retroceder', () => {
    fc.assert(fc.property(
      fc.constantFrom('aprobado', 'rechazado'),
      fc.constantFrom('borrador', 'recibido', 'en_revision', 'en_espera'),
      (estatusTerminal, estatusAnterior) => {
        const resultado = tramitesService.validarTransicionEstatus(estatusTerminal, estatusAnterior);
        return resultado.valido === false;
      }
    ));
  });

  // P-TRAM-4: Al crear un trámite, siempre se genera la lista de documentos requeridos
  test('Nuevo trámite siempre tiene documentos requeridos asignados', () => {
    fc.assert(fc.property(
      fc.constantFrom(...TIPOS_TRAMITE),
      async (tipo) => {
        const tramite = await tramitesService.crear({ tipo, clienteId: fc.sample(fc.uuid(), 1)[0] });
        const documentos = await documentosRepository.findByTramite(tramite.id);
        return documentos.length > 0;
      }
    ));
  });
});
```

### 11.3 Propiedades del Módulo de Documentos

```typescript
// tests/properties/documentos.properties.test.ts

describe('Propiedades de Documentos', () => {

  // P-DOC-1: Un documento subido nunca excede 20 MB
  test('Documentos subidos siempre dentro del límite de tamaño', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 20 * 1024 * 1024 }),
      (tamanoByte) => {
        const resultado = documentosService.validarTamano(tamanoByte);
        return resultado.valido === true;
      }
    ));
  });

  // P-DOC-2: Un documento rechazado siempre tiene razón de rechazo
  test('Documento rechazado siempre tiene razón de rechazo', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 500 }),
      async (razon) => {
        const doc = await crearDocumentoPrueba();
        await documentosService.rechazar(doc.id, razon);
        const docActualizado = await documentosRepository.findById(doc.id);
        return docActualizado.estatus === 'rechazado' && docActualizado.razonRechazo === razon;
      }
    ));
  });

  // P-DOC-3: La URL pre-firmada de S3 siempre expira en máximo 15 minutos
  test('URL pre-firmada expira en máximo 15 minutos', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1 }),
      async (s3Key) => {
        const url = await s3Service.getPresignedUrl(s3Key, 900);
        const urlParams = new URL(url);
        const expiresIn = parseInt(urlParams.searchParams.get('X-Amz-Expires') || '0');
        return expiresIn <= 900;
      }
    ));
  });

  // P-DOC-4: Solo formatos PDF, JPG y PNG son aceptados
  test('Solo formatos permitidos son aceptados', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1 }),
      (extension) => {
        const permitidos = ['pdf', 'jpg', 'jpeg', 'png'];
        const resultado = documentosService.validarFormato(extension.toLowerCase());
        return resultado.valido === permitidos.includes(extension.toLowerCase());
      }
    ));
  });
});
```

### 11.4 Propiedades del Módulo INM

```typescript
// tests/properties/inm.properties.test.ts

describe('Propiedades del Módulo INM', () => {

  // P-INM-1: Los requisitos cacheados siempre corresponden al tipo de trámite solicitado
  test('Caché de requisitos INM es consistente con el tipo de trámite', () => {
    fc.assert(fc.property(
      fc.constantFrom(...TIPOS_TRAMITE),
      async (tipo) => {
        const requisitos = await inmService.getRequisitos(tipo);
        return requisitos !== null && requisitos !== undefined;
      }
    ));
  });

  // P-INM-2: Un registro INM siempre tiene timestamp de captura
  test('Registro INM siempre tiene timestamp de captura', () => {
    fc.assert(fc.property(
      fc.record({
        usuarioId: fc.uuid(),
        tipo: fc.constantFrom('requisitos', 'estatus', 'cita', 'fmm'),
        datos: fc.object(),
        fuenteUrl: fc.webUrl(),
      }),
      async (recordData) => {
        const record = await inmService.saveINMRecord(recordData);
        return record.capturedAt instanceof Date && !isNaN(record.capturedAt.getTime());
      }
    ));
  });

  // P-INM-3: El pre-llenado de formularios nunca expone datos de otro usuario
  test('Pre-llenado de formularios solo usa datos del usuario autenticado', () => {
    fc.assert(fc.property(
      fc.record({
        id: fc.uuid(),
        nombre: fc.string({ minLength: 1 }),
        email: fc.emailAddress(),
        telefono: fc.string({ minLength: 10, maxLength: 15 }),
      }),
      (userData) => {
        const script = generatePrefillScript(userData);
        // El script solo debe contener los datos del usuario proporcionado
        return script.includes(userData.email) && !script.includes('undefined');
      }
    ));
  });
});
```

### 11.5 Propiedades del Motor de Notificaciones

```typescript
// tests/properties/notificaciones.properties.test.ts

describe('Propiedades de Notificaciones', () => {

  // P-NOTIF-1: Toda notificación enviada queda registrada en el log
  test('Toda notificación enviada queda registrada', () => {
    fc.assert(fc.property(
      fc.record({
        usuarioId: fc.uuid(),
        tipo: fc.constantFrom('cambio_estatus', 'documento_rechazado', 'cita_proxima'),
        titulo: fc.string({ minLength: 1 }),
        contenido: fc.string({ minLength: 1 }),
        canales: fc.subarray(['push', 'email', 'whatsapp'], { minLength: 1 }),
      }),
      async (params) => {
        await notificacionesService.enviarNotificacion(params);
        const registros = await notificacionesRepository.findByUsuario(params.usuarioId);
        return registros.length > 0;
      }
    ));
  });

  // P-NOTIF-2: Las preferencias del usuario siempre se respetan
  test('Preferencias de notificación del usuario son respetadas', () => {
    fc.assert(fc.property(
      fc.record({
        push: fc.boolean(),
        email: fc.boolean(),
        whatsapp: fc.boolean(),
      }),
      async (preferencias) => {
        const usuario = await crearUsuarioConPreferencias(preferencias);
        const spy = jest.spyOn(notificacionesService, 'enviarPush');
        
        await notificacionesService.enviarNotificacion({
          usuarioId: usuario.id,
          tipo: 'cambio_estatus',
          titulo: 'Test',
          contenido: 'Test',
          canales: ['push', 'email', 'whatsapp'],
        });
        
        return preferencias.push ? spy.toHaveBeenCalled() : !spy.toHaveBeenCalled();
      }
    ));
  });

  // P-NOTIF-3: Los recordatorios de cita siempre se envían en el tiempo correcto
  test('Recordatorio de cita se programa correctamente', () => {
    fc.assert(fc.property(
      fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
      async (fechaCita) => {
        const cita = await citasService.crear({ fechaHora: fechaCita });
        const jobs = await notificacionesQueue.getDelayed();
        
        const recordatorio24h = jobs.find(j =>
          j.data.citaId === cita.id && j.data.tipo === 'recordatorio_24h'
        );
        
        if (recordatorio24h) {
          const tiempoEsperado = fechaCita.getTime() - 24 * 60 * 60 * 1000;
          const tiempoReal = recordatorio24h.opts.delay + Date.now();
          return Math.abs(tiempoReal - tiempoEsperado) < 60000; // Tolerancia 1 minuto
        }
        return true;
      }
    ));
  });
});
```

### 11.6 Propiedades de Seguridad y Control de Acceso

```typescript
// tests/properties/seguridad.properties.test.ts

describe('Propiedades de Seguridad', () => {

  // P-SEC-1: Un cliente nunca puede acceder a datos de otro cliente
  test('Cliente solo accede a sus propios datos', () => {
    fc.assert(fc.property(
      fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
      async ([clienteId1, clienteId2]) => {
        const token = authService.generateTokens({ id: clienteId1, rol: 'cliente' }).accessToken;
        const response = await request(app)
          .get(`/v1/tramites?clienteId=${clienteId2}`)
          .set('Authorization', `Bearer ${token}`);
        return response.status === 403;
      }
    ));
  });

  // P-SEC-2: Todos los endpoints protegidos rechazan requests sin token
  test('Endpoints protegidos rechazan requests sin autenticación', () => {
    fc.assert(fc.property(
      fc.constantFrom(
        '/v1/tramites', '/v1/documentos', '/v1/citas',
        '/v1/tickets', '/v1/pagos', '/v1/dashboard/admin'
      ),
      async (endpoint) => {
        const response = await request(app).get(endpoint);
        return response.status === 401;
      }
    ));
  });

  // P-SEC-3: Los intentos de acceso denegado siempre quedan en el audit log
  test('Acceso denegado siempre queda registrado en audit log', () => {
    fc.assert(fc.property(
      fc.record({ userId: fc.uuid(), recurso: fc.string({ minLength: 1 }) }),
      async ({ userId, recurso }) => {
        const token = authService.generateTokens({ id: userId, rol: 'cliente' }).accessToken;
        await request(app)
          .get(`/v1/dashboard/admin`)
          .set('Authorization', `Bearer ${token}`);
        
        const logs = await activityLogRepository.findByUser(userId);
        return logs.some(l => l.accion === 'ACCESO_DENEGADO');
      }
    ));
  });

  // P-SEC-4: La sesión del panel admin expira tras 30 minutos de inactividad
  test('Sesión admin expira tras 30 minutos de inactividad', () => {
    fc.assert(fc.property(
      fc.integer({ min: 31, max: 120 }),
      (minutosInactividad) => {
        const tokenCreatedAt = new Date(Date.now() - minutosInactividad * 60 * 1000);
        const resultado = authService.validarSesionAdmin(tokenCreatedAt);
        return resultado.expirada === true;
      }
    ));
  });
});
```

---

## 12. Integración con Google Calendar

```typescript
// services/calendario.service.ts
import { google } from 'googleapis';

export class CalendarioService {
  private getCalendarClient(accessToken: string) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth });
  }

  async crearEvento(asesorAccessToken: string, cita: Cita, cliente: User): Promise<string> {
    const calendar = this.getCalendarClient(asesorAccessToken);
    
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Cita migratoria - ${cliente.nombreCompleto}`,
        description: `Trámite: ${cita.tramiteId}\nModalidad: ${cita.modalidad}`,
        start: { dateTime: cita.fechaHora.toISOString(), timeZone: 'America/Mexico_City' },
        end: {
          dateTime: new Date(cita.fechaHora.getTime() + cita.duracionMinutos * 60000).toISOString(),
          timeZone: 'America/Mexico_City'
        },
        attendees: [{ email: cliente.email }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
          ],
        },
      },
    });
    
    return event.data.id;
  }

  async actualizarEvento(asesorAccessToken: string, googleEventId: string, cita: Cita): Promise<void> {
    const calendar = this.getCalendarClient(asesorAccessToken);
    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: {
        start: { dateTime: cita.fechaHora.toISOString(), timeZone: 'America/Mexico_City' },
        end: {
          dateTime: new Date(cita.fechaHora.getTime() + cita.duracionMinutos * 60000).toISOString(),
          timeZone: 'America/Mexico_City'
        },
      },
    });
  }

  async eliminarEvento(asesorAccessToken: string, googleEventId: string): Promise<void> {
    const calendar = this.getCalendarClient(asesorAccessToken);
    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
  }
}
```

---

## 13. Módulo Financiero - Generación de Recibos PDF

```typescript
// services/financiero.service.ts
import PDFDocument from 'pdfkit';
import { s3Service } from './s3.service';

export class FinancieroService {
  async registrarPago(params: {
    clienteId: string;
    tramiteId: string;
    monto: number;
    metodo: 'transferencia' | 'tarjeta' | 'efectivo';
    concepto: string;
    registradoPor: string;
  }): Promise<Pago> {
    const pago = await pagosRepository.create({
      ...params,
      fechaPago: new Date(),
    });
    
    // Generar recibo PDF
    const reciboPdf = await this.generarReciboPDF(pago);
    const s3Key = `recibos/${pago.clienteId}/${pago.id}.pdf`;
    await s3Service.uploadDocumento(reciboPdf, s3Key, 'application/pdf');
    
    await pagosRepository.update(pago.id, { reciboS3Key: s3Key });
    
    // Notificar al cliente
    await notificacionesService.enviarNotificacion({
      usuarioId: pago.clienteId,
      tipo: 'pago_registrado',
      titulo: 'Pago registrado',
      contenido: `Se registró un pago de $${pago.monto} MXN. Tu recibo está disponible en la app.`,
      canales: ['push', 'email'],
    });
    
    return pago;
  }

  private async generarReciboPDF(pago: Pago): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];
      
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      // Encabezado
      doc.fontSize(20).text('MIGRACIÓN SEGURA MX', { align: 'center' });
      doc.fontSize(14).text('RECIBO DE PAGO', { align: 'center' });
      doc.moveDown();
      
      // Datos del recibo
      doc.fontSize(12)
        .text(`Folio: ${pago.id}`)
        .text(`Fecha: ${pago.fechaPago.toLocaleDateString('es-MX')}`)
        .text(`Concepto: ${pago.concepto}`)
        .text(`Método de pago: ${pago.metodo}`)
        .text(`Monto: $${pago.monto.toFixed(2)} MXN`);
      
      doc.end();
    });
  }
}
```

---

## 14. Consideraciones de Rendimiento

### 14.1 Estrategia de Caché

| Recurso | Caché | TTL | Invalidación |
|---------|-------|-----|--------------|
| Requisitos INM por tipo | Redis | 24h | Manual o al capturar nuevos datos |
| Perfil de usuario | Redis | 1h | Al actualizar perfil |
| Métricas del dashboard | Redis | 5 min | Por tiempo |
| Lista de trámites del cliente | Redis | 5 min | Al cambiar estatus |
| Documentos requeridos por tipo | Redis | 24h | Al actualizar plantillas |

### 14.2 Índices de Base de Datos

```sql
-- Índices críticos para rendimiento
CREATE INDEX idx_tramites_cliente ON tramites(cliente_id);
CREATE INDEX idx_tramites_asesor ON tramites(asesor_id);
CREATE INDEX idx_tramites_estatus ON tramites(estatus);
CREATE INDEX idx_tramites_numero_pieza ON tramites(numero_pieza);
CREATE INDEX idx_documentos_tramite ON documentos(tramite_id);
CREATE INDEX idx_documentos_estatus ON documentos(estatus);
CREATE INDEX idx_documentos_vencimiento ON documentos(fecha_vencimiento) WHERE fecha_vencimiento IS NOT NULL;
CREATE INDEX idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX idx_citas_asesor ON citas(asesor_id);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida);
CREATE INDEX idx_activity_log_usuario ON activity_log(usuario_id, created_at DESC);
CREATE INDEX idx_inm_records_usuario ON inm_records(usuario_id, tipo);
CREATE INDEX idx_inm_records_pieza ON inm_records(numero_pieza) WHERE numero_pieza IS NOT NULL;
```

### 14.3 Objetivos de Rendimiento

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Tiempo de respuesta API (p95) | < 500ms | CloudWatch |
| Tiempo de respuesta API (p99) | < 2s | CloudWatch |
| Disponibilidad mensual | >= 99.5% | Route 53 Health Checks |
| Usuarios concurrentes soportados | 500 | Load testing con k6 |
| Tiempo de carga inicial app | < 3s | React Native Performance |
| Tiempo de sincronización offline | < 10s | Instrumentación custom |

---

## 15. Dependencias y Versiones

### 15.1 App Móvil (React Native)

```json
{
  "dependencies": {
    "react-native": "0.73.x",
    "react-navigation/native": "^6.x",
    "react-navigation/bottom-tabs": "^6.x",
    "react-native-webview": "^13.x",
    "zustand": "^4.x",
    "axios": "^1.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "react-native-sqlite-storage": "^6.x",
    "@react-native-community/netinfo": "^11.x",
    "react-native-document-picker": "^9.x",
    "react-native-image-picker": "^7.x",
    "@react-native-firebase/app": "^18.x",
    "@react-native-firebase/messaging": "^18.x",
    "react-native-pdf": "^6.x",
    "react-native-keychain": "^8.x"
  }
}
```

### 15.2 Panel Admin (Next.js)

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "^18.x",
    "swr": "^2.x",
    "axios": "^1.x",
    "@fullcalendar/react": "^6.x",
    "recharts": "^2.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "tailwindcss": "^3.x",
    "next-auth": "^4.x"
  }
}
```

### 15.3 Backend (Node.js)

```json
{
  "dependencies": {
    "express": "^4.x",
    "pg": "^8.x",
    "knex": "^3.x",
    "redis": "^4.x",
    "bull": "^4.x",
    "jsonwebtoken": "^9.x",
    "bcrypt": "^5.x",
    "google-auth-library": "^9.x",
    "googleapis": "^140.x",
    "@aws-sdk/client-s3": "^3.x",
    "@aws-sdk/s3-request-presigner": "^3.x",
    "firebase-admin": "^12.x",
    "twilio": "^5.x",
    "@sendgrid/mail": "^8.x",
    "pdfkit": "^0.15.x",
    "zod": "^3.x",
    "helmet": "^7.x",
    "express-rate-limit": "^7.x",
    "winston": "^3.x"
  },
  "devDependencies": {
    "fast-check": "^3.x",
    "jest": "^29.x",
    "supertest": "^6.x",
    "typescript": "^5.x"
  }
}
```

---

---

## Resumen de Decisiones de Diseño

| Decisión | Alternativa Considerada | Razón de Elección |
|----------|------------------------|-------------------|
| React Native sobre Flutter | Flutter | Mejor integración de WebView con JavaScript Bridge para el módulo INM |
| WebView + JS Bridge sobre API oficial INM | API REST del INM | El INM no tiene API pública oficial; WebView es la única opción viable |
| PostgreSQL sobre MongoDB | MongoDB | Datos relacionales complejos (trámites, documentos, usuarios, citas) |
| Bull Queue sobre AWS SQS | AWS SQS | Menor latencia, más simple para el equipo, suficiente para la escala inicial |
| ECS Fargate sobre EC2 | EC2 | Sin gestión de servidores, auto-scaling nativo, pago por uso |
| Zustand sobre Redux | Redux | Menor boilerplate, suficiente para la complejidad del estado de la app |
| JWT RS256 sobre HS256 | HS256 | Permite verificación sin compartir secreto entre servicios |
| fast-check para PBT | Hypothesis (Python) | Ecosistema JavaScript/TypeScript del proyecto |
| DocuSign sobre firma propia | Implementación propia | Cumplimiento legal, certificación NOM-151, menor riesgo |
| Redis para caché INM | Caché en memoria | Persistencia entre reinicios, compartido entre instancias ECS |

---

*Documento generado para: Migración Segura MX*
*Versión: 1.0*
*Fecha: 2025*
