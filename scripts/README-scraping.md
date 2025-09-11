# Sistema de Scraping para URLs de Agentes

Este sistema automatiza la obtención de URLs de agentes de jugadores desde Transfermarkt.es.

## 📁 Archivos del Sistema

### Scripts Principales
- `scrape-agent-urls.js` - Script principal de scraping
- `scraping-manager.js` - Gestor principal del sistema
- `debug-scraping.js` - Script de depuración
- `verify-scraping-results.js` - Verificación de resultados

### Configuración
- `scraping-config.js` - Configuración del sistema
- `run-scraping.js` - Script de ejecución automatizada

## 🚀 Uso

### Ejecución Básica
```bash
# Scraping completo
node scripts/scraping-manager.js

# Scraping manual
node scripts/scrape-agent-urls.js

# Probar con un jugador específico
node scripts/scrape-agent-urls.js "Erling Haaland"

# Verificar resultados
node scripts/verify-scraping-results.js
```

### Depuración
```bash
# Analizar página de un jugador
node scripts/debug-scraping.js "Jugador Name"
```

## 🔧 Configuración

Edita `scraping-config.js` para ajustar:
- Timeouts de requests
- Delays entre requests
- Número máximo de jugadores por ejecución
- Configuración de logging

## 📊 Resultados

El sistema guarda las URLs en el campo `url_trfm_advisor` de la tabla `Jugador`:

- **URL de agente específico**: `/berater/agente-name/beraterfirma/berater/ID`
- **URL de perfil de jugador**: `/profil/spieler/ID` (cuando no hay agente)

## 🎯 Métodos de Búsqueda

El sistema utiliza múltiples métodos para encontrar agentes:

1. **Sección de datos principales** (`.data-header__label`)
2. **Tabla de información** (`.info-table__content`)
3. **Búsqueda por texto** ("Agent:", "Agente:", "Berater:")
4. **Enlaces específicos** (excluyendo páginas generales)

## ⚠️ Consideraciones

- **Rate limiting**: El sistema incluye delays aleatorios entre requests
- **Timeouts**: Configurado para evitar requests colgados
- **Manejo de errores**: Continúa procesando aunque falle algún jugador
- **Límites**: Procesa máximo 50 jugadores por ejecución

## 📈 Monitoreo

El sistema proporciona:
- Estadísticas en tiempo real
- Logs detallados de cada operación
- Resumen final con mejoras obtenidas
- Verificación de resultados

## 🔄 Automatización

Para ejecutar regularmente:
```bash
# Agregar a crontab (ejemplo: cada 6 horas)
0 */6 * * * cd /path/to/project && node scripts/scraping-manager.js
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Timeout errors**: Aumentar `timeout` en configuración
2. **Rate limiting**: Aumentar `delayBetweenRequests`
3. **Selectores no funcionan**: Usar `debug-scraping.js` para analizar HTML

### Logs de Depuración

El sistema guarda HTML de páginas problemáticas cuando `logging.saveHtml` está habilitado.

## 📝 Notas

- El sistema respeta los términos de servicio de Transfermarkt
- Incluye User-Agent realista para evitar bloqueos
- Maneja diferentes idiomas (español, inglés, alemán)
- Excluye páginas generales de estadísticas de agentes
