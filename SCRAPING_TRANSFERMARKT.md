# 🕷️ Sistema de Scraping de Transfermarkt

**Fecha de creación:** 2025-10-15
**Estado:** ✅ Implementado y funcional

---

## 📋 Descripción General

El sistema de scraping automático extrae datos de perfiles de jugadores desde Transfermarkt.es y actualiza automáticamente la base de datos con información actualizada.

### 🎯 Propósito
- Automatizar la actualización de datos de jugadores
- Reducir la entrada manual de datos
- Mantener la información actualizada desde fuente confiable
- Procesar múltiples jugadores de forma eficiente

---

## 🔧 Componentes del Sistema

### 1. **Endpoint API**
**Archivo:** `/src/app/api/admin/scraping-transfermarkt/route.ts`

**Ruta:** `POST /api/admin/scraping-transfermarkt`

**Autenticación:**
- Requiere usuario autenticado (Clerk)
- Solo accesible para usuarios con rol `admin`

**Funcionalidades:**
- Obtiene jugadores con URL de Transfermarkt (`url_trfm`)
- Procesa jugadores en lotes de 5
- Implementa pausas entre jugadores (5 segundos) y lotes (30 segundos)
- Registra logs detallados del proceso
- Actualiza campos en la base de datos

### 2. **Página de Interfaz**
**Archivo:** `/src/app/admin/scraping/page.tsx`

**Ruta:** `/admin/scraping`

**Características:**
- Botón "Iniciar Scraping" para ejecutar el proceso
- Botón "Detener" (futuro: interrumpir proceso en curso)
- Botón "Reset" para limpiar estadísticas
- Panel de estadísticas en tiempo real:
  - Total de jugadores
  - Jugadores procesados
  - Scraping exitosos
  - Errores encontrados
- Console de logs con scroll automático
- Instrucciones detalladas de uso

### 3. **Botón de Acceso Rápido**
**Ubicación:** `/admin/jugadores` (página principal de jugadores)

**Código:**
```tsx
<Button
  variant='outline'
  className='border-slate-700 bg-[#131921] text-white hover:bg-slate-700'
  onClick={() => window.open('/admin/scraping', '_blank')}
>
  <Globe className='h-4 w-4 mr-2' />
  Scraping URL
</Button>
```

---

## 📊 Campos Extraídos (13 + 1 URL)

El sistema extrae **13 campos de datos** de cada perfil de Transfermarkt:

| # | Campo BD | Descripción | Tipo | Ejemplo |
|---|----------|-------------|------|---------|
| 1 | `advisor` | Nombre del agente/asesor | `text` | "Jorge Mendes" |
| 2 | `date_of_birth` | Fecha de nacimiento | `date` | "1987-02-05" |
| 3 | `team_name` | Equipo actual | `text` | "Real Madrid CF" |
| 4 | `team_loan_from` | Equipo de cesión | `text` | "Manchester City" |
| 5 | `position_player` | Posición principal | `text` | "Delantero centro" |
| 6 | `foot` | Pie dominante | `text` | "derecho", "izquierdo", "ambidiestro" |
| 7 | `height` | Altura en cm | `number` | 185 |
| 8 | `nationality_1` | Nacionalidad principal | `text` | "España" |
| 9 | `nationality_2` | Segunda nacionalidad | `text` | "Brasil" |
| 10 | `national_tier` | Nivel selección | `text` | "España Absoluta", "España Sub-21" |
| 11 | `agency` | Agencia representante | `text` | "Gestifute" |
| 12 | `contract_end` | Fin de contrato | `date` | "2025-06-30" |
| 13 | `player_trfm_value` | Valor de mercado | `number` | 75000000 (en €) |

**Campo adicional:**
- `url_trfm_advisor` - URL del perfil del advisor en Transfermarkt

---

## ⚙️ Configuración del Scraping

### Parámetros de Control
```typescript
const BATCH_SIZE = 5                 // Jugadores por lote
const DELAY_BETWEEN_PLAYERS = 5000   // 5 segundos entre jugadores
const DELAY_BETWEEN_BATCHES = 30000  // 30 segundos entre lotes
```

### Headers HTTP
```typescript
{
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Referer': 'https://www.transfermarkt.es/',
  'Cache-Control': 'no-cache'
}
```

---

## 🔄 Flujo de Ejecución

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario hace click en "Iniciar Scraping"               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Frontend llama a POST /api/admin/scraping-transfermarkt│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Backend verifica autenticación y rol admin             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Query BD: Obtener jugadores con url_trfm               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Dividir jugadores en lotes de 5                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────┴──────────────────┐
        │                                      │
        ▼                                      ▼
┌─────────────────┐                  ┌─────────────────┐
│   LOTE 1        │                  │   LOTE 2        │
│   5 jugadores   │   ⏱️ 30s pausa   │   5 jugadores   │
└─────────────────┘                  └─────────────────┘
        │                                      │
        ▼                                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Para cada jugador:                                         │
│  1. Fetch HTML de Transfermarkt                             │
│  2. Parsear 13 campos usando regex                          │
│  3. Actualizar BD con Prisma                                │
│  4. Registrar resultado (éxito/error)                       │
│  5. Pausa 5 segundos (excepto último del lote)              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Retornar respuesta JSON con estadísticas completas      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Frontend muestra logs y actualiza contadores            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Formato de Respuesta API

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Scraping completado: 8 exitosos, 2 errores",
  "results": {
    "total": 10,
    "processed": 10,
    "success": 8,
    "errors": 2,
    "details": [
      {
        "playerId": "player_123",
        "playerName": "Lionel Messi",
        "url": "https://www.transfermarkt.es/lionel-messi/profil/spieler/28003",
        "success": true,
        "fieldsUpdated": [
          "advisor",
          "date_of_birth",
          "team_name",
          "position_player",
          "foot",
          "height",
          "nationality_1",
          "agency",
          "contract_end",
          "player_trfm_value",
          "url_trfm_advisor"
        ]
      },
      {
        "playerId": "player_456",
        "playerName": "Cristiano Ronaldo",
        "url": "https://www.transfermarkt.es/cristiano-ronaldo/profil/spieler/8198",
        "success": false,
        "fieldsUpdated": [],
        "error": "HTTP Error 404: Not Found"
      }
    ]
  }
}
```

### Respuesta de Error (401/403/500)
```json
{
  "error": "No autorizado. Debes iniciar sesión."
}
```

---

## 🛡️ Seguridad y Buenas Prácticas

### 1. **Autenticación Obligatoria**
- Solo admins pueden ejecutar scraping
- Token de Clerk validado en cada request

### 2. **Rate Limiting**
- 5 segundos entre jugadores
- 30 segundos entre lotes
- Previene bloqueos por parte de Transfermarkt

### 3. **Manejo de Errores**
- Try-catch en cada jugador individual
- Un error no detiene el proceso completo
- Logs detallados de cada error

### 4. **Headers Realistas**
- User-Agent de navegador real
- Referer de Transfermarkt
- Accept-Language en español

### 5. **Parsing Defensivo**
- Validación de cada campo extraído
- Conversión segura de tipos (fechas, números)
- Campos opcionales no rompen el proceso

---

## 🔍 Funciones de Parsing

### 1. **scrapePlayerData(url)**
Función principal que extrae los 13 campos de un perfil.

**Técnicas utilizadas:**
- **Regex patterns** para extraer datos del HTML
- **Parsing de fechas** en formato español ("1 de enero de 1990")
- **Conversión de unidades** (metros → cm)
- **Conversión de valores** (millones → número)

### 2. **parseDateString(dateStr)**
Convierte fechas en formato español a objetos Date.

**Formatos soportados:**
- "1 de enero de 1990"
- "1/1/1990"

### 3. **parseContractDate(dateStr)**
Similar a parseDateString pero específico para fechas de contrato.

**Formatos soportados:**
- "30/06/2025"
- "30 de junio de 2025"

---

## 📊 Casos de Uso

### Caso 1: Actualización Masiva Inicial
**Escenario:** Tienes 100 jugadores con URL de Transfermarkt pero sin datos completos.

**Proceso:**
1. Click en "Scraping URL" desde `/admin/jugadores`
2. Click en "Iniciar Scraping"
3. Esperar ~10 minutos (100 jugadores / 5 por lote × 30s pausa)
4. Verificar logs y estadísticas
5. Revisar campos actualizados en la tabla de jugadores

**Resultado:** 13 campos actualizados para cada jugador exitoso.

### Caso 2: Actualización Periódica
**Escenario:** Actualizar valores de mercado semanalmente.

**Proceso:**
1. Ejecutar scraping cada semana
2. Solo se actualizan jugadores con `url_trfm`
3. Los valores existentes se sobrescriben con datos nuevos

**Nota:** Implementar cron job o tarea programada en el futuro.

### Caso 3: Verificación de Datos Corregidos
**Escenario:** Tienes campos `correct_*` pero quieres verificar si el dato original cambió.

**Proceso:**
1. Ejecutar scraping
2. Comparar campos originales con `correct_*`
3. Si el dato scraped ahora coincide con `correct_*`, eliminar corrección

---

## ⚠️ Limitaciones y Consideraciones

### 1. **Dependencia de Estructura HTML**
- El scraping usa regex sobre HTML
- Si Transfermarkt cambia su estructura, los regex pueden fallar
- **Solución:** Actualizar patterns en `scrapePlayerData()`

### 2. **Rate Limiting de Transfermarkt**
- Transfermarkt puede bloquear IPs con muchas requests
- Las pausas de 5s y 30s minimizan este riesgo
- **Solución:** Aumentar pausas si se detectan bloqueos

### 3. **Datos Opcionales**
- No todos los jugadores tienen todos los campos
- Campos como `nationality_2`, `team_loan_from` son opcionales
- **Comportamiento:** Se guardan como `null` si no existen

### 4. **Formato de Datos**
- Fechas en formato español deben parsearse correctamente
- Valores de mercado en millones/miles deben convertirse
- **Solución:** Funciones de parsing específicas

### 5. **Sin Cancelación**
- Actualmente no se puede cancelar un scraping en progreso
- El botón "Detener" solo marca la bandera pero no interrumpe
- **Mejora futura:** Implementar cancelación con AbortController

---

## 🚀 Mejoras Futuras

### 1. **Scraping Incremental**
```typescript
// Solo scrapear jugadores actualizados hace más de X días
const staleThreshold = 30 // días
const query = {
  url_trfm: { not: null },
  OR: [
    { updated_at: { lt: new Date(Date.now() - staleThreshold * 24 * 60 * 60 * 1000) } },
    { updated_at: null }
  ]
}
```

### 2. **Scraping Programado (Cron)**
```typescript
// Ejecutar automáticamente cada domingo a las 3 AM
import { CronJob } from 'cron'

const job = new CronJob('0 3 * * 0', async () => {
  await runTransfermarktScraping()
})
```

### 3. **Notificaciones**
- Email al admin cuando scraping termina
- Notificación si hay más de X% errores
- Alert si se detectan bloqueos

### 4. **Dashboard de Historial**
- Tabla con historial de ejecuciones
- Gráfico de éxitos/errores por fecha
- Log de cambios detectados

### 5. **Scraping Selectivo**
- Checkbox para seleccionar jugadores específicos
- Filtro por equipo/posición antes de scrapear
- Priorización por `player_rating`

### 6. **Retry Automático**
- Reintentar jugadores fallidos automáticamente
- Backoff exponencial en caso de rate limit
- Queue system para manejar grandes volúmenes

### 7. **Validación de Datos**
- Comparar con datos existentes antes de actualizar
- Alertar si hay cambios drásticos (ej. edad diferente)
- Modo "dry-run" para ver qué cambiaría sin guardar

---

## 🧪 Testing

### Test Manual
1. Crear jugador de prueba con URL de Transfermarkt real
2. Ejecutar scraping desde interfaz
3. Verificar que los 13 campos se actualicen correctamente
4. Verificar logs en consola del servidor

### Test de Errores
1. Jugador con URL inválida → debe registrar error pero continuar
2. Jugador con URL 404 → debe marcar como error
3. Sin jugadores con `url_trfm` → debe retornar mensaje apropiado

### Test de Performance
1. 50 jugadores → ~8 minutos
2. 100 jugadores → ~16 minutos
3. Verificar que no se bloquee el servidor

---

## 📚 Recursos y Referencias

- **Transfermarkt.es:** https://www.transfermarkt.es/
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Clerk Authentication:** https://clerk.com/docs

---

## 📞 Soporte

### Problemas Comunes

**Error: "No autorizado"**
- Verificar que el usuario esté logueado
- Verificar que el usuario tenga rol `admin`

**Error: "HTTP Error 403"**
- Transfermarkt bloqueó la IP
- Aumentar pausas entre requests
- Esperar 1 hora y reintentar

**Error: "No hay jugadores con URL"**
- Verificar que existan jugadores con `url_trfm` en la BD
- Ejecutar query: `SELECT COUNT(*) FROM jugador WHERE url_trfm IS NOT NULL`

**Campos no se actualizan**
- Verificar que los regex en `scrapePlayerData()` coincidan con HTML actual
- Inspeccionar HTML de Transfermarkt manualmente
- Actualizar patterns si cambió la estructura

---

**Última actualización:** 2025-10-15
**Mantenido por:** Equipo de desarrollo Scoutea
**Versión:** 1.0.0
