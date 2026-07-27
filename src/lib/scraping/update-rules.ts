/**
 * 📏 REGLAS DE ACTUALIZACIÓN DE DATOS SCRAPEADOS
 *
 * Única fuente de verdad para decidir si un dato scrapeado debe
 * sobrescribir el existente. Antes estas reglas estaban duplicadas
 * en /api/admin/scraping/process y /api/admin/scraping/cron.
 */

export interface PlayerSnapshot {
  date_of_birth: Date | null
  team_name: string | null
  team_country: string | null
  team_loan_from: string | null
  position_player: string | null
  height: number | null
  agency: string | null
}

/**
 * 📅 VALIDAR SI DEBE ACTUALIZARSE LA FECHA DE NACIMIENTO
 *
 * Reglas:
 * 1. Si la celda está en blanco → escribir la info del scraping
 * 2. Si la celda tiene fecha diferente a 01/01 → NO escribir si scraping es 01/01
 * 3. Si la celda tiene fecha igual a 01/01 → escribir si scraping es diferente a 01/01
 */
export function shouldUpdateDateOfBirth(
  existingDate: Date | null,
  scrapedDate: Date | null
): boolean {
  if (!existingDate) return true
  if (!scrapedDate) return false

  const isExistingGeneric = existingDate.getMonth() === 0 && existingDate.getDate() === 1
  const isScrapedGeneric = scrapedDate.getMonth() === 0 && scrapedDate.getDate() === 1

  if (!isExistingGeneric && isScrapedGeneric) return false
  if (isExistingGeneric && !isScrapedGeneric) return true

  return existingDate.getTime() !== scrapedDate.getTime()
}

/**
 * 🏟️ MAPEO DE EQUIPOS DUPLICADOS CON SUS PAÍSES
 */
const DUPLICATE_TEAM_MAPPINGS: Record<string, Record<string, string>> = {
  'Arsenal': {
    'England': 'Arsenal FC',
    'Argentina': 'Arsenal Fútbol Club'
  },
  'Arsenal FC': {
    'England': 'Arsenal FC',
    'Argentina': 'Arsenal Fútbol Club'
  },
  'Independiente': {
    'Argentina': 'CA Independiente',
    'Ecuador': 'Independiente del Valle',
    'Colombia': 'Independiente Medellín'
  },
  'CA Independiente': {
    'Argentina': 'CA Independiente'
  },
  'Independiente del Valle': {
    'Ecuador': 'Independiente del Valle'
  },
  'Independiente Medellín': {
    'Colombia': 'Independiente Medellín'
  },
  'Universidad Católica': {
    'Chile': 'CD Universidad Católica',
    'Ecuador': 'Universidad Católica (Ecuador)'
  },
  'CD Universidad Católica': {
    'Chile': 'CD Universidad Católica'
  }
}

/**
 * 🌍 RESOLVER NOMBRE DE EQUIPO BASADO EN EL PAÍS
 */
export function resolveTeamNameByCountry(teamName: string, teamCountry: string): string {
  const normalizedName = teamName.trim()
  const mapping = DUPLICATE_TEAM_MAPPINGS[normalizedName]

  if (mapping) {
    const resolvedName = mapping[teamCountry]
    if (resolvedName) {
      return resolvedName
    }
  }

  return normalizedName
}

/**
 * 🏟️ VALIDAR SI DEBE ACTUALIZARSE EL NOMBRE DEL EQUIPO
 *
 * Reglas:
 * 1. Celda en blanco → escribir
 * 2. Celda con info real → NO sobrescribir con valores "desconocidos"
 * 3. Celda "desconocida" → escribir si el scraping trae algo real
 * 4. Equipos duplicados (Arsenal, Independiente...) → resolver por país
 */
export function shouldUpdateTeamName(
  existingTeamName: string | null,
  scrapedTeamName: string | null,
  teamCountry: string | null
): { shouldUpdate: boolean; finalTeamName: string | null } {
  const unknownValues = ['Unknown', 'None', 'Unk', 'unknown club', 'Sin club', 'Without Club']

  const isUnknownValue = (value: string | null): boolean => {
    if (!value) return false
    return unknownValues.some(unknown =>
      value.toLowerCase().includes(unknown.toLowerCase())
    )
  }

  if (!existingTeamName || existingTeamName.trim() === '') {
    if (scrapedTeamName && teamCountry) {
      const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
    return { shouldUpdate: true, finalTeamName: scrapedTeamName }
  }

  if (!scrapedTeamName) {
    return { shouldUpdate: false, finalTeamName: null }
  }

  if (!isUnknownValue(existingTeamName) && isUnknownValue(scrapedTeamName)) {
    return { shouldUpdate: false, finalTeamName: null }
  }

  if (isUnknownValue(existingTeamName) && !isUnknownValue(scrapedTeamName)) {
    if (teamCountry) {
      const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
    return { shouldUpdate: true, finalTeamName: scrapedTeamName }
  }

  if (teamCountry) {
    const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
    if (resolvedName !== existingTeamName) {
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
  }

  if (existingTeamName !== scrapedTeamName) {
    if (teamCountry) {
      const resolvedName = resolveTeamNameByCountry(scrapedTeamName, teamCountry)
      return { shouldUpdate: true, finalTeamName: resolvedName }
    }
    return { shouldUpdate: true, finalTeamName: scrapedTeamName }
  }

  return { shouldUpdate: false, finalTeamName: null }
}

/**
 * 🏟️ VALIDAR SI DEBE ACTUALIZARSE EL EQUIPO DE CESIÓN (LOAN FROM)
 */
export function shouldUpdateLoanTeam(
  existingLoanTeam: string | null,
  scrapedLoanTeam: string | null,
  teamCountry: string | null
): { shouldUpdate: boolean; finalLoanTeam: string | null } {
  const result = shouldUpdateTeamName(existingLoanTeam, scrapedLoanTeam, teamCountry)
  return { shouldUpdate: result.shouldUpdate, finalLoanTeam: result.finalTeamName }
}

/**
 * ⚽ LIMPIAR Y VALIDAR POSICIÓN DEL JUGADOR
 *
 * Elimina prefijos genéricos (en inglés Y español, según el idioma de la
 * página scrapeada) y evita sobrescribir posiciones específicas con
 * valores genéricos.
 */
export function shouldUpdatePosition(
  existingPosition: string | null,
  scrapedPosition: string | null
): { shouldUpdate: boolean; finalPosition: string | null } {
  if (!scrapedPosition || scrapedPosition.trim() === '') {
    return { shouldUpdate: false, finalPosition: null }
  }

  let cleanedPosition = scrapedPosition.trim()

  const prefixesToRemove = [
    // Inglés
    /^Defender\s*-\s*/i,
    /^Midfield\s*-\s*/i,
    /^Midfielder\s*-\s*/i,
    /^Attack\s*-\s*/i,
    /^Striker\s*-\s*/i,
    /^Forward\s*-\s*/i,
    /^Goalkeeper\s*-\s*/i,
    // Español (páginas de transfermarkt.es)
    /^Portero\s*-\s*/i,
    /^Defensa\s*-\s*/i,
    /^Centrocampista\s*-\s*/i,
    /^Delantero\s*-\s*/i,
    /^Mediocentro\s*-\s*/i
  ]

  for (const prefix of prefixesToRemove) {
    cleanedPosition = cleanedPosition.replace(prefix, '')
  }

  cleanedPosition = cleanedPosition.trim()

  const genericValues = [
    'Defender', 'Midfield', 'Midfielder', 'Attack', 'Striker', 'Forward', 'Goalkeeper',
    'Portero', 'Defensa', 'Centrocampista', 'Delantero'
  ]

  const isGenericValue = (value: string): boolean => {
    if (!value) return false
    const normalized = value.trim()
    return genericValues.some(generic =>
      normalized.toLowerCase() === generic.toLowerCase()
    )
  }

  if (!existingPosition || existingPosition.trim() === '') {
    return { shouldUpdate: true, finalPosition: cleanedPosition }
  }

  if (isGenericValue(cleanedPosition)) {
    return { shouldUpdate: false, finalPosition: null }
  }

  if (existingPosition !== cleanedPosition) {
    return { shouldUpdate: true, finalPosition: cleanedPosition }
  }

  return { shouldUpdate: false, finalPosition: null }
}

/**
 * 🌍 MAPEO DE CORRECCIÓN DE NACIONALIDADES
 */
const NATIONALITY_CORRECTIONS: Record<string, string> = {
  'Botsuana': 'Botswana',
  'Hongkong': 'Hong Kong',
  'Curacao': 'Curaçao',
  'Neukaledonien': 'New Caledonia',
  "Cote d'Ivoire": 'Ivory Coast',
  'Timor-Leste': 'East Timor',
  'Federated States of Micronesia': 'Micronesia',
  'St. Kitts & Nevis': 'Saint Kitts & Nevis',
  'St. Lucia': 'Saint Lucia',
  'St. Vincent and Grenadinen': 'Saint Vincent & Grenadines',
  'Southern Sudan': 'South Sudan',
  'Chinese Taipei': 'Taiwan',
  'Macao': 'Macau',
  'Turks- and Caicosinseln': 'Turks & Caicos Islands',
  'Antigua and Barbuda': 'Antigua & Barbuda',
  'Sao Tome and Principe': 'Sao Tome & Principe',
  'Trinidad and Tobago': 'Trinidad & Tobago',
  'Korea, South': 'South Korea'
}

/**
 * 🌍 CORREGIR Y NORMALIZAR NACIONALIDAD
 */
export function correctNationality(nationality: string | null): string | null {
  if (!nationality || nationality.trim() === '') {
    return null
  }

  const trimmedNationality = nationality.trim()

  if (NATIONALITY_CORRECTIONS[trimmedNationality]) {
    return NATIONALITY_CORRECTIONS[trimmedNationality]
  }

  const lowerNationality = trimmedNationality.toLowerCase()
  for (const [incorrect, correct] of Object.entries(NATIONALITY_CORRECTIONS)) {
    if (incorrect.toLowerCase() === lowerNationality) {
      return correct
    }
  }

  return trimmedNationality
}

/**
 * ⚽ MAPEO DE CORRECCIÓN DE CATEGORÍAS INTERNACIONALES (NATIONAL TIER)
 */
const NATIONAL_TIER_CORRECTIONS: Record<string, string> = {
  'Antigua and B.': 'Antigua & Barbuda',
  'Bosnia': 'Bosnia-Herzegovina',
  'Bosnia U15': 'Bosnia-Herzegovina U15',
  'Bosnia U16': 'Bosnia-Herzegovina U16',
  'Bosnia U17': 'Bosnia-Herzegovina U17',
  'Bosnia U18': 'Bosnia-Herzegovina U18',
  'Bosnia U19': 'Bosnia-Herzegovina U19',
  'Bosnia U21': 'Bosnia-Herzegovina U21',
  'Burkina U17': 'Burkina Faso U17',
  'Burkina U20': 'Burkina Faso U20',
  'C. Africa U20': 'Central African Republic U20',
  'Czechia': 'Czech Republic',
  'Czechia U15': 'Czech Republic U15',
  'Czechia U16': 'Czech Republic U16',
  'Czechia U17': 'Czech Republic U17',
  'Czechia U18': 'Czech Republic U18',
  'Czechia U19': 'Czech Republic U19',
  'Czechia U20': 'Czech Republic U20',
  'Czechia U21': 'Czech Republic U21',
  'Dom. Rep.': 'Dominican Republic',
  'Dominican Rep.': 'Dominican Republic',
  'Dominican U15': 'Dominican Republic U15',
  'Dominican U20': 'Dominican Republic U20',
  'Dominican U23': 'Dominican Republic U23',
  'DR Kongo U23': 'DR Congo U23',
  'Equat. Guinea': 'Equatorial Guinea',
  'Faroe U21': 'Faroe Islands U21',
  'Island U20': 'Iceland U20',
  'Jamaika U22': 'Jamaica U22',
  'Komoren U23': 'Comoros U23',
  'Liechtenst. U17': 'Liechtenstein U17',
  'Liechtenst. U21': 'Liechtenstein U21',
  'Macedonia U17': 'North Macedonia U17',
  'Macedonia U18': 'North Macedonia U18',
  'Macedonia U19': 'North Macedonia U19',
  'Macedonia U21': 'North Macedonia U21',
  'Mauretanien U20': 'Mauritania U20',
  'Polska U14': 'Poland U14',
  'Sambia U17': 'Zambia U17',
  'St. Kitts/Nevis': 'Saint Kitts & Nevis',
  'The Gambia': 'Gambia',
  'The Gambia U20': 'Gambia U20',
  'Timor-Leste U23': 'East Timor U23',
  'Trinidad': 'Trinidad & Tobago',
  'Trinidad U20': 'Trinidad & Tobago U20',
  'Türkiye': 'Turkey',
  'Türkiye U14': 'Turkey U14',
  'Türkiye U15': 'Turkey U15',
  'Türkiye U17': 'Turkey U17',
  'Türkiye U18': 'Turkey U18',
  'Türkiye U19': 'Turkey U19',
  'Türkiye U21': 'Turkey U21',
  'Türkiye U23': 'Turkey U23',
  'U. A. E.': 'United Arab Emirates',
  'U. A. E. U23': 'United Arab Emirates U23',
  'USA': 'United States',
  'USA U15': 'United States U15',
  'USA U16': 'United States U16',
  'USA U17': 'United States U17',
  'USA U19': 'United States U19',
  'USA U20': 'United States U20',
  'USA U23': 'United States U23',
  'Vnzla U15': 'Venezuela U15'
}

/**
 * ⚽ CORREGIR Y NORMALIZAR CATEGORÍA INTERNACIONAL (NATIONAL TIER)
 */
export function correctNationalTier(nationalTier: string | null): string | null {
  if (!nationalTier || nationalTier.trim() === '') {
    return null
  }

  const trimmedTier = nationalTier.trim()

  if (NATIONAL_TIER_CORRECTIONS[trimmedTier]) {
    return NATIONAL_TIER_CORRECTIONS[trimmedTier]
  }

  const lowerTier = trimmedTier.toLowerCase()
  for (const [incorrect, correct] of Object.entries(NATIONAL_TIER_CORRECTIONS)) {
    if (incorrect.toLowerCase() === lowerTier) {
      return correct
    }
  }

  return trimmedTier
}

/**
 * 🤝 LIMPIAR Y VALIDAR AGENCIA (AGENCY)
 */
export function shouldUpdateAgency(
  existingAgency: string | null,
  scrapedAgency: string | null
): { shouldUpdate: boolean; finalAgency: string | null } {
  const genericValues = [
    'Agent is known - Player under 18',
    'No Agent',
    'Unknown',
    'N/A',
    '-',
    // Variantes en español
    'Sin agente',
    'Se desconoce el agente - Jugador menor de 18',
    'Familiares',
    'Relatives'
  ]

  const isGenericValue = (value: string | null): boolean => {
    if (!value) return false
    const normalized = value.trim()
    return genericValues.some(generic =>
      normalized.toLowerCase() === generic.toLowerCase()
    )
  }

  if (!scrapedAgency || scrapedAgency.trim() === '') {
    return { shouldUpdate: false, finalAgency: null }
  }

  if (isGenericValue(scrapedAgency)) {
    return { shouldUpdate: false, finalAgency: null }
  }

  let cleanedAgency = scrapedAgency.trim()
  cleanedAgency = cleanedAgency.replace(/\.{2,}$/g, '').trim()

  if (!cleanedAgency || cleanedAgency === '') {
    return { shouldUpdate: false, finalAgency: null }
  }

  if (!existingAgency || existingAgency.trim() === '') {
    return { shouldUpdate: true, finalAgency: cleanedAgency }
  }

  if (existingAgency !== cleanedAgency) {
    return { shouldUpdate: true, finalAgency: cleanedAgency }
  }

  return { shouldUpdate: false, finalAgency: null }
}

/**
 * 📏 VALIDAR ALTURA DEL JUGADOR (rango razonable 140-220 cm)
 */
export function shouldUpdateHeight(
  existingHeight: number | null,
  scrapedHeight: number | null
): { shouldUpdate: boolean; finalHeight: number | null } {
  const isValidHeight = (height: number | null): boolean => {
    if (height === null || height === undefined) return false
    if (height <= 0) return false
    if (height < 140 || height > 220) return false
    return true
  }

  if (!isValidHeight(scrapedHeight)) {
    return { shouldUpdate: false, finalHeight: null }
  }

  if (!existingHeight || existingHeight === 0) {
    return { shouldUpdate: true, finalHeight: scrapedHeight }
  }

  if (existingHeight !== scrapedHeight) {
    return { shouldUpdate: true, finalHeight: scrapedHeight }
  }

  return { shouldUpdate: false, finalHeight: null }
}

/**
 * 👥 VERIFICAR IDENTIDAD ANTE POSIBLES HOMÓNIMOS (fallback por nombre)
 *
 * El fallback de ZeroZero busca por nombre, así que el primer resultado
 * puede ser otro jugador con el mismo nombre. Si el jugador ya tiene una
 * fecha de nacimiento real (no genérica 01/01) y la scrapeada no coincide,
 * los datos del fallback deben descartarse.
 *
 * Devuelve true si no hay evidencia de que sean personas distintas.
 */
export function isLikelySamePlayer(
  existingDob: Date | null,
  scrapedDob: unknown
): boolean {
  if (!existingDob || !(scrapedDob instanceof Date)) {
    return true // sin datos para comparar → no se puede descartar
  }

  // Fecha genérica 01/01: no sirve para verificar identidad
  const isExistingGeneric = existingDob.getMonth() === 0 && existingDob.getDate() === 1
  if (isExistingGeneric) {
    return true
  }

  return existingDob.getFullYear() === scrapedDob.getFullYear() &&
    existingDob.getMonth() === scrapedDob.getMonth() &&
    existingDob.getDate() === scrapedDob.getDate()
}

/**
 * 🧹 APLICAR TODAS LAS REGLAS A LOS DATOS SCRAPEADOS
 *
 * Muta una copia de scrapedData: elimina los campos que no deben
 * sobrescribirse y normaliza los que sí. Devuelve el objeto listo para
 * `prisma.jugador.update`.
 *
 * `log` recibe mensajes legibles de cada decisión (para job logs).
 */
export function applyScrapedDataRules(
  player: PlayerSnapshot,
  scrapedData: Record<string, unknown>,
  log?: (message: string) => void
): Record<string, unknown> {
  const data = { ...scrapedData }
  const say = log ?? (() => undefined)

  // 📅 Fecha de nacimiento
  if (data.date_of_birth !== undefined) {
    const scrapedDate = data.date_of_birth instanceof Date ? data.date_of_birth : null
    if (!shouldUpdateDateOfBirth(player.date_of_birth, scrapedDate)) {
      delete data.date_of_birth
      say('⚠️ Fecha genérica 01/01 ignorada - manteniendo fecha existente')
    }
  }

  // 🏟️ Nombre del equipo
  if (data.team_name !== undefined) {
    const scraped = typeof data.team_name === 'string' ? data.team_name : null
    const { shouldUpdate, finalTeamName } = shouldUpdateTeamName(
      player.team_name,
      scraped,
      player.team_country
    )
    if (!shouldUpdate) {
      delete data.team_name
      say('⚠️ Equipo "desconocido" ignorado - manteniendo equipo existente')
    } else if (finalTeamName && finalTeamName !== data.team_name) {
      data.team_name = finalTeamName
      say(`🔄 Nombre de equipo resuelto: "${finalTeamName}"`)
    }
  }

  // 🏟️ Equipo de cesión
  if (data.team_loan_from !== undefined) {
    const scraped = typeof data.team_loan_from === 'string' ? data.team_loan_from : null
    const { shouldUpdate, finalLoanTeam } = shouldUpdateLoanTeam(
      player.team_loan_from,
      scraped,
      player.team_country
    )
    if (!shouldUpdate) {
      delete data.team_loan_from
      say('⚠️ Equipo de cesión "desconocido" ignorado')
    } else if (finalLoanTeam && finalLoanTeam !== data.team_loan_from) {
      data.team_loan_from = finalLoanTeam
      say(`🔄 Equipo de cesión resuelto: "${finalLoanTeam}"`)
    }
  }

  // ⚽ Posición
  if (data.position_player !== undefined) {
    const scraped = typeof data.position_player === 'string' ? data.position_player : null
    const { shouldUpdate, finalPosition } = shouldUpdatePosition(
      player.position_player,
      scraped
    )
    if (!shouldUpdate) {
      delete data.position_player
      say('⚠️ Posición genérica o en blanco ignorada')
    } else if (finalPosition && finalPosition !== data.position_player) {
      data.position_player = finalPosition
      say(`🔄 Posición limpiada: "${finalPosition}"`)
    }
  }

  // 📏 Altura
  if (data.height !== undefined) {
    const scraped = typeof data.height === 'number' ? data.height : null
    const { shouldUpdate } = shouldUpdateHeight(player.height, scraped)
    if (!shouldUpdate) {
      say(`⚠️ Altura inválida ignorada (valor: ${String(data.height)})`)
      delete data.height
    }
  }

  // 🌍 Nacionalidades
  for (const field of ['nationality_1', 'nationality_2'] as const) {
    if (data[field] !== undefined) {
      const scraped = typeof data[field] === 'string' ? (data[field] as string) : null
      const corrected = correctNationality(scraped)
      if (!corrected) {
        delete data[field]
      } else if (corrected !== data[field]) {
        data[field] = corrected
        say(`🔄 Nacionalidad corregida: "${corrected}"`)
      }
    }
  }

  // ⚽ Categoría internacional
  if (data.national_tier !== undefined) {
    const scraped = typeof data.national_tier === 'string' ? (data.national_tier as string) : null
    const corrected = correctNationalTier(scraped)
    if (!corrected) {
      delete data.national_tier
    } else if (corrected !== data.national_tier) {
      data.national_tier = corrected
      say(`🔄 Categoría internacional corregida: "${corrected}"`)
    }
  }

  // 🤝 Agencia
  if (data.agency !== undefined) {
    const scraped = typeof data.agency === 'string' ? (data.agency as string) : null
    const { shouldUpdate, finalAgency } = shouldUpdateAgency(player.agency, scraped)
    if (!shouldUpdate) {
      delete data.agency
      // El advisor viene del mismo bloque: si la agencia es genérica, tampoco escribirlo
      if (data.advisor !== undefined) delete data.advisor
      say('⚠️ Agencia genérica o vacía ignorada')
    } else if (finalAgency && finalAgency !== data.agency) {
      data.agency = finalAgency
      if (data.advisor !== undefined) data.advisor = finalAgency
      say(`🔄 Agencia limpiada: "${finalAgency}"`)
    }
  }

  return data
}
