# 🕷️ Sistema de Scraping Escalable para Miles de Jugadores

## 📋 Resumen

Se ha implementado un sistema robusto y escalable de scraping de datos de Transfermarkt que puede procesar **miles de jugadores sin problemas de timeout**.

## ✅ Mejoras Implementadas

### 1. **Procesamiento por Lotes (Batch Processing)**
- Divide el trabajo en lotes de 10 jugadores
- Cada lote se procesa en una request HTTP separada
- Tiempo máximo por batch: 5 minutos (configurado con `maxDuration = 300`)
- Sin riesgo de timeouts en Vercel

### 2. **Persistencia de Progreso**
- Nueva tabla `ScrapingJob` en la base de datos
- Guarda el estado del trabajo: pending, running, paused, completed, failed
- Tracking de progreso: total, procesados, exitosos, errores
- Se puede reanudar desde donde se detuvo si se interrumpe

### 3. **Procesamiento Automático**
- El frontend hace polling cada 2 segundos
- Procesa automáticamente el siguiente batch hasta completar todos los jugadores
- No requiere intervención manual

### 4. **Control Total**
- **Iniciar**: Crea un nuevo trabajo de scraping
- **Pausar**: Detiene temporalmente el procesamiento
- **Reanudar**: Continúa desde donde se pausó
- **Cancelar**: Termina permanentemente el trabajo
- **Reset**: Limpia la interfaz para empezar de nuevo

### 5. **Monitoreo en Tiempo Real**
- Dashboard con métricas en vivo:
  - Total de jugadores
  - Jugadores procesados
  - Exitosos
  - Errores
  - Barra de progreso (%)
- Logs detallados con timestamps
- Estado visible del job

## 🗂️ Estructura de Archivos

### Base de Datos
```
prisma/schema.prisma
└── model ScrapingJob
    ├── id: String (ID único del job)
    ├── status: String (pending, running, paused, completed, failed)
    ├── totalPlayers: Int (total de jugadores a procesar)
    ├── processedCount: Int (jugadores procesados hasta ahora)
    ├── successCount: Int (jugadores exitosos)
    ├── errorCount: Int (jugadores con error)
    ├── currentBatch: Int (número del batch actual)
    ├── batchSize: Int (tamaño del batch, default: 10)
    └── timestamps (startedAt, completedAt, lastProcessedAt)
```

### API Routes
```
src/app/api/admin/scraping/
├── start/route.ts       - POST: Iniciar nuevo job
├── process/route.ts     - POST: Procesar siguiente batch
├── status/route.ts      - GET: Obtener estado del job
├── pause/route.ts       - POST: Pausar job activo
└── cancel/route.ts      - POST: Cancelar job activo
```

### Frontend
```
src/app/admin/scraping/page.tsx - Dashboard interactivo
```

## 🔧 API Endpoints

### 1. Iniciar Scraping
```bash
POST /api/admin/scraping/start
```
**Respuesta:**
```json
{
  "success": true,
  "message": "Job de scraping creado exitosamente",
  "job": {
    "id": "clxxx...",
    "status": "pending",
    "totalPlayers": 1500,
    "batchSize": 10
  }
}
```

### 2. Procesar Batch
```bash
POST /api/admin/scraping/process
```
**Respuesta:**
```json
{
  "success": true,
  "completed": false,
  "message": "Batch procesado: 9 exitosos, 1 errores",
  "job": {
    "id": "clxxx...",
    "status": "running",
    "totalPlayers": 1500,
    "processedCount": 10,
    "successCount": 9,
    "errorCount": 1,
    "currentBatch": 1,
    "progress": 1
  },
  "results": [
    {
      "playerId": "xxx",
      "playerName": "Lionel Messi",
      "url": "https://www.transfermarkt.es/...",
      "success": true,
      "fieldsUpdated": ["team_name", "position_player", "height", ...]
    },
    ...
  ]
}
```

### 3. Obtener Estado
```bash
GET /api/admin/scraping/status
```
**Respuesta:**
```json
{
  "exists": true,
  "job": {
    "id": "clxxx...",
    "status": "running",
    "totalPlayers": 1500,
    "processedCount": 150,
    "successCount": 145,
    "errorCount": 5,
    "progress": 10,
    "currentBatch": 15,
    ...
  }
}
```

### 4. Pausar/Cancelar
```bash
POST /api/admin/scraping/pause   # Pausar
POST /api/admin/scraping/cancel  # Cancelar
```

## 📊 Campos Extraídos (14 campos)

El sistema extrae los siguientes campos de cada jugador desde Transfermarkt:

1. **advisor** - Nombre del agente/asesor
2. **url_trfm_advisor** - URL del perfil del asesor
3. **date_of_birth** - Fecha de nacimiento
4. **team_name** - Equipo actual
5. **team_loan_from** - Equipo del que está cedido
6. **position_player** - Posición del jugador
7. **foot** - Pie dominante
8. **height** - Altura en cm
9. **nationality_1** - Nacionalidad principal
10. **nationality_2** - Nacionalidad secundaria
11. **national_tier** - Nivel de selección nacional
12. **agency** - Agencia representante
13. **contract_end** - Fecha de fin de contrato
14. **player_trfm_value** - Valor de mercado en €

## ⚙️ Configuración

### Tamaño de Batch
Por defecto: **10 jugadores por batch**

Puedes ajustarlo en `src/app/api/admin/scraping/start/route.ts`:
```typescript
batchSize: 10  // Cambiar aquí
```

### Pausas Entre Requests
- **Entre jugadores**: 3 segundos (evita rate limiting de Transfermarkt)
- **Entre batches**: Automático (2 segundos polling del frontend)

### Timeout por Batch
Configurado en `src/app/api/admin/scraping/process/route.ts`:
```typescript
export const maxDuration = 300  // 5 minutos (máximo en Vercel)
```

## 🚀 Uso

### 1. Acceder a la interfaz
```
https://tu-dominio.com/admin/scraping
```

### 2. Iniciar Scraping
1. Haz clic en "Iniciar Scraping"
2. El sistema creará un nuevo job
3. El procesamiento comenzará automáticamente

### 3. Monitorear Progreso
- Observa las métricas en tiempo real
- Lee los logs para ver detalles de cada jugador
- La barra de progreso muestra el % completado

### 4. Control del Proceso
- **Pausar**: Detiene temporalmente (puedes cerrar la página)
- **Reanudar**: Continúa desde donde se pausó
- **Cancelar**: Termina permanentemente el job
- **Reset**: Limpia la interfaz

## 🎯 Ventajas del Nuevo Sistema

### ✅ Escalabilidad
- Puede procesar **miles o millones** de jugadores
- No hay límite de tiempo total
- Cada batch es independiente

### ✅ Resiliencia
- Si falla un batch, continúa con el siguiente
- El progreso se guarda en la base de datos
- Puedes cerrar el navegador y reanudar después

### ✅ Control
- Pausar/reanudar en cualquier momento
- Cancelar si es necesario
- Monitoreo en tiempo real

### ✅ Rendimiento
- Procesamiento paralelo dentro de cada batch
- Pausas configurables para evitar bloqueos
- Rate limiting inteligente

## 📈 Ejemplo de Uso Real

### Escenario: 5,000 jugadores

- **Batch size**: 10 jugadores
- **Total batches**: 500 batches
- **Tiempo por jugador**: ~5 segundos (con pausa de 3 seg)
- **Tiempo por batch**: ~50 segundos
- **Tiempo total estimado**: ~7 horas

El sistema procesará automáticamente todos los batches sin intervención manual.

## 🔍 Troubleshooting

### Job se queda en "running"
1. Verifica los logs en la interfaz
2. Revisa los logs del servidor
3. Usa el botón "Cancelar" y crea un nuevo job

### Rate limiting de Transfermarkt
- Aumenta la pausa entre jugadores en `process/route.ts`
- Reduce el tamaño del batch

### Errores frecuentes en ciertos jugadores
- Verifica la estructura HTML de Transfermarkt
- Actualiza los regex de scraping si cambió el HTML
- Los errores no detienen el proceso completo

## 🔐 Seguridad

- Solo usuarios con rol **admin** pueden ejecutar scraping
- Autenticación mediante Clerk
- Validación en todos los endpoints
- No se exponen URLs o datos sensibles

## 📝 Logs y Auditoría

El sistema registra:
- Fecha/hora de inicio y fin
- Total de jugadores procesados
- Jugadores exitosos vs errores
- Detalles de cada jugador procesado
- Errores específicos por jugador

Todos los logs están disponibles en:
1. Interfaz web (tiempo real)
2. Console del servidor
3. Base de datos (tabla `ScrapingJob`)

## 🎉 Conclusión

El nuevo sistema está **completamente preparado para scrapear miles de jugadores** de manera eficiente, robusta y sin timeouts. ✅
