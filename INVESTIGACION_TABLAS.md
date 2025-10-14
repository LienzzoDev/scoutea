# 🔍 Investigación: sequence_counters y radar_metrics

**Fecha:** Enero 2025
**Estado:** Análisis Completo

---

## 📊 TABLA: sequence_counters

### 🎯 Propósito

Tabla de **contadores secuenciales** para generar IDs únicos e incrementales para diferentes entidades del sistema.

### 📐 Estructura

```prisma
model SequenceCounter {
  id           String   @id @default(cuid())
  entity_type  String   // "reporte", "jugador", "torneo", etc.
  year         Int      // Año (0 = global, sin año)
  last_number  Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([entity_type, year])
  @@index([entity_type, year])
  @@map("sequence_counters")
}
```

### 📊 Estado Actual

```
Total de contadores: 3

┌─────────────┬────────┬──────────┬──────────────────────┐
│ Entidad     │ Año    │ Último # │ Próximo ID           │
├─────────────┼────────┼──────────┼──────────────────────┤
│ jugador     │ GLOBAL │ 19       │ PLY-00020            │
│ reporte     │ 2025   │ 55       │ REP-2025-00056       │
│ reporte     │ 2024   │ 21       │ REP-2024-00022       │
└─────────────┴────────┴──────────┴──────────────────────┘

Total IDs generados:
  - Jugadores: 19
  - Reportes:  76 (55 en 2025 + 21 en 2024)
```

### 🔧 Funcionalidad

#### 1. **Generación de IDs Secuenciales**

La tabla permite generar IDs legibles y secuenciales:

```typescript
// Jugadores (contador global)
PLY-00001, PLY-00002, PLY-00003, ... PLY-00019

// Reportes (contador por año)
REP-2024-00001, REP-2024-00002, ... REP-2024-00021
REP-2025-00001, REP-2025-00002, ... REP-2025-00055
```

#### 2. **Flexibilidad por Entidad**

Cada entidad puede tener su propio sistema:
- **Con año** (reportes): Agrupa por año
- **Sin año** (jugadores): Contador global (year = 0)

#### 3. **Thread-Safe**

Usa transacciones atómicas de Prisma:

```typescript
const result = await prisma.$transaction(async (tx) => {
  const counter = await tx.sequenceCounter.update({
    where: { entity_type_year: { entity_type: 'reporte', year: 2025 } },
    data: { last_number: { increment: 1 } }
  });
  return counter.last_number;
});
```

✅ **Sin race conditions** en requests concurrentes

### 💡 Casos de Uso

#### Actual:
- ✅ Reportes: `REP-YYYY-NNNNN`
- ✅ Jugadores: `PLY-NNNNN`

#### Futuro:
- 📋 Torneos: `TOR-YYYY-NNNNN`
- 🏆 Competiciones: `COMP-YYYY-NNNNN`
- 👥 Scouts: `SCT-NNNNN`
- 🏢 Equipos: `TEAM-NNNNN`

### 🎨 Beneficios

| Antes (CUID) | Ahora (Secuencial) | Mejora |
|--------------|-------------------|--------|
| `cmg9bhoc00004zwjsz7bwn7hu` | `PLY-00019` | **-64% longitud** |
| Ilegible | Legible | ✅ |
| Imposible comunicar | Fácil comunicar | ✅ |
| Sin contexto | Con contexto (año) | ✅ |

---

## 📊 TABLA: radar_metrics

### 🎯 Propósito

Tabla para **almacenar métricas de radar** calculadas para cada jugador, permitiendo análisis comparativos de rendimiento en diferentes categorías.

### 📐 Estructura

```prisma
model RadarMetrics {
  id                String   @id @default(cuid())
  playerId          String
  category          String   // Categoría de la métrica
  playerValue       Float    // Valor del jugador
  percentile        Float?   // Percentil vs otros jugadores
  period            String   // Período (ej: "2023-24")
  calculatedAt      DateTime @default(now())
  comparisonAverage Float?   // Promedio de comparación
  dataCompleteness  Float    // % de datos completos
  rank              Int?     // Ranking en esta categoría
  sourceAttributes  Json     // Atributos fuente (JSON)
  totalPlayers      Int?     // Total de jugadores comparados

  player            Jugador  @relation(fields: [playerId], references: [id_player], onDelete: Cascade)

  @@index([playerId])
  @@index([category])
  @@index([period])
  @@map("radar_metrics")
}
```

### 📊 Estado Actual

```
⚠️  TABLA VACÍA (0 métricas registradas)

Jugadores totales:          19
Jugadores con métricas:     0
Cobertura:                  0%
```

### 🎯 Categorías de Radar Planificadas

Basado en el código existente, las categorías son:

#### Ofensivas:
1. **Off Transition** - Transición ofensiva
2. **Maintenance** - Mantenimiento de posesión
3. **Progression** - Progresión del balón
4. **Finishing** - Finalización
5. **Off Stopped Ball** - Balón parado ofensivo

#### Defensivas:
6. **Def Transition** - Transición defensiva
7. **Recovery** - Recuperación del balón
8. **Evitation** - Evitación (prevención)
9. **Def Stopped Ball** - Balón parado defensivo

### 🔧 Funcionalidad Implementada

#### 1. **Cálculo de Métricas**

```typescript
// Service: RadarCalculationService.ts
interface RadarMetric {
  name: string;
  value: number;        // 0-100
  percentile: number;   // 0-100
  category: string;
}

// Calcula radar para un jugador
await RadarCalculationService.calculatePlayerRadar(playerId);
```

#### 2. **API Endpoints**

```
GET /api/players/[id]/radar
  - Obtiene métricas radar de un jugador
  - Parámetros: period (ej: "2023-24")
  - Retorna: 9 categorías con valores y percentiles

GET /api/players/[id]/radar/comparison
  - Compara jugador con otros
  - Calcula percentiles relativos

GET /api/players/[id]/radar/compare
  - Compara múltiples jugadores
```

#### 3. **Scripts de Cálculo**

```bash
# Script batch para calcular métricas
npx tsx scripts/calculate-radar-data.ts [options]

Opciones:
  --dry-run          : Simular sin guardar
  --batch-size N     : Procesar N jugadores a la vez
  --positions FW,MF  : Solo ciertas posiciones
  --incremental      : Solo jugadores sin métricas
  --period 2023-24   : Período específico
  --validate         : Validar calidad de datos
  --stats-only       : Solo mostrar estadísticas
  --clear-cache      : Limpiar caché antes de calcular
```

### 📊 Ejemplo de Datos (Mock)

```typescript
{
  playerId: "PLY-00015",
  playerName: "Pedri González",
  metrics: [
    {
      category: "Off Transition",
      playerValue: 85,
      percentile: 75,
      comparisonAverage: 70,
      rank: 125,
      totalPlayers: 500,
      dataCompleteness: 95.5
    },
    // ... 8 categorías más
  ],
  overallRating: 84
}
```

### 🔄 Flujo de Datos

```
1. Scraping/Import
   ↓
2. Atributos base guardados en Jugador
   ↓
3. Script calculate-radar-data.ts
   ↓
4. RadarCalculationService calcula métricas
   ↓
5. Guarda en radar_metrics
   ↓
6. API lee de radar_metrics
   ↓
7. Frontend muestra gráfico radar
```

### ⚠️ Estado de Implementación

#### ✅ Implementado:
- Modelo de datos (schema)
- API endpoints
- Service de cálculo (estructura)
- Scripts de batch
- Frontend para visualización

#### ⚠️ Pendiente/Mock:
- **Lógica real de cálculo** - Actualmente devuelve datos mock
- **Población de datos** - Tabla vacía
- **Integración con fuente de datos** - Falta conectar con estadísticas reales
- **Cálculo de percentiles** - Implementación básica

### 💡 Propósito en el Sistema

#### Visualización:
```
          Off Transition (85)
                /   \
  Def Trans (75)     Maintenance (88)
       |                    |
   Recovery (80)      Progression (82)
       |                    |
  Evitation (65)      Finishing (90)
       |                    |
Def Stopped (72)    Off Stopped (78)
```

Permite ver fortalezas/debilidades de cada jugador visualmente.

#### Comparación:
```
Jugador A: Off Transition = 85 (percentil 75)
Jugador B: Off Transition = 92 (percentil 88)

→ Jugador B es mejor en transición ofensiva
```

#### Scouting:
- Identificar jugadores por perfil específico
- Buscar jugadores con alto percentil en categoría X
- Comparar con promedios de posición/liga

---

## 🔗 Relación Entre Ambas Tablas

### sequence_counters:
- ✅ **Activa y en uso**
- Genera IDs para jugadores y reportes
- Sistema funcional al 100%

### radar_metrics:
- ⚠️ **Preparada pero vacía**
- Depende de cálculos basados en datos de jugadores
- Infraestructura lista, falta población de datos

### Conexión Indirecta:

```typescript
// 1. Se crea jugador con ID secuencial
const playerId = await generatePlayerId();
// → PLY-00020

// 2. Se calculan métricas radar para ese jugador
const metrics = await calculateRadarMetrics(playerId);

// 3. Se guardan en radar_metrics con el playerId
await prisma.radarMetrics.createMany({
  data: metrics.map(m => ({
    playerId: playerId,  // ← FK usa el ID secuencial
    category: m.category,
    playerValue: m.value,
    // ...
  }))
});
```

✅ Los IDs secuenciales de jugadores funcionan perfectamente como FK en radar_metrics

---

## 📋 Recomendaciones

### Para sequence_counters:

✅ **Sistema funcionando perfectamente**

Posibles expansiones:
1. Agregar contador para torneos (`TOR-YYYY-NNNNN`)
2. Agregar contador para scouts (`SCT-NNNNN`)
3. Agregar contador para equipos (`TEAM-NNNNN`)

### Para radar_metrics:

⚠️ **Necesita población de datos**

Pasos para activar:

1. **Implementar lógica de cálculo real**
   ```typescript
   // En RadarCalculationService.ts
   // Reemplazar mock con cálculos reales basados en:
   // - Estadísticas del jugador
   // - Comparación con base de datos
   // - Algoritmos de scoring
   ```

2. **Ejecutar script de población**
   ```bash
   # Calcular para todos los jugadores
   npx tsx scripts/calculate-radar-data.ts
   ```

3. **Configurar actualización programada**
   ```typescript
   // scripts/scheduled-radar-update.ts
   // Ejecutar periódicamente (ej: cada semana)
   ```

4. **Validar calidad de datos**
   ```bash
   npx tsx scripts/calculate-radar-data.ts --validate
   ```

---

## 🎯 Conclusión

### sequence_counters:
✅ **Sistema funcional y productivo**
- Genera IDs legibles para reportes y jugadores
- Reduce longitud de IDs en 64%
- Thread-safe y escalable
- Listo para expandir a otras entidades

### radar_metrics:
⚠️ **Infraestructura lista, esperando datos**
- Modelo de datos correcto
- APIs implementadas
- Scripts preparados
- **Necesita**: Lógica de cálculo real y población inicial

### Próximos Pasos:
1. ✅ Mantener sequence_counters funcionando
2. ⚠️ Implementar cálculo real de radar metrics
3. ⚠️ Poblar radar_metrics con datos de jugadores existentes
4. ⚠️ Configurar actualización automática

---

**Documentos relacionados:**
- [NUEVO_SISTEMA_IDS_REPORTES.md](NUEVO_SISTEMA_IDS_REPORTES.md)
- [NUEVO_SISTEMA_IDS_JUGADORES.md](NUEVO_SISTEMA_IDS_JUGADORES.md)
