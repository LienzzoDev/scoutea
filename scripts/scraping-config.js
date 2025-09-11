module.exports = {
  // URLs y configuración base
  BASE_URL: "https://www.transfermarkt.es",
  
  // Headers para las peticiones HTTP
  HEADERS: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
  },
  
  // Configuración de timeouts
  TIMEOUTS: {
    SEARCH: 10000,    // 10 segundos para búsquedas
    PLAYER: 15000,    // 15 segundos para perfiles de jugadores
    REQUEST: 20000    // 20 segundos para peticiones generales
  },
  
  // Configuración de delays
  DELAYS: {
    BETWEEN_PLAYERS: 3000,    // 3 segundos entre jugadores
    BETWEEN_BATCHES: 30000,   // 30 segundos entre lotes
    BETWEEN_RETRIES: 5000,    // 5 segundos entre reintentos
    RANDOM_MIN: 1000,         // Delay aleatorio mínimo
    RANDOM_MAX: 3000          // Delay aleatorio máximo
  },
  
  // Configuración de lotes
  BATCH: {
    SIZE: 10,         // Jugadores por lote
    MAX_RETRIES: 3,   // Máximo reintentos por jugador
    MAX_ERRORS: 5     // Máximo errores consecutivos antes de pausar
  },
  
  // Selectores CSS para extraer datos
  SELECTORS: {
    // Búsqueda de jugadores
    PLAYER_LINKS: [
      'a.spielprofil_tooltip',
      'a[href*="/profil/spieler/"]',
      'a[href*="/spieler/"]'
    ],
    
    // Datos básicos
    DATE_OF_BIRTH: [
      '.data-header__label:contains("Fecha de nacimiento:") + .data-header__content',
      '.info-table__content:contains("Fecha de nacimiento:") + .info-table__content',
      '.data-header__label:contains("Born:") + .data-header__content',
      '.info-table__content:contains("Born:") + .info-table__content'
    ],
    
    TEAM_NAME: [
      '.data-header__label:contains("Club actual:") + .data-header__content a',
      '.info-table__content:contains("Club actual:") + .info-table__content a',
      '.data-header__label:contains("Current club:") + .data-header__content a',
      '.info-table__content:contains("Current club:") + .info-table__content a',
      '.hauptlink a[href*="/verein/"]'
    ],
    
    LOAN_FROM: [
      '.data-header__label:contains("Préstamo desde:") + .data-header__content a',
      '.info-table__content:contains("Préstamo desde:") + .info-table__content a',
      '.data-header__label:contains("On loan from:") + .data-header__content a',
      '.info-table__content:contains("On loan from:") + .info-table__content a'
    ],
    
    POSITION: [
      '.data-header__label:contains("Posición:") + .data-header__content',
      '.info-table__content:contains("Posición:") + .info-table__content',
      '.data-header__label:contains("Position:") + .data-header__content',
      '.info-table__content:contains("Position:") + .info-table__content',
      '.hauptlink a[href*="/pos/"]'
    ],
    
    FOOT: [
      '.data-header__label:contains("Pie preferido:") + .data-header__content',
      '.info-table__content:contains("Pie preferido:") + .info-table__content',
      '.data-header__label:contains("Foot:") + .data-header__content',
      '.info-table__content:contains("Foot:") + .info-table__content'
    ],
    
    HEIGHT: [
      '.data-header__label:contains("Altura:") + .data-header__content',
      '.info-table__content:contains("Altura:") + .info-table__content',
      '.data-header__label:contains("Height:") + .data-header__content',
      '.info-table__content:contains("Height:") + .info-table__content'
    ],
    
    NATIONALITY: [
      '.data-header__label:contains("Nacionalidad:") + .data-header__content a',
      '.info-table__content:contains("Nacionalidad:") + .info-table__content a',
      '.data-header__label:contains("Citizenship:") + .data-header__content a',
      '.info-table__content:contains("Citizenship:") + .info-table__content a'
    ],
    
    NATIONAL_TIER: [
      '.data-header__label:contains("Nivel nacional:") + .data-header__content',
      '.info-table__content:contains("Nivel nacional:") + .info-table__content',
      '.data-header__label:contains("National tier:") + .data-header__content',
      '.info-table__content:contains("National tier:") + .info-table__content'
    ],
    
    AGENCY: [
      '.data-header__label:contains("Agente:") + .data-header__content a',
      '.info-table__content:contains("Agente:") + .info-table__content a',
      '.data-header__label:contains("Agent:") + .data-header__content a',
      '.info-table__content:contains("Agent:") + .info-table__content a'
    ],
    
    CONTRACT_END: [
      '.data-header__label:contains("Contrato hasta:") + .data-header__content',
      '.info-table__content:contains("Contrato hasta:") + .info-table__content',
      '.data-header__label:contains("Contract until:") + .data-header__content',
      '.info-table__content:contains("Contract until:") + .info-table__content'
    ],
    
    PLAYER_VALUE: [
      '.data-header__label:contains("Valor de mercado:") + .data-header__content',
      '.info-table__content:contains("Valor de mercado:") + .info-table__content',
      '.data-header__label:contains("Market value:") + .data-header__content',
      '.info-table__content:contains("Market value:") + .info-table__content',
      '.tm-player-market-value-development__current-value'
    ]
  },
  
  // Patrones de regex para extraer datos
  PATTERNS: {
    DATE: /(\d{1,2})[./](\d{1,2})[./](\d{4})/,
    HEIGHT: /(\d+)\s*cm/,
    VALUE: /€?([\d,]+)\.?(\d*)\s*([km]?)/i
  },
  
  // Configuración de logging
  LOGGING: {
    LEVEL: 'info', // debug, info, warn, error
    SAVE_HTML: false, // Guardar HTML para debugging
    SAVE_PATH: './debug-html/'
  }
}