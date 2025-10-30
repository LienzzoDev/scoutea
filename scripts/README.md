# Scoutea Scripts

Scripts de utilidad para mantenimiento y población de datos del proyecto Scoutea.

## 📁 Estructura

- **scripts/** - Scripts activos de uso recurrente
- **scripts/__archive/** - Scripts de one-time fixes y debugging archivados

## 🚀 Scripts Activos

### Cálculo de Valores (Avg Values)
Scripts que calculan valores promedio comparativos:
- `calculate-age-values.ts` - Calcula avg values por edad
- `calculate-nationality-values.ts` - Calcula avg values por nacionalidad
- `calculate-competition-values.ts` - Calcula avg values por competición
- `calculate-team-values.ts` - Calcula avg values por equipo
- `calculate-stats-normalizations.ts` - Normaliza estadísticas

### Radar y Métricas
- `calculate-radar-data.ts` - Calcula datos para radar charts de jugadores
- `scheduled-radar-update.ts` - Actualización programada de radar data

### Población de Datos
- `populate-player-data.ts` - Puebla datos faltantes de jugadores
- `populate-missing-player-data.ts` - Variante específica para datos missing
- `complete-player-data.ts` - Completa datos parciales
- `populate-scout-data.ts` - Puebla datos de scouts
- `populate-scout-current-values.ts` - Actualiza valores actuales de scouts
- `populate-scout-economic-history.ts` - Historial económico de scouts
- `populate-market-value-history.ts` - Historial de valores de mercado
- `populate-player-scouts.ts` - Relaciones jugador-scout

### Seeding
- `seed-scout-data.ts` - Seed inicial de datos de scouts
- `seed-equipos.ts` - Seed de equipos
- `seed-player-roles.ts` - Seed de roles de jugadores

### Consolidación y Sincronización
- `consolidate-scout.ts` - Consolida datos duplicados de scouts
- `consolidate-teams.ts` - Consolida datos de equipos
- `sync-scout-names.ts` - Sincroniza nombres de scouts
- `sync-scouts-from-clerk.ts` - Sincroniza scouts desde Clerk Auth

### Actualizaciones
- `update-player-value.ts` - Actualiza valores de jugadores
- `update-transfermarkt-urls.ts` - Actualiza URLs de Transfermarkt
- `update-wyscout-ids.ts` - Actualiza IDs de Wyscout

### Roles y Permisos
- `assign-tester-role.ts` - Asigna rol de tester a usuarios

## 📦 Uso

Ejecutar cualquier script con:

```bash
npx tsx scripts/[nombre-del-script].ts
```

Ejemplo:
```bash
npx tsx scripts/calculate-radar-data.ts
```

## 🗄️ Scripts Archivados

Los scripts en `__archive/` son:
- Fixes one-time que ya se ejecutaron
- Scripts de debugging obsoletos
- Implementaciones antiguas reemplazadas

No deben ejecutarse en producción a menos que se sepa exactamente qué hacen.

## ⚠️ Notas Importantes

- Todos los scripts se conectan a la base de datos usando Prisma
- Asegúrate de tener `DATABASE_URL` configurado en `.env`
- Algunos scripts pueden tardar varios minutos en ejecutarse
- Revisa los logs para verificar que los scripts completaron correctamente
- Los scripts de "calculate" deben ejecutarse después de importar nuevos datos

## 🔄 Flujo Típico de Actualización de Datos

1. Importar datos nuevos (via API routes o scripts de populate)
2. Ejecutar scripts de cálculo:
   ```bash
   npx tsx scripts/calculate-age-values.ts
   npx tsx scripts/calculate-nationality-values.ts
   npx tsx scripts/calculate-competition-values.ts
   npx tsx scripts/calculate-team-values.ts
   npx tsx scripts/calculate-radar-data.ts
   ```
3. Sincronizar datos relacionados si es necesario
4. Verificar en la UI que los datos se muestran correctamente
