# Sistema Completo de Scraping de Datos de Jugadores

Este sistema permite extraer datos completos de jugadores desde Transfermarkt.es y actualizar la base de datos de manera automatizada y controlada.

## 🎯 Campos Extraídos

El sistema extrae los siguientes campos para cada jugador:

| Campo | Descripción | Tipo | Ejemplo |
|-------|-------------|------|---------|
| `url_trfm_advisor` | URL del perfil en Transfermarkt | URL | `https://www.transfermarkt.es/lionel-messi/profil/spieler/28003` |
| `date_of_birth` | Fecha de nacimiento | Date | `1987-06-24` |
| `team_name` | Nombre del equipo actual | String | `Inter Miami CF` |
| `team_loan_from` | Equipo de préstamo (si aplica) | String | `Real Madrid` |
| `position_player` | Posición del jugador | String | `Delantero - Extremo derecho` |
| `foot` | Pie preferido | String | `Izquierdo` |
| `height` | Altura en centímetros | Number | `170` |
| `nationality_1` | Primera nacionalidad | String | `Argentina` |
| `nationality_2` | Segunda nacionalidad (si aplica) | String | `España` |
| `national_tier` | Nivel nacional | String | `Primera División` |
| `agency` | Agencia/representante | String | `Gestifute` |
| `contract_end` | Fecha de fin de contrato | Date | `2025-12-31` |
| `player_trfm_value` | Valor de mercado en euros | Number | `18000000` |

## 🚀 Scripts Disponibles

### 1. **Script Principal de Scraping**
```bash
# Probar con un jugador específico
node scripts/scrape-player-data.js "Lionel Messi"

# Probar con múltiples jugadores
node scripts/test-multiple-players.js
```

### 2. **Script de Gestión Automatizada**
```bash
# Ejecutar scraping completo (recomendado)
node scripts/run-scraping-manager.js

# Verificar progreso
node scripts/run-scraping-manager.js --check
```

### 3. **Scripts de Verificación**
```bash
# Verificar datos extraídos
node scripts/verify-scraping-data.js

# Debug de página específica
node scripts/debug-player-page.js "Lionel Messi"
```

## ⚙️ Configuración

### Delays y Límites
- **Entre jugadores**: 5 segundos
- **Entre lotes**: 30 segundos
- **Tamaño de lote**: 5 jugadores
- **Timeouts**: 10-20 segundos

### Headers HTTP
```javascript
{
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
}
```

## 📊 Uso Recomendado

### 1. **Prueba Inicial**
```bash
# Verificar funcionamiento con jugadores conocidos
node scripts/scrape-player-data.js "Lionel Messi"
node scripts/scrape-player-data.js "Cristiano Ronaldo"
```

### 2. **Prueba Múltiple**
```bash
# Probar con varios jugadores
node scripts/test-multiple-players.js
```

### 3. **Ejecución Completa**
```bash
# Iniciar scraping automatizado
node scripts/run-scraping-manager.js
```

### 4. **Monitoreo**
```bash
# Verificar progreso
node scripts/run-scraping-manager.js --check
```

## 🔧 Características Técnicas

### Selectores CSS Múltiples
- Selectores en español e inglés
- Fallbacks automáticos
- Búsqueda en texto completo de página

### Patrones de Extracción
- **Fechas**: DD/MM/YYYY → YYYY-MM-DD
- **Valores**: €50.00m → 50000000
- **Alturas**: 180 cm → 180

### Manejo de Errores
- Reintentos automáticos
- Logging detallado
- Pausas en caso de errores

## 📈 Monitoreo y Estadísticas

### Progreso en Tiempo Real
- Campos extraídos por jugador
- Estadísticas por lote
- Tasa de éxito global

### Verificación de Datos
- Progreso por campo
- Top equipos, posiciones, nacionalidades
- Análisis de valores y alturas

## 🛠️ Solución de Problemas

### Si el scraping se detiene:
1. Verificar logs de error
2. Aumentar delays en configuración
3. Reducir tamaño de lote
4. Verificar conectividad

### Si faltan datos:
1. Verificar selectores CSS
2. Comprobar cambios en Transfermarkt
3. Actualizar patrones de regex
4. Revisar logs de extracción

### Si hay muchos errores:
1. Aumentar timeouts
2. Reducir velocidad de scraping
3. Verificar headers HTTP
4. Comprobar estructura de página

## 📋 Ejemplo de Uso Completo

```bash
# 1. Verificar funcionamiento
node scripts/scrape-player-data.js "Lionel Messi"

# 2. Probar con múltiples jugadores
node scripts/test-multiple-players.js

# 3. Iniciar scraping completo
node scripts/run-scraping-manager.js

# 4. Verificar progreso (en otra terminal)
node scripts/run-scraping-manager.js --check

# 5. Verificar datos finales
node scripts/verify-scraping-data.js
```

## 🎯 Resultados Esperados

### Campos con Alta Tasa de Éxito (>80%)
- `url_trfm_advisor` - URL del perfil
- `position_player` - Posición del jugador
- `contract_end` - Fin de contrato
- `player_trfm_value` - Valor de mercado

### Campos con Tasa Media (50-80%)
- `team_name` - Nombre del equipo
- `nationality_1` - Primera nacionalidad
- `agency` - Agencia/representante

### Campos con Tasa Baja (<50%)
- `date_of_birth` - Fecha de nacimiento
- `height` - Altura
- `foot` - Pie preferido
- `national_tier` - Nivel nacional

## 🔄 Mantenimiento

### Actualizaciones Regulares
- Revisar selectores CSS mensualmente
- Actualizar patrones de regex según cambios en Transfermarkt
- Ajustar delays según rendimiento

### Monitoreo Continuo
- Verificar tasa de éxito semanalmente
- Revisar logs de errores
- Ajustar configuración según necesidades

## 📞 Soporte

Para problemas o mejoras:
1. Revisar logs de error
2. Verificar configuración
3. Probar con jugadores específicos
4. Consultar documentación de Transfermarkt
