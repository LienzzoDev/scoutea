# 📊 Sistema de Atributos FMI - Documentación

## 🎯 Resumen

El sistema de visualización de datos de jugadores ahora está **completamente basado en la tabla `atributos`**, eliminando la dependencia de las tablas `PlayerStats` y `PlayerStatsV2`. Este enfoque simplifica la arquitectura y proporciona datos más consistentes y realistas basados en los atributos FMI (Football Manager Intelligence).

## 🗂️ Estructura de Datos

### 📋 Tabla Principal: `atributos`
- **280+ campos** con atributos detallados FMI
- **Habilidades técnicas**: dribbling_fmi, passing_fmi, finishing_fmi, etc.
- **Atributos físicos**: pace_fmi, strength_fmi, stamina_fmi, etc.
- **Atributos mentales**: composure_fmi, decisions_fmi, vision_fmi, etc.
- **Aptitudes posicionales**: striker_fmi, midfielder_central_fmi, etc.
- **Arquetipos**: creativity, sprinter, the_rock, etc.
- **Roles tácticos**: central_att_finisher, wide_att_unlocker, etc.

### 📊 Tablas de Visualización (Generadas)
- **RadarMetrics**: Datos para gráficos radar
- **BeeswarmData**: Datos para gráficos beeswarm
- **LollipopData**: Datos para gráficos lollipop

## 🔄 Conversión de Atributos a Métricas

### 🎯 Radar Chart
```javascript
// Attacking
const attacking = average([finishing_fmi, dribbling_fmi, off_the_ball_fmi, long_shots_fmi])

// Defending  
const defending = average([tackling_fmi, marking_fmi, positioning_fmi, anticipation_fmi])

// Passing
const passing = average([passing_fmi, vision_fmi, crossing_fmi, technique_fmi])

// Physical
const physical = average([pace_fmi, acceleration_fmi, strength_fmi, stamina_fmi])

// Mental
const mental = average([composure_fmi, decisions_fmi, concentration_fmi, determination_fmi])
```

### 🐝 Beeswarm Chart
```javascript
// Goals basado en finishing
const goals = finishing_fmi * 0.3

// Assists basado en vision y passing
const assists = average([vision_fmi, passing_fmi]) * 0.2

// Passes basado en passing
const passes = passing_fmi * 20

// Tackles basado en tackling
const tackles = tackling_fmi * 1.5

// Dribbles basado en dribbling
const dribbles = dribbling_fmi * 2

// xG basado en finishing y off_the_ball
const xg = average([finishing_fmi, off_the_ball_fmi]) * 0.25
```

### 🍭 Lollipop Chart
```javascript
// Por categoría (Attacking, Defending, Passing, Physical)
// Cada métrica se calcula desde atributos específicos
// Se generan rankings y percentiles automáticamente

// Ejemplo Attacking:
Goals: finishing_fmi * 0.3
Assists: average([vision_fmi, passing_fmi]) * 0.2
Shots: long_shots_fmi * 1.5
xG: average([finishing_fmi, off_the_ball_fmi]) * 0.25
Key Passes: vision_fmi * 0.8
```

## 🚀 Scripts Disponibles

### 📝 Scripts Principales

#### `seed-atributos-only.js`
**Propósito**: Seed completo del sistema basado solo en atributos
```bash
node scripts/seed-atributos-only.js
```
**Funciones**:
- Crea 8 jugadores de ejemplo con diferentes posiciones
- Inserta atributos FMI completos para cada jugador
- Genera automáticamente datos para todas las visualizaciones
- Limpia datos existentes antes de insertar

#### `verify-atributos-only.js`
**Propósito**: Verificación completa del sistema
```bash
node scripts/verify-atributos-only.js
```
**Funciones**:
- Verifica integridad de datos
- Muestra estadísticas por categoría
- Ejemplos de conversión atributos → métricas
- Resumen completo del sistema

#### `seed-atributos.js` (Simplificado)
**Propósito**: Seed básico solo de jugadores y atributos
```bash
node scripts/seed-atributos.js
```

### 🗑️ Scripts Eliminados
- ~~`seed-chart-data-complete.js`~~ (Dependía de PlayerStats)
- ~~`verify-seed-data.js`~~ (Verificaba tablas eliminadas)
- ~~`seed-all-data.js`~~ (Sistema anterior)

## 👥 Jugadores de Ejemplo

El sistema incluye 8 jugadores de diferentes posiciones:

1. **Lionel Messi** (RW) - 1950 pts FMI (98%)
2. **Erling Haaland** (ST) - 1820 pts FMI (91%)
3. **Thibaut Courtois** (GK) - 1780 pts FMI (89%)
4. **Luka Modric** (CM) - 1850 pts FMI (93%)
5. **Virgil van Dijk** (CB) - 1820 pts FMI (91%)
6. **Kylian Mbappé** (LW) - 1880 pts FMI (94%)
7. **Kevin De Bruyne** (AM) - 1830 pts FMI (92%)
8. **Pedri González** (CM) - 1650 pts FMI (83%)

## 📈 Datos Generados

### Por Jugador:
- **5 RadarMetrics** (Attacking, Defending, Passing, Physical, Mental)
- **6 BeeswarmData** (Goals, Assists, Passes, Tackles, Dribbles, xG)
- **20 LollipopData** (5 métricas × 4 categorías)

### Total del Sistema:
- **40 RadarMetrics**
- **48 BeeswarmData**
- **160 LollipopData**

## 🔧 Ventajas del Nuevo Sistema

### ✅ Beneficios
1. **Simplicidad**: Una sola fuente de verdad (tabla atributos)
2. **Consistencia**: Todos los datos derivan de atributos FMI
3. **Realismo**: Basado en sistema probado de Football Manager
4. **Mantenibilidad**: Menos tablas que sincronizar
5. **Escalabilidad**: Fácil agregar nuevas métricas

### 🎯 Casos de Uso
- **Radar Charts**: Comparación de habilidades por categoría
- **Beeswarm Charts**: Distribución de métricas específicas
- **Lollipop Charts**: Rankings detallados por categoría
- **Análisis de jugadores**: Perfiles completos basados en FMI

## 🔄 Migración Completada

### ❌ Eliminado
- Tabla `player_stats`
- Tabla `player_stats_v2`
- Relaciones en modelo `Jugador`
- Scripts dependientes

### ✅ Mantenido
- Tabla `atributos` (fuente principal)
- Tablas de visualización (RadarMetrics, BeeswarmData, LollipopData)
- Funcionalidad completa de gráficos

## 🚀 Próximos Pasos

1. **Actualizar componentes React** para usar solo datos de atributos
2. **Optimizar consultas** para mejor performance
3. **Agregar más jugadores** al sistema
4. **Implementar filtros avanzados** basados en atributos FMI
5. **Crear dashboards** de análisis táctico

---

**📝 Nota**: Este sistema proporciona una base sólida y realista para el análisis de jugadores, eliminando la complejidad de múltiples fuentes de datos y centralizando todo en los atributos FMI probados.