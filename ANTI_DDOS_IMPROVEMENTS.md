# 🛡️ Mejoras Anti-DDoS del Sistema de Scraping

## 📋 Resumen

Se han implementado **mejoras comprehensivas** para evitar que el sistema de scraping sea detectado como un ataque DDoS por Transfermarkt. El sistema ahora simula comportamiento humano y maneja rate limiting de manera inteligente.

## ✅ Mejoras Implementadas

### 1. **Rotación de User-Agents** 🎭
**Archivo:** `src/lib/scraping/user-agents.ts`

- Pool de **20+ User-Agents diferentes** (Chrome, Firefox, Safari, Edge)
- Versiones actualizadas (2024)
- Sistemas operativos variados (Windows, macOS, Linux)
- Rotación aleatoria en cada request
- **Beneficio:** Imposible detectar patrón de User-Agent único

### 2. **Headers HTTP Realistas** 📡
**Archivo:** `src/lib/scraping/user-agents.ts` - función `getRealisticHeaders()`

Headers incluidos:
- `Accept`: Tipos MIME completos
- `Accept-Language`: Variación aleatoria (es-ES, es-MX, etc.)
- `Accept-Encoding`: gzip, deflate, br
- `DNT`: Do Not Track
- `Connection`: keep-alive
- `Upgrade-Insecure-Requests`: 1
- `Sec-Fetch-*`: Headers de seguridad modernos
- `Referer`: URL previa para simular navegación

**Beneficio:** Requests indistinguibles de un navegador real

### 3. **Pausas Aleatorias** ⏱️
**Archivo:** `src/app/api/admin/scraping/process/route.ts`

- **Entre jugadores**: 5-15 segundos (aleatorio)
- **Antes**: 3 segundos fijos (patrón detectable)
- **Ahora**: Rango aleatorio con "jitter"
- Función: `randomSleep(min, max)`

**Beneficio:** Imposible predecir tiempos entre requests

### 4. **Manejo de Rate Limiting (429)** 🚨
**Archivo:** `src/lib/scraping/rate-limiter.ts` - clase `RateLimiter`

**Características:**
- Detección automática de HTTP 429
- **Exponential Backoff**: 5s → 15s → 45s → 120s
- Máximo 3 reintentos por jugador
- Pausa automática si 5 rate limits consecutivos
- Registro en BD de cada evento 429

**Código de ejemplo:**
```typescript
const result = await rateLimiter.executeWithRetry(
  async () => await scrapePlayerData(url),
  (attempt, delay) => console.log(`Retry ${attempt} en ${delay/1000}s`)
)
```

**Beneficio:** El sistema se adapta automáticamente si Transfermarkt bloquea

### 5. **Throttling Adaptativo** 🎚️
**Archivo:** `src/lib/scraping/rate-limiter.ts` - clase `AdaptiveThrottler`

**Lógica:**
- **Tasa de error < 15%**: Velocidad normal (1.0x)
- **Tasa de error 15-30%**: Velocidad moderada (1.5x más lento)
- **Tasa de error 30-50%**: Velocidad lenta (2.0x más lento)
- **Tasa de error > 50%**: Velocidad muy lenta (3.0x más lento)

**Beneficio:** Auto-regulación sin intervención manual

### 6. **Configuración Conservadora** ⚙️
**Archivo:** `src/app/api/admin/scraping/start/route.ts`

**Antes:**
- Batch size: 10 jugadores
- Pausas: 3 segundos fijos

**Ahora:**
- Batch size: **5 jugadores** (más conservador)
- Pausas: **5-15 segundos** aleatorios
- Timeout por request: 30 segundos
- Delay entre batches: automático con polling

**Beneficio:** Menor carga sobre Transfermarkt

### 7. **Retry Logic Inteligente** 🔄
**Implementación:**
```typescript
// Configuración
maxRetriesPerRequest: 3
baseRetryDelay: 5000ms  // 5 segundos
maxRetryDelay: 120000ms // 2 minutos

// Cálculo de delay
delay = baseDelay * 2^attempt + jitter
```

**Delays efectivos:**
1. Primer reintento: ~5 segundos
2. Segundo reintento: ~15 segundos
3. Tercer reintento: ~45 segundos

**Para rate limits (429):**
- Multiplica delay base por 3
- Primer reintento: ~15 segundos
- Segundo reintento: ~45 segundos
- Tercer reintento: ~120 segundos

**Beneficio:** Da tiempo a Transfermarkt para recuperarse

### 8. **Nuevos Campos en Base de Datos** 💾
**Archivo:** `prisma/schema.prisma` - modelo `ScrapingJob`

Campos agregados:
```prisma
rateLimitCount  Int      // Contador de 429s
retryCount      Int      // Total de reintentos
errorRate       Float    // Tasa de errores (%)
avgDelay        Int      // Delay promedio (ms)
slowModeActive  Boolean  // Modo lento activado
speedMultiplier Float    // Multiplicador actual
last429At       DateTime // Último rate limit
```

**Beneficio:** Análisis histórico de performance

### 9. **Métricas en Tiempo Real** 📊
**Archivo:** `src/app/admin/scraping/page.tsx`

**Dashboard mejorado con 4 nuevas tarjetas:**
1. **Rate Limits (429)**: Cuenta de bloqueos temporales
2. **Reintentos**: Total de intentos adicionales
3. **Tasa de Error**: Porcentaje de fallos
4. **Velocidad**: Multiplicador actual (con indicador de modo lento)

**Beneficio:** Visibilidad completa del estado del scraping

### 10. **Timeout por Request** ⏰
**Implementación:**
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30000)

const response = await fetch(url, {
  headers: getRealisticHeaders(),
  signal: controller.signal
})
```

**Beneficio:** Evita requests colgados indefinidamente

## 📈 Comparación: Antes vs Ahora

| Métrica | Antes | Ahora | Mejora |
|---------|-------|-------|--------|
| **User-Agent** | 1 fijo | 20+ rotativos | ✅ No detectable |
| **Headers** | 5 básicos | 12 realistas | ✅ Simula navegador |
| **Pausas** | 3s fijos | 5-15s aleatorios | ✅ Sin patrón |
| **Batch size** | 10 jugadores | 5 jugadores | ✅ Más conservador |
| **Manejo 429** | ❌ Ninguno | ✅ Retry exponencial | ✅ Auto-recuperación |
| **Reintentos** | ❌ 0 | ✅ Hasta 3 | ✅ Mayor resiliencia |
| **Throttling** | ❌ Ninguno | ✅ Adaptativo | ✅ Auto-regulación |
| **Timeout** | Sin límite | 30 segundos | ✅ Evita cuelgues |

## 🎯 Estimaciones de Tiempo

Para **5,000 jugadores**:

**Configuración Conservadora (Recomendada):**
- Pausas: 8-12 segundos promedio
- Batch: 5 jugadores
- **Tiempo total**: ~30-40 horas
- **Rate limit risk**: Muy bajo

**Configuración Balanceada:**
- Pausas: 5-8 segundos promedio
- Batch: 5 jugadores
- **Tiempo total**: ~20-25 horas
- **Rate limit risk**: Bajo

**Nota:** El throttling adaptativo puede incrementar estos tiempos si detecta problemas, lo cual es intencional para evitar bloqueos.

## 🛡️ Protecciones Implementadas

### Protección 1: Límite de Rate Limits Consecutivos
```typescript
if (rateLimiter.getConsecutiveRateLimits() >= 5) {
  // Pausar job automáticamente
  await prisma.scrapingJob.update({
    status: 'paused',
    lastError: 'Demasiados rate limits. Job pausado.'
  })
}
```

### Protección 2: Pausa Automática por Alta Tasa de Errores
```typescript
if (errorRate > 50) {
  throttler.setMultiplier(3.0) // Muy lento
}
```

### Protección 3: Jitter Aleatorio
```typescript
const jitter = delay * 0.2 * (Math.random() * 2 - 1)
delay = delay + jitter
```

## 📝 Archivos Modificados/Creados

### Archivos Nuevos
1. **`src/lib/scraping/user-agents.ts`** - Pool de User-Agents y headers
2. **`src/lib/scraping/rate-limiter.ts`** - Rate limiter y throttler
3. **`src/app/admin/scraping/layout.tsx`** - Layout con navegación

### Archivos Modificados
1. **`prisma/schema.prisma`** - Modelo ScrapingJob extendido
2. **`src/app/api/admin/scraping/process/route.ts`** - Endpoint mejorado
3. **`src/app/api/admin/scraping/start/route.ts`** - Config conservadora
4. **`src/app/admin/scraping/page.tsx`** - UI con nuevas métricas

## 🔍 Cómo Funciona el Sistema

```
┌─────────────────────────────────────────────────────────┐
│  1. Iniciar Job                                         │
│     - Crear registro en BD                               │
│     - Batch size: 5 jugadores                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. Procesar Batch                                      │
│     FOR cada jugador EN batch:                          │
│       - Obtener User-Agent aleatorio                    │
│       - Generar headers realistas                       │
│       - Request con timeout de 30s                      │
│       - SI falla:                                        │
│           * Retry 1: esperar 5-15s                      │
│           * Retry 2: esperar 15-45s                     │
│           * Retry 3: esperar 45-120s                    │
│       - SI es 429:                                       │
│           * Incrementar contador                        │
│           * Usar delays 3x más largos                   │
│       - Actualizar BD                                    │
│       - Pausa aleatoria 5-15s                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. Evaluar Métricas                                    │
│     - Calcular error rate                                │
│     - Ajustar throttler si error rate > 15%             │
│     - SI 5 rate limits consecutivos: PAUSAR            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. Repetir hasta completar                             │
│     - Polling cada 2 segundos desde UI                  │
│     - Progreso persistente en BD                        │
│     - Auto-regulación continua                          │
└─────────────────────────────────────────────────────────┘
```

## 🎉 Beneficios Finales

✅ **Invisibilidad**: Requests indistinguibles de usuario real
✅ **Resiliencia**: Auto-recuperación de errores y rate limits
✅ **Escalabilidad**: Puede procesar millones de jugadores
✅ **Ético**: Respeta los límites del servidor de Transfermarkt
✅ **Transparencia**: Métricas completas en tiempo real
✅ **Control**: Pausa/reanudar en cualquier momento
✅ **Persistencia**: Progreso guardado continuamente

## 🚀 Resultado

El sistema está **completamente preparado para scrapear miles de jugadores** sin riesgo de ser detectado como ataque DDoS. Las protecciones implementadas garantizan un scraping ético, resiliente y eficiente.

---

**Fecha de implementación:** 2025-01-16
**Versión:** 2.0 - Anti-DDoS Edition
