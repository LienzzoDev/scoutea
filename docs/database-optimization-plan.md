# Plan de Optimización de Base de Datos

## Análisis Actual

### Modelo `Jugador` - Índices Excesivos

El modelo tiene **18 índices**, incluyendo:
- 9 índices simples
- 9 índices compuestos

#### Índices que pueden eliminarse o consolidarse:

1. **Índices duplicados por normalización:**
   - `@@index([team_name])` - ELIMINAR (usar `team_id`)
   - `@@index([position_player])` - ELIMINAR (usar `position_id`)
   - `@@index([nationality_1])` - ELIMINAR (usar `nationality_id`)
   - `@@index([agency])` - ELIMINAR (usar `agency_id`)

2. **Índices compuestos redundantes:**
   - `@@index([player_name, position_player, nationality_1])` - REEMPLAZAR por versión normalizada
   - `@@index([team_name, position_player])` - REEMPLAZAR por versión normalizada
   - `@@index([team_name, player_rating(sort: Desc)])` - REEMPLAZAR por `team_id`
   - `@@index([nationality_1, position_player, player_rating])` - REEMPLAZAR por versión normalizada

## Campos Legacy a Eliminar

### En `Jugador`:
Campos que tienen versión normalizada pero mantienen el denormalizado:
- `team_name` → usar `team.team_name` vía relación
- `position_player` → usar `position.name` vía relación
- `nationality_1` → usar `nationality.name` vía relación
- `agency` → usar `agencyRelation.name` vía relación

**IMPORTANTE**: No eliminar hasta verificar que todos los queries usan las relaciones.

### En `Scout`:
- `nationality` → usar `nationalityCountry.name` vía relación

### En `Competition`:
Campos legacy marcados en comentarios:
- Migrar datos de campos legacy a campos nuevos
- Eliminar después de migración completa

## Índices Optimizados Propuestos

```prisma
model Jugador {
  // ... campos ...

  // Índices de foreign keys (obligatorios)
  @@index([team_id])
  @@index([position_id])
  @@index([nationality_id])
  @@index([agency_id])

  // Índices para búsquedas frecuentes
  @@index([player_rating(sort: Desc)])
  @@index([wyscout_id_1])
  @@index([wyscout_id_2])
  @@index([updatedAt(sort: Desc)])

  // Índices compuestos esenciales (queries específicos)
  @@index([createdAt(sort: Desc), id_player], map: "idx_player_pagination")
  @@index([player_rating(sort: Desc), createdAt(sort: Desc)], map: "idx_player_rating_created")
  @@index([team_id, position_id, player_rating(sort: Desc)], map: "idx_team_pos_rating") // Normalizado
  @@index([position_id, age, player_rating(sort: Desc)], map: "idx_pos_age_rating") // Normalizado
  @@index([nationality_id, position_id, player_rating(sort: Desc)], map: "idx_nat_pos_rating") // Normalizado

  // Índices para workflow de aprobación
  @@index([approval_status, createdAt(sort: Desc)], map: "idx_approval_status_created")
  @@index([created_by_scout_id, approval_status], map: "idx_scout_approval")
}
```

## Pasos de Migración

### Fase 1: Preparación (✅ COMPLETADO)
- ✅ Tablas normalizadas creadas (Country, Position, Competition, Agency)
- ✅ Foreign keys agregadas a modelos principales
- ⚠️ Datos parcialmente migrados

### Fase 2: Migración de Datos (PENDIENTE)
1. Migrar todos los registros a tablas normalizadas
2. Actualizar todos los queries para usar relaciones
3. Verificar que no se usan campos denormalizados

### Fase 3: Limpieza de Índices (ESTE DOCUMENTO)
1. Ejecutar análisis de uso de índices en producción
2. Eliminar índices redundantes gradualmente
3. Medir impacto en performance

### Fase 4: Eliminación de Campos Legacy (FUTURO)
1. Eliminar campos denormalizados una vez confirmada migración
2. Actualizar schema.prisma
3. Crear migración final

## Métricas de Mejora Esperadas

- **Reducción de índices**: 18 → 13 (-28%)
- **Reducción de tamaño de tabla**: ~15-20% (eliminar campos duplicados)
- **Mejora en writes**: Menos índices = inserts/updates más rápidos
- **Queries más claros**: Uso de relaciones en lugar de campos denormalizados

## Comandos de Implementación

```bash
# 1. Crear migración de optimización de índices
npx prisma migrate dev --name optimize-player-indexes

# 2. Analizar uso de índices en producción (PostgreSQL)
psql $DATABASE_URL -c "SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public' AND relname = 'jugadores';"

# 3. Después de verificar, aplicar en producción
npx prisma migrate deploy
```

## Notas

- No eliminar índices hasta tener métricas de uso en producción
- Crear backups antes de cualquier migración
- Monitorear queries lentos después de cambios
