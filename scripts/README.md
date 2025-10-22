# Scripts de Scoutea

Este directorio contiene scripts para tareas administrativas y de mantenimiento.

## Scripts de Producción

### Población de Datos
- `populate-player-data.ts` - Poblar datos faltantes de jugadores
- `populate-missing-player-data.ts` - Poblar datos específicos faltantes
- `populate-scout-data.ts` - Poblar datos de scouts
- `populate-scout-economic-history.ts` - Poblar historial económico de scouts
- `populate-scout-current-values.ts` - Actualizar valores actuales de scouts
- `populate-player-scouts.ts` - Vincular jugadores con scouts
- `populate-market-value-history.ts` - Poblar historial de valores de mercado

### Cálculos y Análisis
- `calculate-radar-data.ts` - Calcular métricas de radar para jugadores
- `scheduled-radar-update.ts` - Actualización programada de radar charts
- `complete-player-data.ts` - Completar datos de jugadores

### Seeds
- `seed-equipos.ts` - Poblar equipos
- `seed-scout-data.ts` - Poblar datos iniciales de scouts
- `seed-player-roles.ts` - Poblar roles de jugadores

### Consolidación
- `consolidate-scout.ts` - Consolidar datos de scouts
- `consolidate-teams.ts` - Consolidar datos de equipos

### Fixes y Updates
- `fix-approval-status.ts` - Corregir estados de aprobación
- `fix-team-names-prefix.ts` - Corregir prefijos en nombres de equipos
- `update-transfermarkt-urls.ts` - Actualizar URLs de Transfermarkt
- `update-player-value.ts` - Actualizar valores de jugadores

### Administración de Usuarios
- `assign-tester-role.ts` - Asignar rol de tester
- `sync-scouts-from-clerk.ts` - Sincronizar scouts desde Clerk

## Scripts Archivados

Los scripts de testing, debugging y verificación han sido movidos a `__archive/` para mantener el directorio principal limpio.

## Uso

Para ejecutar un script:

```bash
npx tsx scripts/nombre-del-script.ts
```

## Notas

- Todos los scripts de producción están documentados internamente
- Los scripts que modifican la base de datos deben ejecutarse con precaución
- Respaldar la base de datos antes de ejecutar scripts de migración
