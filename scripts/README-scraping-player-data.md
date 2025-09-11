# Sistema de Scraping de Datos de Jugadores

Este sistema permite extraer datos completos de jugadores desde Transfermarkt.es y actualizar la base de datos.

## Campos Extraídos

El sistema extrae los siguientes campos para cada jugador:

- `url_trfm_advisor` - URL del perfil en Transfermarkt
- `date_of_birth` - Fecha de nacimiento
- `team_name` - Nombre del equipo actual
- `team_loan_from` - Equipo de préstamo (si aplica)
- `position_player` - Posición del jugador
- `foot` - Pie preferido
- `height` - Altura en centímetros
- `nationality_1` - Primera nacionalidad
- `nationality_2` - Segunda nacionalidad (si aplica)
- `national_tier` - Nivel nacional
- `agency` - Agencia/representante
- `contract_end` - Fecha de fin de contrato
- `player_trfm_value` - Valor de mercado en euros

## Scripts Disponibles

### 1. `scrape-player-data.js`
Script principal que contiene todas las funciones de extracción de datos.

**Funciones principales:**
- `scrapePlayerData(playerName)` - Extrae datos de un jugador específico
- `scrapeAllPlayersFromDatabase()` - Procesa todos los jugadores de la BD

### 2. `run-player-scraping.js`
Script de gestión para ejecutar el scraping de manera controlada.

**Características:**
- Procesamiento por lotes (10 jugadores por lote)
- Pausas entre jugadores y lotes para evitar bloqueos
- Sistema de reintentos
- Estadísticas en tiempo real

**Uso:**
```bash
# Ejecutar scraping completo
node run-player-scraping.js

# Verificar progreso
node run-player-scraping.js --check
```

### 3. `test-scrape-player.js`
Script de pruebas para verificar el funcionamiento.

**Uso:**
```bash
node test-scrape-player.js
```

### 4. `verify-scraping-data.js`
Script para verificar qué datos se han extraído exitosamente.

**Uso:**
```bash
node verify-scraping-data.js
```

## Configuración

### `scraping-config.js`
Archivo de configuración que contiene:
- URLs base
- Headers HTTP
- Timeouts
- Delays entre peticiones
- Selectores CSS
- Patrones de regex

## Uso Recomendado

### 1. Prueba Inicial
```bash
# Probar con jugadores específicos
node scrape-player-data.js "Lionel Messi"
node scrape-player-data.js "Cristiano Ronaldo"
```

### 2. Verificar Funcionamiento
```bash
# Ejecutar pruebas
node test-scrape-player.js
```

### 3. Ejecutar Scraping Completo
```bash
# Iniciar scraping controlado
node run-player-scraping.js
```

### 4. Monitorear Progreso
```bash
# Verificar datos extraídos
node verify-scraping-data.js
```

## Configuración de Delays

El sistema incluye delays configurable para evitar ser bloqueado:

- **Entre jugadores**: 3 segundos
- **Entre lotes**: 30 segundos
- **Entre reintentos**: 5 segundos
- **Aleatorio**: 1-3 segundos adicionales

## Manejo de Errores

- **Reintentos**: Hasta 3 intentos por jugador
- **Timeouts**: 10-20 segundos según el tipo de petición
- **Logging**: Detallado para debugging
- **Pausas**: Automáticas en caso de muchos errores

## Selectores CSS

El sistema usa múltiples selectores para cada campo para maximizar la compatibilidad:

- Selectores en español e inglés
- Diferentes estructuras de página
- Fallbacks automáticos

## Patrones de Extracción

### Fechas
- Formato: DD/MM/YYYY o DD.MM.YYYY
- Conversión automática a YYYY-MM-DD

### Valores de Mercado
- Formato: €50.00m, €1.5k, etc.
- Conversión automática a euros enteros

### Alturas
- Formato: 180 cm, 1.80m, etc.
- Conversión automática a centímetros

## Monitoreo

### Estadísticas Disponibles
- Progreso por campo
- Jugadores completos vs incompletos
- Top equipos, posiciones, nacionalidades
- Análisis de valores y alturas

### Logs
- Progreso en tiempo real
- Errores detallados
- Estadísticas por lote

## Consideraciones Importantes

1. **Rate Limiting**: El sistema respeta los delays para evitar bloqueos
2. **Robustez**: Múltiples selectores y patrones de extracción
3. **Escalabilidad**: Procesamiento por lotes
4. **Monitoreo**: Herramientas de verificación incluidas
5. **Mantenimiento**: Configuración centralizada

## Solución de Problemas

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
