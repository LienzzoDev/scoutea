# Guía de Importación de Jugadores

Este documento describe cómo importar jugadores desde archivos Excel/XLS en la sección de administración.

## Descripción General

El sistema de importación permite:
- ✅ **Crear automáticamente** jugadores que no existan en la base de datos
- ✅ **Actualizar** jugadores existentes con nueva información
- ✅ **Importar estadísticas** de rendimiento de jugadores
- ✅ **Mapear todos los campos** disponibles en el modelo de jugador
- ✅ **Importación masiva** - Soporta hasta 3000+ jugadores en una sola operación

### 🚀 Optimizaciones de Rendimiento

El sistema está optimizado para manejar importaciones grandes:
- **Pre-carga inteligente**: Carga todos los jugadores existentes en memoria (1 query en lugar de 3000+)
- **Procesamiento por lotes**: Divide la importación en lotes de 100 jugadores
- **Timeout extendido**: 5 minutos de tiempo máximo de ejecución
- **Logs de progreso**: Muestra el progreso de cada lote en la consola del servidor

## Formatos Soportados

- `.xlsx` - Excel moderno
- `.xls` - Excel legacy
- `.csv` - Valores separados por comas

## Campos Disponibles para Importación

### 🆔 Identificación y Nombres

| Nombre de Columna | Tipo | Descripción | Requerido |
|-------------------|------|-------------|-----------|
| `old_id` | String/Number | ID antiguo del jugador | No |
| `id_player` | String | ID interno del jugador | No |
| `player_name` | String | Nombre del jugador | Sí* |
| `wyscout_id 1` | String/Number | ID principal de Wyscout | Sí |
| `wyscout_name 1` | String | Nombre en Wyscout 1 | No |
| `wyscout_id 2` | String/Number | ID secundario de Wyscout | No |
| `wyscout_name 2` | String | Nombre en Wyscout 2 | No |
| `id_fmi` | String | ID de Football Manager Index | No |
| `complete_player_name` | String | Nombre completo del jugador | No |

*Se puede usar `Player` como alternativa a `player_name`

### 📸 URLs y Referencias

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `photo_coverage` | String | Cobertura de fotos |
| `url_trfm_advisor` | String | URL Transfermarkt Advisor |
| `url_trfm` | String | URL Transfermarkt |
| `url_secondary` | String | URL secundaria |
| `url_instagram` | String | URL de Instagram |
| `video` | String | URL de video |

### 👤 Información Personal

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `date_of_birth` | Date/String | Fecha de nacimiento |
| `correct_date_of_birth` | Date/String | Fecha de nacimiento corregida |
| `age` | Number | Edad actual |
| `age_value` | Number | Valor de edad |
| `age_value_%` | Number | Valor de edad en porcentaje |
| `age_coeff` | Number | Coeficiente de edad |

### ⚽ Posición

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `position_player` | String | Posición del jugador (GK, CB, CM, etc.) |
| `correct_position_player` | String | Posición corregida |
| `position_value` | Number | Valor de posición |
| `position_value_%` | Number | Valor de posición en porcentaje |

### 🏃 Características Físicas

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `foot` | String | Pie hábil (Left, Right, Both) |
| `correct_foot` | String | Pie hábil corregido |
| `height` | Number | Altura en cm |
| `correct_height` | Number | Altura corregida |

### 🌍 Nacionalidad

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `nationality_1` | String | Nacionalidad principal |
| `correct_nationality_1` | String | Nacionalidad principal corregida |
| `nationality_value` | Number | Valor de nacionalidad |
| `nationality_value_%` | Number | Valor de nacionalidad en porcentaje |
| `nationality_2` | String | Segunda nacionalidad |
| `correct_nationality_2` | String | Segunda nacionalidad corregida |
| `national_tier` | String | Tier nacional |
| `rename_national_tier` | String | Tier nacional renombrado |
| `correct_national_tier` | String | Tier nacional corregido |

### 🏟️ Equipo

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `pre_team` | String | Equipo anterior |
| `team_name` | String | Nombre del equipo actual |
| `correct_team_name` | String | Nombre del equipo corregido |
| `team_country` | String | País del equipo |
| `team_elo` | Number | ELO del equipo |
| `team_level` | String | Nivel del equipo |
| `team_level_value` | Number | Valor del nivel del equipo |
| `team_level_value_%` | Number | Valor del nivel en porcentaje |

### 🏆 Competición

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `team_competition` | String | Competición del equipo |
| `competition_country` | String | País de la competición |
| `team_competition_value` | Number | Valor de la competición |
| `team_competition_value_%` | Number | Valor de competición en porcentaje |
| `competition_tier` | String | Tier de la competición |
| `competition_confederation` | String | Confederación (UEFA, CONMEBOL, etc.) |
| `competition_elo` | Number | ELO de la competición |
| `competition_level` | String | Nivel de la competición |
| `competition_level_value` | Number | Valor del nivel de competición |
| `competition_level_value_%` | Number | Valor del nivel en porcentaje |

### 🏢 Club Propietario y Préstamo

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `owner_club` | String | Club propietario |
| `owner_club_country` | String | País del club propietario |
| `owner_club_value` | Number | Valor del club propietario |
| `owner_club_value_%` | Number | Valor del club en porcentaje |
| `pre_team_loan_from` | String | Equipo previo de préstamo |
| `team_loan_from` | String | Equipo del que viene prestado |
| `correct_team_loan_from` | String | Equipo de préstamo corregido |
| `on_loan` | Boolean | Si está cedido (true/false, yes/no, 1/0) |

### 📝 Agencia y Contrato

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `agency` | String | Agencia de representación |
| `correct_agency` | String | Agencia corregida |
| `contract_end` | Date/String | Fin de contrato |
| `correct_contract_end` | Date/String | Fin de contrato corregido |

### 💰 Valor de Mercado y Métricas

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `player_rating` | Number | Rating del jugador |
| `player_rating_norm` | Number | Rating normalizado |
| `player_trfm_value` | Number | Valor Transfermarkt |
| `player_trfm_value_norm` | Number | Valor Transfermarkt normalizado |
| `stats_evo_3m` | Number | Evolución de estadísticas 3 meses |
| `total_fmi_pts_norm` | Number | Puntos FMI normalizados |
| `player_elo` | Number | ELO del jugador |
| `player_level` | String | Nivel del jugador |
| `player_ranking` | Number | Ranking del jugador |
| `community_potential` | Number | Potencial comunitario |
| `existing_club` | String | Club existente |

### 📊 Estadísticas de Rendimiento (3 meses)

| Nombre de Columna | Tipo | Descripción |
|-------------------|------|-------------|
| `Matches played` | Number | Partidos jugados |
| `Minutes played` | Number | Minutos jugados |
| `Defensive duels per 90` | Number | Duelos defensivos por 90 min |
| `Defensive duels won, %` | Number | % duelos defensivos ganados |
| `Aerial duels per 90` | Number | Duelos aéreos por 90 min |
| `Aerial duels won, %` | Number | % duelos aéreos ganados |
| `Sliding tackles per 90` | Number | Entradas por 90 min |
| `Interceptions per 90` | Number | Intercepciones por 90 min |
| `Fouls per 90` | Number | Faltas por 90 min |
| `Yellow cards per 90` | Number | Tarjetas amarillas por 90 min |
| `Red cards per 90` | Number | Tarjetas rojas por 90 min |
| `Goals per 90` | Number | Goles por 90 min |
| `Shots per 90` | Number | Tiros por 90 min |
| `Assists per 90` | Number | Asistencias por 90 min |
| `Crosses per 90` | Number | Centros por 90 min |
| `Offensive duels per 90` | Number | Duelos ofensivos por 90 min |
| `Offensive duels won, %` | Number | % duelos ofensivos ganados |
| `Passes per 90` | Number | Pases por 90 min |
| `Accurate passes, %` | Number | % pases precisos |
| `Forward passes per 90` | Number | Pases hacia adelante por 90 min |
| `Conceded goals per 90` | Number | Goles encajados por 90 min (porteros) |
| `Shots against per 90` | Number | Tiros en contra por 90 min (porteros) |
| `Clean sheets` | Number | Porterías a cero (porteros) |
| `Save rate, %` | Number | % de paradas (porteros) |
| `Prevented goals per 90` | Number | Goles evitados por 90 min (porteros) |

## Cómo Usar

### 1. Preparar el Archivo Excel

Crea un archivo Excel con las columnas que necesites. **Ejemplo mínimo**:

| wyscout_id 1 | player_name | team_name | position_player | age |
|--------------|-------------|-----------|-----------------|-----|
| 123456 | John Doe | FC Barcelona | CM | 25 |
| 789012 | Jane Smith | Real Madrid | FW | 23 |

### 2. Importar el Archivo

1. Ve a **Admin > Jugadores**
2. Haz clic en **"Importar Estadísticas XLS"**
3. Selecciona tu archivo
4. Espera a que se complete la importación

### 3. Revisar Resultados

El sistema mostrará:
- ✅ **Exitosos**: Jugadores procesados correctamente
- 🆕 **Creados**: Jugadores nuevos añadidos a la base de datos
- 🔄 **Actualizados**: Jugadores existentes que fueron actualizados
- ❌ **Fallidos**: Filas con errores

## Reglas de Importación

### Búsqueda de Jugadores

El sistema busca jugadores existentes por:
1. `wyscout_id_1` coincide con el ID del XLS
2. `wyscout_id_2` coincide con el ID del XLS
3. `id_player` coincide (si se proporciona)

### Creación Automática

Si un jugador **NO existe**:
- Se crea automáticamente con todos los campos del XLS
- Se asigna un ID único (`id_player`)
- Se marca como "creado" en el reporte

### Actualización Automática

Si un jugador **YA existe**:
- Se actualizan TODOS los campos proporcionados en el XLS
- Los campos no incluidos en el XLS no se modifican
- Se marca como "actualizado" en el reporte
- Las estadísticas se actualizan o crean según corresponda

### Conversión de Tipos

El sistema convierte automáticamente:
- **Fechas**: Formatos ISO, DD/MM/YYYY, etc.
- **Booleanos**: `true/false`, `yes/no`, `sí/no`, `1/0`
- **Números**: Strings numéricos → números
- **Strings vacíos**: Se convierten en `null`

## Ejemplos de Archivos

### Ejemplo 1: Importación Básica

```csv
wyscout_id 1,player_name,team_name,position_player,age
123456,John Doe,FC Barcelona,CM,25
789012,Jane Smith,Real Madrid,FW,23
```

### Ejemplo 2: Importación Completa

```csv
wyscout_id 1,player_name,team_name,position_player,age,nationality_1,height,foot,player_rating,player_trfm_value
123456,John Doe,FC Barcelona,CM,25,Spain,178,Right,8.5,50000000
789012,Jane Smith,Real Madrid,FW,23,Brazil,165,Left,9.0,75000000
```

### Ejemplo 3: Con Estadísticas

```csv
wyscout_id 1,player_name,Matches played,Goals per 90,Assists per 90,Passes per 90,Accurate passes, %
123456,John Doe,15,0.5,0.3,65.2,88.5
789012,Jane Smith,18,0.9,0.4,45.8,82.3
```

## Solución de Problemas

### Error: "Fila sin ID de Wyscout"

**Solución**: Asegúrate de que cada fila tenga una de estas columnas:
- `wyscout_id 1`
- `id` (campo legacy)

### Error: "Jugador con Wyscout ID XXX no encontrado"

Esto ya **NO** debería ocurrir. El sistema ahora crea jugadores automáticamente.

### Campos no se actualizan

**Causa**: Los campos están vacíos en el XLS
**Solución**: Incluye valores para todos los campos que quieras actualizar

### Fechas incorrectas

**Solución**: Usa formato ISO `YYYY-MM-DD` o `DD/MM/YYYY`

## Importaciones Masivas (3000+ jugadores)

### ¿Se pueden importar 3000 jugadores de golpe?

**Sí**, el sistema está optimizado para manejar importaciones masivas. Aquí está cómo funciona:

#### Rendimiento Esperado

| Cantidad de Jugadores | Tiempo Estimado | Memoria Usada |
|-----------------------|-----------------|---------------|
| 100 jugadores | ~10 segundos | Baja |
| 500 jugadores | ~45 segundos | Media |
| 1000 jugadores | ~90 segundos | Media |
| 3000 jugadores | ~4-5 minutos | Alta |

#### Proceso de Importación Masiva

1. **Pre-carga** (5-10 seg): El sistema carga todos los jugadores existentes en memoria
2. **Procesamiento** (3-4 min): Divide los 3000 jugadores en 30 lotes de 100
3. **Logs de progreso**: Cada lote muestra su progreso en la consola
4. **Finalización** (< 1 seg): Genera el reporte final

#### Ejemplo de Logs del Servidor

```
📥 Pre-cargando jugadores existentes...
✅ 1500 jugadores existentes cargados en memoria
🔄 Procesando 3000 jugadores en 30 lotes de 100
📦 Procesando lote 1/30 (100 jugadores)
✅ Lote 1/30 completado. Total: 100 exitosos, 0 fallidos
📦 Procesando lote 2/30 (100 jugadores)
✅ Lote 2/30 completado. Total: 200 exitosos, 0 fallidos
...
✅ Stats Import completed: 2950 exitosos, 50 fallidos
```

### Mejores Prácticas para Importaciones Grandes

1. **Dividir en archivos más pequeños** (recomendado):
   - En lugar de 1 archivo de 3000, usa 3 archivos de 1000
   - Más fácil de debuggear si hay errores
   - Menor riesgo de timeout

2. **Importar fuera de horarios pico**:
   - Reduce la carga en el servidor
   - Mejora la experiencia de otros usuarios

3. **Verificar formato antes de importar**:
   - Usa una muestra de 10-20 filas primero
   - Verifica que los campos estén bien mapeados
   - Luego importa el archivo completo

4. **Monitorear la consola del servidor**:
   - Los logs de progreso te permiten ver el avance
   - Útil para detectar problemas temprano

### Límites y Restricciones

| Límite | Valor | Notas |
|--------|-------|-------|
| **Tamaño máximo de archivo** | ~50 MB | Excel puede manejar hasta 1M filas |
| **Timeout máximo** | 5 minutos | Configurado en el endpoint |
| **Jugadores máximos** | ~5000-6000 | Depende de la cantidad de campos |
| **Errores máximos mostrados** | 100 | Para evitar memoria excesiva |
| **Jugadores creados mostrados** | 50 | Para evitar memoria excesiva |

### Qué Hacer Si Falla una Importación Masiva

1. **Revisar los errores**: El sistema muestra los primeros 100 errores
2. **Importar en lotes más pequeños**: Dividir el archivo
3. **Verificar memoria del servidor**: Podría estar saturado
4. **Contactar al administrador**: Si el problema persiste

## Notas Importantes

⚠️ **Backup**: Siempre haz una copia de seguridad antes de importaciones masivas

⚠️ **Validación**: Revisa los datos antes de importar para evitar errores

⚠️ **Paciencia**: Importaciones de 3000+ jugadores pueden tomar 4-5 minutos

✅ **Campos opcionales**: Todos los campos excepto `wyscout_id 1` y `player_name` son opcionales

✅ **Actualización segura**: Los jugadores existentes se actualizan sin perder datos no incluidos en el XLS

✅ **Estadísticas**: Las estadísticas se manejan con `upsert` (crear o actualizar)

✅ **Sin duplicados**: El sistema detecta jugadores existentes por Wyscout ID

## Contacto y Soporte

Para reportar problemas o sugerencias con el sistema de importación, contacta al administrador del sistema.
