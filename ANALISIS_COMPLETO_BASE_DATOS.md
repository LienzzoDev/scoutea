# 🔍 ANÁLISIS COMPLETO DE LA BASE DE DATOS

**Fecha:** 2025-10-14
**Total de tablas:** 25
**Registros totales:** ~550

---

## 📊 RESUMEN EJECUTIVO

### Principales Hallazgos

1. **⚠️ Tablas sobrecargadas:** `scouts` (114 cols), `jugadores` (88 cols), `atributos` (228 cols)
2. **💤 8 tablas vacías (0 registros):** Código muerto o funcionalidad futura sin usar
3. **✅ Normalización exitosa:** Sistema de IDs secuenciales funcionando correctamente
4. **🔗 Relaciones bien definidas:** Foreign keys y cascadas configuradas correctamente
5. **📈 Sobre-indexación:** Scouts tiene 19 índices, algunos posiblemente redundantes

### Prioridades de Mejora

| Prioridad | Tabla | Problema | Impacto |
|-----------|-------|----------|---------|
| 🔴 ALTA | `atributos` | 228 columnas (225 nullable) | Imposible de mantener |
| 🔴 ALTA | `scouts` | 114 columnas con timestamps excesivos | Complejidad innecesaria |
| 🟡 MEDIA | `jugadores` | 88 columnas, muchas redundantes | Dificulta queries |
| 🟡 MEDIA | 8 tablas vacías | Código/esquema sin usar | Confusión, mantenimiento |
| 🟢 BAJA | Índices | Posible duplicación/redundancia | Rendimiento write |

---

## 📋 ANÁLISIS POR TABLA

### 1. ENTIDADES CORE

#### 🟢 **jugadores** (19 registros, 88 columnas)

**Función:** Tabla principal de jugadores con toda su información técnica, financiera y estadística.

**Estructura:**
- 48 text, 29 double precision, 8 timestamp, 2 integer, 1 boolean
- 4 requeridas, 84 opcionales
- 4 Foreign Keys: position_id, nationality_id, agency_id, team_id
- 14 índices (bien optimizada)

**Problemas identificados:**

1. **Demasiadas columnas (88)** - Dificulta mantenimiento y queries
2. **Alta redundancia:**
   - `player_name` + `complete_player_name` + campos con sufijo `_1`, `_2`, `_3`
   - Múltiples campos de edad: `age`, `age_value`, `age_value_percent`, `age_coeff`
   - Campos duplicados de nacionalidad/equipo con variaciones
3. **Campos sin normalizar:**
   - `position_player` (text) cuando existe `position_id` (FK)
   - `nationality_1`, `nationality_2`, `nationality_3` (text) cuando existe `nationality_id` (FK)
4. **Timestamps excesivos:**
   - 8 columnas timestamp (createdAt, updatedAt, + 6 más)
   - Parece tracking histórico que debería estar en tabla separada

**Recomendaciones:**

```sql
-- ✅ PROPUESTA: Dividir en 3 tablas

-- jugadores (core - 20 columnas esenciales)
id_player, player_name, date_of_birth,
position_id, nationality_id, agency_id, team_id,
player_trfm_value, market_value_estimate,
createdAt, updatedAt

-- player_attributes (atributos variables - JSON o columnas)
id, id_player, attribute_name, value, period, updatedAt

-- player_history (cambios temporales)
id, id_player, field_name, old_value, new_value, changed_at
```

**Impacto:** 🟡 MEDIO - Funciona pero dificulta escalabilidad

---

#### 🔴 **reportes** (76 registros, 29 columnas)

**Función:** Informes creados por scouts sobre jugadores.

**Estructura:**
- 18 text, 7 double precision, 3 timestamp, 1 integer
- 3 requeridas, 26 opcionales
- 2 Foreign Keys: scout_id, id_player
- 8 índices (excelente)

**✅ Estado: EXCELENTE**

- Nuevo sistema de IDs secuenciales funcionando (REP-YYYY-NNNNN)
- Normalización Phase 3 completada exitosamente
- Foreign keys correctas, sin redundancia
- Índices óptimos para queries frecuentes

**Único punto de mejora:**

```sql
-- Posible normalización de URLs en tabla separada
-- Si un reporte tiene múltiples videos/documentos

CREATE TABLE reporte_attachments (
  id text PRIMARY KEY,
  id_report text REFERENCES reportes(id_report),
  attachment_type text, -- 'video', 'document', 'image'
  url text NOT NULL,
  description text,
  createdAt timestamp
);
```

**Impacto:** 🟢 BAJO - Tabla en excelente estado

---

#### 🟡 **scouts** (11 registros, 114 columnas)

**Función:** Perfiles de scouts con métricas de rendimiento y actividad.

**Estructura:**
- 23 text, 46 double precision, 22 timestamp(!), 22 integer, 1 boolean
- 3 requeridas, 111 opcionales
- 1 Foreign Key: nationality_id
- 19 índices (posiblemente excesivo)

**Problemas identificados:**

1. **⚠️ 114 COLUMNAS - TABLA MASIVA**
   - Solo 3 requeridas, 111 opcionales
   - Claramente acumulación de features sin refactorización

2. **22 TIMESTAMPS - EXCESIVO**
   ```
   Ejemplos probables:
   - last_login_at
   - last_report_at
   - profile_completed_at
   - subscription_started_at
   - ... 18 más
   ```
   **Problema:** Cada feature nueva añade timestamp en lugar de tabla de eventos

3. **22 INTEGERS + 46 DOUBLES - MÉTRICAS SIN ORGANIZAR**
   - Contadores probablemente calculables desde otras tablas
   - Métricas que deberían ser vistas materializadas

4. **19 ÍNDICES - POSIBLE SOBRE-INDEXACIÓN**
   - Cada timestamp/métrica tiene índice
   - Ralentiza INSERTs/UPDATEs
   - Muchos índices probablemente sin usar

**Recomendaciones:**

```sql
-- ✅ PROPUESTA: Dividir en 4 tablas

-- scouts (core - 15 columnas)
id_scout, clerkId, scout_name, name, surname,
date_of_birth, nationality_id, email, phone,
profile_image_url, bio, status,
createdAt, updatedAt, lastLoginAt

-- scout_metrics (métricas calculables)
id, scout_id, metric_name, value, period, calculatedAt
-- Ej: total_reports, avg_rating, response_time

-- scout_events (eventos temporales)
id, scout_id, event_type, event_data jsonb, createdAt
-- Ej: login, report_created, profile_updated

-- scout_subscription (info de suscripción)
id, scout_id, plan_type, status, started_at, expires_at
```

**Impacto:** 🔴 ALTO - Tabla difícil de mantener y escalar

---

#### 🟢 **equipos** (24 registros, 25 columnas)

**Función:** Información de equipos/clubes de fútbol.

**Estructura:**
- 17 text, 5 double precision, 2 timestamp, 1 integer
- 4 requeridas, 21 opcionales
- 6 índices (bien balanceados)

**✅ Estado: BUENO**

**Pequeñas mejoras sugeridas:**

1. Normalizar `team_country` → FK a `countries`
2. Normalizar `competition` → FK a `competitions`
3. Considerar separar datos financieros en tabla `team_finances`

**Impacto:** 🟢 BAJO - Tabla funcional

---

### 2. TABLAS DE NORMALIZACIÓN (✅ Excelentes)

#### **countries** (14 registros, 6 columnas)
- ✅ Perfectamente normalizada
- ✅ Índices correctos en code y confederation
- ✅ Unique constraints apropiados

#### **positions** (10 registros, 6 columnas)
- ✅ Bien estructurada con category y short_name
- ✅ Índices optimizados

#### **agencies** (1 registro, 6 columnas)
- ✅ Normalizada correctamente con FK a countries
- ⚠️ Solo 1 registro - verificar si está en uso real

#### **competitions** (5 registros, 9 columnas)
- ✅ Bien estructurada con tier y confederation
- ✅ FK correcta a countries

**Conclusión normalización:** ✅ Todas estas tablas están en excelente estado.

---

### 3. MÉTRICAS Y ESTADÍSTICAS

#### 🔴 **atributos** (0 registros, 228 columnas!)

**Función:** Atributos técnicos detallados de jugadores (FMI system).

**Estructura:**
- 1 text (id_player), 225 integer (todos los atributos), 2 timestamp
- 3 requeridas, 225 opcionales
- FK a jugadores
- 10 índices sobre métricas principales

**Problemas identificados:**

1. **⚠️ 228 COLUMNAS - ANTI-PATRÓN CRÍTICO**
   - Imposible de mantener
   - Añadir/modificar atributo = migración de schema
   - 225 columnas nullable = desperdicio de espacio
   - 0 registros = nunca se ha usado

2. **Modelo inflexible:**
   ```sql
   -- ACTUAL (MALO):
   atributos (
     id_player,
     passing_short, passing_long, passing_vision,
     dribbling_close, dribbling_speed, ...
     -- ... 220 atributos más
   )
   ```

3. **Carece de historicidad:**
   - Solo snapshot actual
   - No hay seguimiento de evolución

**Recomendaciones:**

```sql
-- ✅ PROPUESTA: Sistema EAV (Entity-Attribute-Value)

-- attribute_definitions (catálogo)
CREATE TABLE attribute_definitions (
  id text PRIMARY KEY,
  name text UNIQUE NOT NULL,
  category text NOT NULL, -- 'passing', 'dribbling', 'defending'
  subcategory text,
  min_value integer DEFAULT 0,
  max_value integer DEFAULT 100,
  createdAt timestamp
);

-- player_attributes (valores dinámicos)
CREATE TABLE player_attributes (
  id text PRIMARY KEY,
  id_player text REFERENCES jugadores(id_player),
  attribute_id text REFERENCES attribute_definitions(id),
  value integer NOT NULL,
  period text, -- '3m', '6m', '1y'
  measuredAt timestamp NOT NULL,
  source text, -- 'scout_report', 'wyscout', 'fbref'

  UNIQUE(id_player, attribute_id, period, measuredAt)
);

CREATE INDEX ON player_attributes(id_player, measuredAt);
CREATE INDEX ON player_attributes(attribute_id, period);
```

**Ventajas:**
- ✅ Añadir atributos sin cambiar schema
- ✅ Histórico completo de evolución
- ✅ Flexible para diferentes fuentes
- ✅ Queries eficientes con índices

**Impacto:** 🔴 CRÍTICO - Tabla no usable en estado actual

---

#### 💤 **player_stats_3m** (0 registros, 123 columnas)

**Función:** Estadísticas de jugadores últimos 3 meses.

**Estructura:**
- 74 numeric, 45 integer, 1 bigint, 1 text, 2 timestamp
- 3 requeridas, 120 opcionales
- 10 índices preparados

**Problemas:**
1. 0 registros - nunca implementado
2. Mismo problema que `atributos` - demasiadas columnas
3. Debería usar modelo flexible

**Recomendación:** Migrar a sistema EAV similar a atributos o eliminar si no se usa.

**Impacto:** 🟡 MEDIO - 0 registros sugiere código muerto

---

#### 💤 **radar_metrics** (0 registros, 12 columnas)

**Función:** Métricas para gráficos radar de jugadores.

**Estructura:**
- 4 text, 4 double precision, 2 integer, 1 jsonb, 1 timestamp
- 8 requeridas, 4 opcionales
- ✅ Usa JSONB para flexibilidad
- 4 índices correctos

**✅ Estado: BUEN DISEÑO pero no usado**

```sql
-- Estructura excelente:
playerId, category, period,
avgValue, maxValue, percentile, rank,
breakdown jsonb  -- ✅ Datos flexibles
```

**Recomendación:**
- Si se va a usar: ✅ mantener diseño actual
- Si no: eliminar del schema

**Impacto:** 🟢 BAJO - Buen diseño, solo falta implementar

---

#### 💤 **player_metrics** (0 registros, 11 columnas)

**Función:** Métricas generales de jugadores por período.

**Estructura:** Similar a radar_metrics pero más genérica
- Buen diseño con unique constraint en (player_id, metric_name, period)

**Estado:** 💤 0 registros - sin usar

---

### 4. VISUALIZACIÓN

#### 💤 **beeswarm_data** (0 registros, 13 columnas)

**Función:** Datos pre-calculados para gráficos beeswarm.

**Estructura:**
- 8 text, 2 double precision, 1 integer, 1 boolean, 1 timestamp
- 7 índices preparados (metric, position, age, nationality, competition)

**Análisis:**
- ✅ Buen diseño para datos de visualización
- ✅ Índices correctos para filtros
- 💤 0 registros - funcionalidad no implementada

**Recomendación:** Mantener o eliminar según roadmap.

---

#### 💤 **lollipop_data** (0 registros, 11 columnas)

**Función:** Datos pre-calculados para gráficos lollipop.

**Estructura similar a beeswarm_data**
- 5 índices preparados

**Estado:** 💤 Sin usar

---

### 5. RELACIONES Y LISTAS

#### ✅ **player_roles** (399 registros, 6 columnas)

**Función:** Roles/posiciones de jugadores con porcentajes.

**Estructura:**
- player_id, role_name, percentage
- Unique constraint correcto
- 3 índices optimizados

**✅ Estado: PERFECTO**
- 399 registros para 19 jugadores = ~21 roles por jugador
- Diseño limpio y normalizado
- Permite múltiples roles con distribución

**Impacto:** ✅ EXCELENTE

---

#### ✅ **player_lists** (2 registros, 5 columnas)

**Función:** Listas de jugadores favoritos de usuarios.

**Estructura:**
- userId + playerId + unique constraint
- 4 índices correctos

**Estado:** ✅ PERFECTO

---

#### ✅ **scout_lists** (1 registro, 5 columnas)

**Función:** Listas de scouts favoritos de usuarios.

**Estructura similar a player_lists**

**Estado:** ✅ PERFECTO

---

### 6. CORRECCIONES Y LOGS

#### 💤 **player_corrections** (0 registros, 8 columnas)

**Función:** Log de correcciones manuales a datos de jugadores.

**Estructura:**
- player_id, field_name, old_value, new_value, reason, correction_date
- Unique constraint en (player_id, field_name)

**Problema:** Unique constraint incorrecto - solo permite 1 corrección por campo ever
**Debería ser:** Permitir múltiples correcciones históricas

**Recomendación:**
```sql
-- Cambiar unique constraint:
-- De: (player_id, field_name)
-- A:  (player_id, field_name, correction_date)
```

**Impacto:** 🟡 MEDIO - Bug en diseño

---

#### 💤 **data_population_log** (0 registros, 8 columnas)

**Función:** Log de población automática de datos.

**Estructura:**
- playerId, tableName, fieldName, source, oldValue, newValue, confidence

**Estado:** Buen diseño, 0 registros = sin usar

---

### 7. MENSAJES Y COMUNICACIÓN

#### ✅ **scout_contact_messages** (1 registro, 9 columnas)

**Función:** Mensajes de contacto hacia scouts.

**Estructura:**
- userId, scoutId, userEmail, userName, scoutName, message
- 3 índices correctos

**Estado:** ✅ Funcional

---

#### ✅ **on_demand_messages** (1 registro, 7 columnas)

**Función:** Mensajes on-demand de usuarios.

**Estructura:**
- userId, userEmail, userName, message
- 2 índices

**Estado:** ✅ Funcional

---

### 8. TORNEOS

#### 💤 **torneos** (0 registros, 34 columnas)

**Función:** Gestión de torneos/competiciones con equipos participantes.

**Estructura:**
- 20 text, 5 timestamp, 4 double precision, 2 integer, 2 boolean, 1 jsonb
- 13 requeridas, 21 opcionales
- FK a competitions
- 12 índices preparados

**Análisis:**
- Diseño completo con fechas, ubicación, equipos (jsonb), premios
- 12 índices listos para queries complejas
- 💤 0 registros - funcionalidad futura

**Recomendación:**
- Si roadmap incluye torneos: mantener
- Si no: eliminar (34 columnas sin usar)

**Impacto:** 🟡 MEDIO - Sin usar pero diseño listo

---

### 9. USUARIOS

#### ✅ **usuarios** (3 registros, 22 columnas)

**Función:** Perfiles de usuarios de la plataforma.

**Estructura:**
- 15 text, 3 timestamp, 1 integer, 1 ARRAY, 1 boolean, 1 jsonb
- Integración con Clerk (clerkId unique)
- 5 índices optimizados

**Estado:** ✅ BUENO

**Pequeña mejora:**
```sql
-- Considerar separar en:
-- usuarios (datos base) + user_preferences (settings jsonb)
```

**Impacto:** 🟢 BAJO - Funcional

---

### 10. SISTEMA

#### ✅ **sequence_counters** (3 registros, 6 columnas)

**Función:** Contadores para sistema de IDs secuenciales.

**Estructura:**
- entity_type, year, last_number
- Unique constraint en (entity_type, year)

**✅ Estado: PERFECTO**

Registros actuales:
- `reporte`, 2024 → 21 reportes
- `reporte`, 2025 → 55 reportes
- `jugador`, 0 → 19 jugadores

**Impacto:** ✅ FUNCIONANDO PERFECTAMENTE

---

#### ✅ **_prisma_migrations** (5 registros, 8 columnas)

**Función:** Control de migraciones de Prisma.

**Estado:** ✅ Sistema interno, no tocar

---

## 🎯 RECOMENDACIONES PRIORIZADAS

### 🔴 PRIORIDAD ALTA - Impacto Crítico

#### 1. Refactorizar `atributos` (228 columnas → sistema EAV)

**Problema:** Tabla inmantenible con 228 columnas, 0 registros.

**Solución:**
```sql
-- Migrar a:
attribute_definitions (catálogo de atributos)
player_attributes (valores EAV flexibles)
```

**Beneficios:**
- ✅ Atributos flexibles sin cambios de schema
- ✅ Histórico de evolución
- ✅ Múltiples fuentes de datos
- ✅ Queries eficientes

**Esfuerzo:** 2-3 días
**Impacto:** 🔴 CRÍTICO

---

#### 2. Dividir `scouts` (114 columnas → 4 tablas)

**Problema:** Tabla masiva con 22 timestamps, 46 doubles, 22 integers, 19 índices.

**Solución:**
```sql
scouts (core - 15 columnas)
scout_metrics (métricas calculables)
scout_events (historial de eventos)
scout_subscription (datos de suscripción)
```

**Beneficios:**
- ✅ Mantenimiento simplificado
- ✅ Queries más rápidas
- ✅ Escalabilidad mejorada
- ✅ Menos índices necesarios

**Esfuerzo:** 3-4 días
**Impacto:** 🔴 ALTO

---

### 🟡 PRIORIDAD MEDIA - Mejoras Significativas

#### 3. Refactorizar `jugadores` (88 columnas → 3 tablas)

**Problema:** Muchas columnas redundantes, timestamps excesivos.

**Solución:**
```sql
jugadores (core - 20 columnas esenciales)
player_attributes (atributos variables)
player_history (cambios históricos)
```

**Beneficios:**
- ✅ Tabla core más limpia
- ✅ Mejor performance en queries básicas
- ✅ Histórico de cambios separado

**Esfuerzo:** 2-3 días
**Impacto:** 🟡 MEDIO-ALTO

---

#### 4. Limpiar tablas vacías (8 tablas con 0 registros)

**Tablas afectadas:**
- atributos (228 cols) 🔴
- player_stats_3m (123 cols) 🔴
- radar_metrics (12 cols) 🟢
- player_metrics (11 cols) 🟢
- beeswarm_data (13 cols) 🟢
- lollipop_data (11 cols) 🟢
- player_corrections (8 cols) 🟡
- data_population_log (8 cols) 🟢
- torneos (34 cols) 🟡

**Decisión necesaria para cada tabla:**
- **Implementar:** Si en roadmap próximo (3 meses)
- **Eliminar:** Si no hay planes de uso

**Beneficios:**
- ✅ Schema más limpio
- ✅ Menos confusión
- ✅ Mejor DX (developer experience)

**Esfuerzo:** 1 día
**Impacto:** 🟡 MEDIO

---

#### 5. Normalizar campos redundantes

**Tablas afectadas:** jugadores, equipos

**Campos a normalizar:**
```sql
-- jugadores
position_player → usar position_id FK
nationality_1/2/3 → tabla player_nationalities

-- equipos
team_country → country_id FK
competition → competition_id FK
```

**Esfuerzo:** 1-2 días
**Impacto:** 🟡 MEDIO

---

#### 6. Revisar y optimizar índices

**Scout table:** 19 índices → probablemente 10-12 necesarios
**Método:**
1. Analizar queries reales con EXPLAIN
2. Identificar índices no usados
3. Eliminar redundantes
4. Mantener solo los que mejoran performance

**Beneficios:**
- ✅ Inserts/updates más rápidos
- ✅ Menos espacio en disco
- ✅ Vacuuming más eficiente

**Esfuerzo:** 1 día
**Impacto:** 🟡 MEDIO

---

### 🟢 PRIORIDAD BAJA - Mejoras Menores

#### 7. Corregir unique constraint en player_corrections

```sql
-- Cambiar de:
UNIQUE(player_id, field_name)

-- A:
UNIQUE(player_id, field_name, correction_date)
```

**Esfuerzo:** 10 minutos
**Impacto:** 🟢 BAJO

---

#### 8. Considerar vistas materializadas para métricas

Si `scout_metrics` se calculan frecuentemente desde otras tablas:

```sql
CREATE MATERIALIZED VIEW scout_performance_metrics AS
SELECT
  s.id_scout,
  COUNT(r.id_report) as total_reports,
  AVG(r.form_potential) as avg_potential,
  -- ... otras métricas
FROM scouts s
LEFT JOIN reportes r ON r.scout_id = s.id_scout
GROUP BY s.id_scout;

CREATE INDEX ON scout_performance_metrics(id_scout);

-- Refresh periódico
REFRESH MATERIALIZED VIEW CONCURRENTLY scout_performance_metrics;
```

**Esfuerzo:** 1 día
**Impacto:** 🟢 BAJO-MEDIO

---

## 📈 IMPACTO ESTIMADO DE MEJORAS

### Antes vs Después

| Métrica | Actual | Después Refactor | Mejora |
|---------|--------|------------------|--------|
| Columnas `atributos` | 228 | ~10 (tabla principal) | 96% reducción |
| Columnas `scouts` | 114 | ~15 (tabla core) | 87% reducción |
| Columnas `jugadores` | 88 | ~20 (tabla core) | 77% reducción |
| Tablas vacías | 8 | 0-3 | 62-100% reducción |
| Total columnas DB | ~850 | ~400 | 53% reducción |
| Mantenibilidad | 4/10 | 8/10 | +100% |
| Query performance | 7/10 | 9/10 | +29% |

---

## 🛠️ PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Crítico (Semana 1-2)
1. ✅ Refactorizar `atributos` → sistema EAV
2. ✅ Decidir sobre tablas vacías (implementar o eliminar)
3. ✅ Corregir bug en player_corrections

### Fase 2: Importante (Semana 3-4)
4. ✅ Refactorizar `scouts` → 4 tablas
5. ✅ Normalizar campos redundantes
6. ✅ Optimizar índices

### Fase 3: Mejoras (Semana 5)
7. ✅ Refactorizar `jugadores` → 3 tablas
8. ✅ Implementar vistas materializadas
9. ✅ Documentación completa del nuevo schema

### Rollout
- Usar migraciones graduales
- Mantener compatibilidad con columnas deprecated
- Tests exhaustivos antes de cada fase
- Rollback plan para cada cambio

---

## ✅ ASPECTOS POSITIVOS ACTUALES

1. ✅ **Sistema de IDs secuenciales:** Implementado y funcionando perfectamente
2. ✅ **Foreign Keys:** Bien definidas con cascadas correctas
3. ✅ **Normalización básica:** Countries, positions, agencies, competitions
4. ✅ **Índices de búsqueda:** Buenos índices en campos clave
5. ✅ **Relaciones muchos-a-muchos:** player_roles, player_lists bien diseñadas
6. ✅ **Timestamps:** Tracking de createdAt/updatedAt consistente
7. ✅ **Prisma ORM:** Migraciones versionadas correctamente

---

## 📚 CONCLUSIÓN

La base de datos tiene una **base sólida** con buena normalización en tablas de referencia y relaciones bien definidas. Los principales problemas son:

1. **Acumulación progresiva de columnas** en tablas core (scouts, jugadores, atributos)
2. **Código/schema sin usar** (8 tablas vacías)
3. **Falta de refactorización** al añadir features

Las mejoras propuestas convertirían el schema de "funcional pero difícil de mantener" a "escalable y limpio" sin romper funcionalidad existente.

**Recomendación:** Priorizar Fase 1 (crítico) en próximo sprint para prevenir deuda técnica mayor.
