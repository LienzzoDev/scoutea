# 📊 Archivos de Prueba para Importaciones

Este directorio contiene archivos de ejemplo para probar las funcionalidades de importación del admin.

## 📁 Archivos Disponibles

### 1. `fmi-import-example.json`
**Propósito**: Probar importación de atributos FMI desde Football Manager

**Wyscout ID**: 2000188850

**Uso**:
1. Ir a `/admin/jugadores`
2. Click en "Importar FMI JSON"
3. Seleccionar este archivo
4. Verificar que se importen los 62 atributos FMI

**Qué importa**:
- 14 atributos técnicos
- 14 atributos mentales
- 10 atributos físicos
- 11 atributos de portero
- 5 atributos ocultos
- 8 atributos de personalidad

---

### 2. `stats-import-example.csv`
**Propósito**: Probar importación de estadísticas desde Excel/CSV

**Wyscout IDs**: 10 jugadores de prueba
- 509175 - Delantero
- 60883 - Centrocampista
- 423623 - Defensa
- 393793 - Lateral
- 95877 - Portero
- 335229 - Extremo
- -209416 - Mediapunta
- -357451 - Pivote
- 439042 - Lateral Izquierdo
- -355416 - Delantero Centro

**Uso**:
1. Ir a `/admin/jugadores`
2. Click en "Importar Estadísticas XLS"
3. Seleccionar este archivo (también funciona con .xlsx)
4. Verificar que se importen las 26 estadísticas para los 10 jugadores

**Qué importa**:
- Partidos y minutos jugados
- Duelos defensivos y aéreos (por 90')
- Entradas, intercepciones, faltas
- Tarjetas amarillas y rojas
- Goles, tiros, asistencias
- Centros y pases
- Duelos ofensivos
- Estadísticas de portero (solo para GK)

---

## 🔄 Crear Jugadores de Prueba

Si los jugadores de prueba no existen en la base de datos, ejecutar:

```bash
npx tsx scripts/create-test-players-stats.ts
```

Este script creará automáticamente los 10 jugadores con los Wyscout IDs necesarios.

---

## ✅ Verificación Post-Importación

### Para FMI JSON:
1. Buscar jugador "Test Player - Jugador Marroquí" (Wyscout ID: 2000188850)
2. Verificar que tenga valores en campos FMI:
   - corners_fmi, crossing_fmi, dribbling_fmi
   - acceleration_fmi, agility_fmi, pace_fmi
   - aggression_fmi, anticipation_fmi, composure_fmi
   - etc.

### Para Stats Excel/CSV:
1. Buscar cualquiera de los "Test Player X"
2. Verificar que tengan valores en campos de estadísticas:
   - matches_played_tot_3m
   - goals_p90_3m, assists_p90_3m
   - def_duels_p90_3m, aerials_duels_p90_3m
   - passes_p90_3m, accurate_passes_percent_3m
   - etc.

---

## 🗑️ Limpiar Jugadores de Prueba

Para eliminar los jugadores de prueba después de las pruebas:

```sql
DELETE FROM jugador WHERE id_player LIKE 'test_%';
DELETE FROM stats WHERE id_player LIKE 'test_%';
DELETE FROM atributos WHERE id_player LIKE 'test_%';
```

O desde Prisma Studio:
```bash
npx prisma studio
```

---

## 📝 Notas

- Los archivos CSV usan coma (,) como separador
- Los campos vacíos se importan como NULL
- Los Wyscout IDs negativos son válidos (algunos jugadores tienen IDs negativos)
- El portero (ID: 95877) solo tiene estadísticas de portero, no de jugador de campo
- Los jugadores de campo no tienen estadísticas de portero

---

**Última actualización**: 2025-10-15
