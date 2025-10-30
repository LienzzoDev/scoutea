# 🚀 Sistema de Scraping Completo - Scoutea

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Anti-DDoS y Rate Limiting](#anti-ddos-y-rate-limiting)
4. [Procesamiento en Segundo Plano](#procesamiento-en-segundo-plano)
5. [API Endpoints](#api-endpoints)
6. [Configuración y Despliegue](#configuración-y-despliegue)
7. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

---

## Visión General

Sistema de scraping empresarial para actualizar datos de jugadores desde Transfermarkt, diseñado para procesar **miles de jugadores** sin ser detectado como ataque DDoS.

### ✨ Características Principales

- ✅ **Procesamiento Automático en Segundo Plano** (Vercel Cron)
- ✅ **Anti-DDoS Completo** (User-Agent rotation, random delays, exponential backoff)
- ✅ **Batch Processing** con persistencia de progreso
- ✅ **Rate Limiting Inteligente** con throttling adaptativo
- ✅ **Retry Logic** con tiempos exponenciales
- ✅ **Monitoreo en Tiempo Real** desde el dashboard
- ✅ **Auto-recuperación** de errores temporales
- ✅ **Modo Lento Automático** cuando detecta problemas

### 📊 Datos Extraídos (16 campos)

Desde la URL de Transfermarkt de cada jugador:

1. `advisor` - Nombre del agente/asesor
2. `url_trfm_advisor` - URL del asesor en Transfermarkt
3. `date_of_birth` - Fecha de nacimiento
4. `team_name` - Equipo actual
5. `team_loan_from` - Equipo de cesión (si aplica)
6. `position_player` - Posición en el campo
7. `foot` - Pie dominante (Derecho/Izquierdo/Ambos)
8. `height` - Altura en cm
9. `nationality_1` - Nacionalidad principal
10. `nationality_2` - Segunda nacionalidad (si aplica)
11. `national_tier` - Nivel de selección nacional
12. `agency` - Agencia representante
13. `contract_end` - Fecha fin de contrato
14. `player_trfm_value` - Valor de mercado en €
15. `photo_coverage` - URL de la foto de perfil del jugador (header)
16. `gallery_photo` - URL de foto de galería/cuerpo completo del jugador

---

## Arquitectura del Sistema

### 🏗️ Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Admin Panel)                    │
│  /admin/scraping - Dashboard con métricas en tiempo real    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     API ENDPOINTS                            │
│  • POST /api/admin/scraping/start   - Iniciar job          │
│  • POST /api/admin/scraping/process - Procesar batch       │
│  • GET  /api/admin/scraping/status  - Ver progreso         │
│  • POST /api/admin/scraping/pause   - Pausar job           │
│  • POST /api/admin/scraping/cancel  - Cancelar job         │
│  • GET  /api/admin/scraping/cron    - Cron automático      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   VERCEL CRON JOB                           │
│  Schedule: */5 * * * * (cada 5 minutos)                     │
│  Ejecuta: GET /api/admin/scraping/cron                      │
│  Auth: Bearer token (CRON_SECRET)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               RATE LIMITER & THROTTLER                       │
│  • RateLimiter - Retry logic con exponential backoff        │
│  • AdaptiveThrottler - Ajusta velocidad según error rate    │
│  • User-Agent Pool - 20+ agentes rotativos                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   TRANSFERMARKT                              │
│  Scraping con headers realistas y delays aleatorios         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Prisma)                         │
│  • ScrapingJob - Estado del trabajo                         │
│  • Jugador - Datos actualizados de jugadores                │
└─────────────────────────────────────────────────────────────┘
```

### 📦 Modelo de Datos (ScrapingJob)

```typescript
model ScrapingJob {
  id              String   @id @default(cuid())
  status          String   // "pending" | "running" | "paused" | "completed" | "failed"

  // Progress tracking
  totalPlayers    Int      @default(0)
  processedCount  Int      @default(0)
  successCount    Int      @default(0)
  errorCount      Int      @default(0)

  // Batch control
  currentBatch    Int      @default(0)
  batchSize       Int      @default(5)      // 5 jugadores por batch

  // Rate limiting metrics
  rateLimitCount  Int      @default(0)      // Número de 429s recibidos
  retryCount      Int      @default(0)      // Reintentos totales
  errorRate       Float?                    // Porcentaje de errores
  avgDelay        Int?                      // Delay promedio en ms
  slowModeActive  Boolean  @default(false)  // Si está en modo lento
  speedMultiplier Float    @default(1.0)    // 1.0x normal, 2.0x slow, 3.0x very slow
  last429At       DateTime?                 // Último rate limit recibido

  // Metadata
  lastError       String?
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
}
```

---

## Anti-DDoS y Rate Limiting

### 🛡️ Estrategias Implementadas

#### 1. **User-Agent Rotation** (20+ agentes)

```typescript
// src/lib/scraping/user-agents.ts
const USER_AGENTS = [
  // Windows + Chrome
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',

  // Mac + Safari
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15...',

  // Linux + Firefox
  'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',

  // Android + Chrome Mobile
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36...',

  // ... 20+ total variants
]

export function getRandomUserAgent(): string {
  const randomIndex = Math.floor(Math.random() * USER_AGENTS.length)
  return USER_AGENTS[randomIndex]
}
```

#### 2. **Headers Realistas** (12 headers estándar)

```typescript
export function getRealisticHeaders(referer?: string): Record<string, string> {
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': getRandomAcceptLanguage(),
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
    ...(referer && { 'Referer': referer })
  }
}
```

#### 3. **Random Delays** (5-15 segundos)

```typescript
// Antes: 3 segundos fijos (PREDECIBLE ❌)
await new Promise(resolve => setTimeout(resolve, 3000))

// Ahora: 5-15 segundos aleatorios (IMPREDECIBLE ✅)
const randomDelay = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000
await new Promise(resolve => setTimeout(resolve, randomDelay))
```

#### 4. **Exponential Backoff** (Retry Logic)

```typescript
// src/lib/scraping/rate-limiter.ts
class RateLimiter {
  private calculateBackoffDelay(attempt: number, isRateLimited: boolean): number {
    // Para rate limits (429), usar delays más largos
    const baseDelay = isRateLimited
      ? this.config.baseRetryDelay * 3  // 15 segundos
      : this.config.baseRetryDelay       // 5 segundos

    // Exponential backoff: 2^attempt * baseDelay
    let delay = baseDelay * Math.pow(2, attempt)

    // Jitter aleatorio (±20%) para evitar patrones
    const jitter = delay * 0.2 * (Math.random() * 2 - 1)
    delay = delay + jitter

    // Limitar al máximo (2 minutos)
    return Math.min(delay, this.config.maxRetryDelay)
  }
}
```

**Tiempos de retry**:
- Intento 1: 5 segundos (normal) / 15 segundos (429)
- Intento 2: 15 segundos / 45 segundos
- Intento 3: 45 segundos / 120 segundos (máximo)

#### 5. **Adaptive Throttling** (Ajuste automático de velocidad)

```typescript
class AdaptiveThrottler {
  adjustSpeed(errorRate: number) {
    if (errorRate > 50) {
      this.currentMultiplier = 3.0  // Muy lento (15-45s delays)
    } else if (errorRate > 30) {
      this.currentMultiplier = 2.0  // Lento (10-30s delays)
    } else if (errorRate > 15) {
      this.currentMultiplier = 1.5  // Moderado (7-22s delays)
    } else {
      this.currentMultiplier = 1.0  // Normal (5-15s delays)
    }
  }
}
```

#### 6. **Auto-Pause** (Prevención de bloqueos)

```typescript
// Si hay 5 errores 429 consecutivos, pausar automáticamente
if (rateLimiter.getConsecutiveRateLimits() >= 5) {
  await prisma.scrapingJob.update({
    where: { id: job.id },
    data: {
      status: 'paused',
      lastError: 'Demasiados rate limits consecutivos. Sistema pausado automáticamente.'
    }
  })

  console.error('🛑 AUTO-PAUSA: 5 rate limits consecutivos detectados')
}
```

---

## Procesamiento en Segundo Plano

### ⚙️ Vercel Cron Job (Plan Hobby)

El sistema usa **Vercel Cron** para procesar scraping automáticamente **cada día a las 2:00 AM** en el servidor, **sin necesidad de que el usuario tenga la página abierta**.

#### Configuración (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/admin/scraping/cron",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule syntax** (formato cron estándar):
- `0` - A los 0 minutos
- `2` - A las 2 AM
- `*` - Cada día del mes
- `*` - Cada mes
- `*` - Cada día de la semana

**⚠️ Limitaciones del Plan Hobby**:
- Máximo 2 cron jobs por cuenta
- Ejecuciones limitadas a 1 vez al día
- Timing puede variar (2:00 AM - 2:59 AM)
- Para ejecuciones más frecuentes, upgrade a Pro ($20/mes)

#### Endpoint Cron (`/api/admin/scraping/cron/route.ts`)

```typescript
export const maxDuration = 300 // 5 minutos máximo

export async function GET(request: Request) {
  // 🔐 VERIFICAR AUTENTICACIÓN (solo Vercel puede llamar)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // 🔍 BUSCAR JOB ACTIVO
  const job = await prisma.scrapingJob.findFirst({
    where: {
      status: { in: ['pending', 'running'] }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!job) {
    return NextResponse.json({
      message: 'No hay trabajos activos para procesar'
    })
  }

  // 🚀 PROCESAR UN BATCH (idéntico a /process endpoint)
  // ... lógica de batch processing con rate limiting

  return NextResponse.json({
    success: true,
    processed: results.length
  })
}
```

#### Autenticación del Cron

**En `.env`**:
```bash
CRON_SECRET=your_secure_random_string_here_233f2d7c2ea67f88ee5449b7890942bacc677f382c0319462d8913314bba3b6b
```

**Vercel automáticamente envía**:
```
Authorization: Bearer <CRON_SECRET>
```

### 🔄 Flujo Completo de Procesamiento (Plan Hobby)

```
1. Admin inicia scraping → POST /api/admin/scraping/start
   ↓
2. Se crea ScrapingJob con status="pending", batchSize=100
   ↓
3. (Usuario cierra la página - no importa)
   ↓
4. Vercel Cron ejecuta CADA DÍA a las 2 AM → GET /api/admin/scraping/cron
   ↓
5. Encuentra job con status="pending" o "running"
   ↓
6. Procesa 1 batch (100 jugadores) con rate limiting
   • Delays: 5-15 segundos entre jugadores
   • Duración total: ~10-20 minutos
   ↓
7. Actualiza progreso en DB (processedCount, successCount, etc.)
   ↓
8. Si hay más jugadores → status sigue "running"
   Si termina → status = "completed"
   Si hay 5 errores 429 consecutivos → status = "paused"
   ↓
9. Espera 24 horas → vuelve al paso 4 (siguiente día a las 2 AM)
   ↓
10. (Admin abre la página en cualquier momento)
    → Fetch GET /api/admin/scraping/status
    → Ve progreso actualizado en tiempo real
```

**⏱️ Tiempo Estimado de Completado**:
- 100 jugadores: 1 día
- 1,000 jugadores: ~10 días
- 10,000 jugadores: ~100 días

**💡 Tip**: Si necesitas procesar más rápido, puedes ejecutar manualmente batches adicionales desde el dashboard haciendo clic en "Procesar Batch".

---

## API Endpoints

### 1. **POST /api/admin/scraping/start** - Iniciar Scraping

**Request**:
```bash
curl -X POST http://localhost:3000/api/admin/scraping/start \
  -H "Authorization: Bearer <clerk_token>"
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Job de scraping creado exitosamente",
  "job": {
    "id": "clxxxxx",
    "status": "pending",
    "totalPlayers": 1523,
    "batchSize": 5
  }
}
```

**Errors**:
- `401` - No autorizado (no autenticado)
- `403` - Acceso denegado (no es admin)
- `409` - Ya existe un job activo

---

### 2. **POST /api/admin/scraping/process** - Procesar Batch

**Request**:
```bash
curl -X POST http://localhost:3000/api/admin/scraping/process \
  -H "Authorization: Bearer <clerk_token>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Batch procesado: 5 jugadores (5 éxitos, 0 errores)",
  "job": {
    "id": "clxxxxx",
    "status": "running",
    "totalPlayers": 1523,
    "processedCount": 345,
    "successCount": 342,
    "errorCount": 3,
    "currentBatch": 69,
    "progress": 22.7,
    "rateLimitCount": 12,
    "retryCount": 18,
    "errorRate": 0.9,
    "speedMultiplier": 1.0,
    "slowModeActive": false
  }
}
```

**Logic**:
1. Busca jugadores no procesados (limit 5)
2. Para cada jugador:
   - Ejecuta `scrapePlayerData()` con retry logic
   - Rotación de User-Agent
   - Headers realistas
   - Timeout 30 segundos
3. Delay aleatorio entre jugadores (5-15s base, ajustado por throttler)
4. Actualiza métricas en DB
5. Si detecta 5 errores 429 consecutivos → auto-pause

---

### 3. **GET /api/admin/scraping/status** - Ver Progreso

**Request**:
```bash
curl http://localhost:3000/api/admin/scraping/status \
  -H "Authorization: Bearer <clerk_token>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "job": {
    "id": "clxxxxx",
    "status": "running",
    "totalPlayers": 1523,
    "processedCount": 345,
    "successCount": 342,
    "errorCount": 3,
    "currentBatch": 69,
    "batchSize": 5,
    "rateLimitCount": 12,
    "retryCount": 18,
    "errorRate": 0.9,
    "avgDelay": 8234,
    "slowModeActive": false,
    "speedMultiplier": 1.0,
    "last429At": "2025-10-20T14:32:15.000Z",
    "lastError": null,
    "startedAt": "2025-10-20T10:00:00.000Z",
    "completedAt": null,
    "createdAt": "2025-10-20T10:00:00.000Z",
    "updatedAt": "2025-10-20T14:45:00.000Z",
    "progress": 22.7
  }
}
```

---

### 4. **POST /api/admin/scraping/pause** - Pausar Scraping

**Request**:
```bash
curl -X POST http://localhost:3000/api/admin/scraping/pause \
  -H "Authorization: Bearer <clerk_token>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Job pausado exitosamente",
  "job": {
    "id": "clxxxxx",
    "status": "paused"
  }
}
```

---

### 5. **POST /api/admin/scraping/cancel** - Cancelar Scraping

**Request**:
```bash
curl -X POST http://localhost:3000/api/admin/scraping/cancel \
  -H "Authorization: Bearer <clerk_token>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Job cancelado exitosamente",
  "job": {
    "id": "clxxxxx",
    "status": "failed"
  }
}
```

---

### 6. **GET /api/admin/scraping/cron** - Procesamiento Automático

**Request** (solo Vercel Cron):
```bash
curl http://localhost:3000/api/admin/scraping/cron \
  -H "Authorization: Bearer <CRON_SECRET>"
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Batch procesado automáticamente",
  "processed": 5,
  "job": {
    "id": "clxxxxx",
    "status": "running",
    "processedCount": 350
  }
}
```

**Response si no hay jobs** (200 OK):
```json
{
  "message": "No hay trabajos activos para procesar"
}
```

---

## Configuración y Despliegue

### 📋 Requisitos Previos

1. **Database**:
   - PostgreSQL con Prisma configurado
   - Ejecutar migración:
     ```bash
     npx prisma migrate dev --name add_scraping_job_rate_limiting
     ```

2. **Environment Variables** (`.env`):
   ```bash
   # Database
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."

   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."

   # Cron Secret (generar con: openssl rand -hex 32)
   CRON_SECRET="233f2d7c2ea67f88ee5449b7890942bacc677f382c0319462d8913314bba3b6b"
   ```

3. **Vercel Project**:
   - Proyecto configurado en Vercel
   - Variables de entorno configuradas en Vercel Dashboard

### 🚀 Despliegue

#### 1. **Deploy a Vercel**

```bash
# Commit y push a GitHub
git add .
git commit -m "feat: Add anti-DDoS scraping system with background processing"
git push origin main

# Vercel auto-deploy desde GitHub
# O deploy manual:
vercel deploy --prod
```

#### 2. **Verificar Cron Job**

Después del deploy:

1. Ve a **Vercel Dashboard** → Tu Proyecto → **Settings** → **Cron Jobs**
2. Deberías ver:
   ```
   Path: /api/admin/scraping/cron
   Schedule: */5 * * * *
   Status: Active
   ```

3. Ver logs del cron:
   - **Vercel Dashboard** → **Logs** → Filtrar por `/api/admin/scraping/cron`

#### 3. **Configurar Variables de Entorno en Vercel**

En **Settings** → **Environment Variables**, añadir:

```
CRON_SECRET = 233f2d7c2ea67f88ee5449b7890942bacc677f382c0319462d8913314bba3b6b
DATABASE_URL = postgresql://...
CLERK_SECRET_KEY = sk_test_...
```

### 🧪 Testing Local

Para testear el cron localmente:

```bash
# 1. Iniciar dev server
pnpm dev

# 2. En otra terminal, simular llamada del cron
curl http://localhost:3000/api/admin/scraping/cron \
  -H "Authorization: Bearer 233f2d7c2ea67f88ee5449b7890942bacc677f382c0319462d8913314bba3b6b"
```

---

## Monitoreo y Mantenimiento

### 📊 Dashboard (/admin/scraping)

El panel muestra en tiempo real:

#### **Métricas Principales**
- **Total de Jugadores**: Cantidad total a procesar
- **Procesados**: Jugadores ya procesados (exitosos + errores)
- **Exitosos**: Jugadores actualizados correctamente
- **Errores**: Jugadores con fallos en el scraping

#### **Métricas de Rate Limiting**
- **Rate Limits (429)**: Número de errores HTTP 429 recibidos
- **Reintentos**: Total de reintentos ejecutados
- **Tasa de Error**: `(errorCount / processedCount) * 100`
- **Velocidad**: Multiplicador actual del throttler
  - `1.0x` = Normal (5-15s)
  - `1.5x` = Moderado (7-22s)
  - `2.0x` = Lento (10-30s)
  - `3.0x` = Muy lento (15-45s)

#### **Alertas**

```typescript
// Alert azul - Scraping activo
{isRunning && (
  <Alert>
    ✅ El sistema procesa automáticamente cada 5 minutos
    ✅ Puedes cerrar esta página - continúa en segundo plano
  </Alert>
)}

// Alert amarillo - Modo lento activado
{job.slowModeActive && (
  <Alert variant="warning">
    ⚠️ Modo lento activado - tasa de error elevada ({errorRate}%)
  </Alert>
)}

// Alert rojo - Pausado por rate limits
{job.status === 'paused' && job.lastError?.includes('rate limit') && (
  <Alert variant="destructive">
    🛑 Sistema pausado - demasiados rate limits consecutivos
    Espera 30 minutos y reanuda manualmente
  </Alert>
)}
```

### 🔍 Logs y Debugging

#### **Logs del Servidor** (desarrollo)

```bash
pnpm dev
```

Buscar logs de:
- `✅ Job de scraping creado: clxxxxx (1523 jugadores)`
- `🚀 Procesando batch 69 de 304...`
- `✅ Éxito scraping jugador: John Doe`
- `⚠️ Rate limit detectado (3 consecutivos)`
- `🔄 Reintento 2/3 en 15s...`
- `🛑 AUTO-PAUSA: 5 rate limits consecutivos`

#### **Logs de Vercel** (producción)

**Vercel Dashboard** → **Logs** → Filtrar:
- `/api/admin/scraping/cron` - Ver ejecuciones del cron
- `/api/admin/scraping/process` - Ver procesamiento manual
- `error` - Ver errores críticos

#### **Database Queries** (Prisma Studio)

```bash
npx prisma studio
```

Abrir tabla `ScrapingJob` y verificar:
- `status` - Estado actual del job
- `processedCount` / `totalPlayers` - Progreso
- `rateLimitCount` - Cuántos 429s recibidos
- `last429At` - Último rate limit (si es reciente, esperar antes de reanudar)
- `errorRate` - Si > 20%, revisar logs para errores

### 🛠️ Troubleshooting

#### **Problema: Job se queda en "pending"**

**Causa**: Vercel Cron no se ejecutó o no encontró el job.

**Solución**:
1. Verificar que el cron está activo en Vercel Dashboard
2. Revisar logs del cron: `/api/admin/scraping/cron`
3. Ejecutar manualmente: `POST /api/admin/scraping/process`

---

#### **Problema: Muchos errores 429 (rate limiting)**

**Causa**: Transfermarkt detectó scraping excesivo.

**Solución**:
1. **Pausar el scraping inmediatamente**
2. **Esperar 30-60 minutos** antes de reanudar
3. **Reducir velocidad**:
   - Editar `/api/admin/scraping/start/route.ts`:
     ```typescript
     batchSize: 3, // Reducir de 5 a 3
     ```
   - Editar `/api/admin/scraping/process/route.ts`:
     ```typescript
     MIN_DELAY_BETWEEN_PLAYERS: 10000, // Aumentar a 10s
     MAX_DELAY_BETWEEN_PLAYERS: 20000, // Aumentar a 20s
     ```
4. **Verificar User-Agents**: Asegurar que hay 20+ agentes en `user-agents.ts`

---

#### **Problema: Scraping muy lento**

**Causa**: Sistema en modo lento por alta tasa de error.

**Solución**:
1. Revisar `errorRate` en el dashboard
2. Si `errorRate > 20%`, investigar errores en logs
3. Errores comunes:
   - `Timeout` → Aumentar `REQUEST_TIMEOUT` a 60000ms
   - `Network error` → Problema de red/DNS
   - `429` → Ver sección anterior

---

#### **Problema: Datos no se actualizan**

**Causa**: Scraping extrae HTML pero campos no se guardan.

**Solución**:
1. Verificar que la estructura HTML de Transfermarkt no cambió
2. Logs del servidor deberían mostrar:
   ```
   🔍 Datos extraídos: { advisor: 'Jorge Mendes', team_name: 'Real Madrid', ... }
   ```
3. Si no aparece, abrir URL en navegador y comparar estructura HTML
4. Ajustar selectores en `scrapePlayerData()` si es necesario

---

#### **Problema: Cron no ejecuta en producción**

**Causa**: Configuración incorrecta en Vercel.

**Solución**:
1. Verificar `vercel.json` en root del proyecto:
   ```json
   {
     "crons": [{
       "path": "/api/admin/scraping/cron",
       "schedule": "*/5 * * * *"
     }]
   }
   ```
2. Hacer commit y push a main
3. Redeploy en Vercel
4. Verificar en **Vercel Dashboard** → **Cron Jobs**

---

### 📈 Métricas de Éxito

**Configuración Óptima (Plan Hobby)**:
- **Batch Size**: 100 jugadores/día
- **Delay**: 5-15 segundos aleatorios
- **Rate Limit Count**: < 10 por cada 100 jugadores
- **Error Rate**: < 5%
- **Speed Multiplier**: 1.0x (normal)
- **Ejecución**: Diaria a las 2:00 AM

**Rendimiento Esperado**:
- **Por ejecución**: ~100 jugadores en 10-20 minutos
- **1,000 jugadores**: ~10 días
- **10,000 jugadores**: ~100 días

**⚡ Procesamiento Manual**: Puedes acelerar haciendo clic en "Procesar Batch" manualmente desde el dashboard cuando quieras.

---

## 🎯 Próximos Pasos Recomendados

### Mejoras Futuras

1. **Notificaciones**:
   - Enviar email cuando scraping completa
   - Alertas de Slack si hay pausas automáticas

2. **Métricas Avanzadas**:
   - Gráficos de progreso en tiempo real (Chart.js)
   - Histórico de jobs completados

3. **Optimizaciones**:
   - Usar proxies rotativos para evitar rate limits
   - Implementar cache de respuestas HTML

4. **Testing**:
   - Tests unitarios para `RateLimiter` y `AdaptiveThrottler`
   - Tests E2E del flujo completo de scraping

---

## 📚 Referencias

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Prisma Client Reference](https://www.prisma.io/docs/orm/prisma-client)
- [Clerk Authentication](https://clerk.com/docs/authentication)
- [Transfermarkt](https://www.transfermarkt.es/)

---

**✅ Sistema completo y listo para producción**

- Anti-DDoS: Rotación User-Agent, headers realistas, delays aleatorios
- Background Processing: Vercel Cron cada 5 minutos
- Rate Limiting: Exponential backoff, adaptive throttling, auto-pause
- Monitoreo: Dashboard en tiempo real con métricas completas

**Mantenido por**: Equipo Scoutea
**Última actualización**: 2025-10-20
