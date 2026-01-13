import { prisma } from '@/lib/db'

/**
 * Reference Auto-Insert Service
 *
 * Este servicio se encarga de crear automáticamente registros en las tablas de referencia
 * (Country, Equipo, Competition, Agency) cuando se inserta un valor nuevo en la tabla de jugadores
 * que no existe en la tabla de referencia correspondiente.
 */
export class ReferenceAutoInsertService {
  /**
   * Procesa los datos de un jugador y crea automáticamente registros en tablas de referencia
   * si los valores no existen.
   *
   * @param data - Datos del jugador a procesar
   * @returns Los datos del jugador con los IDs de las referencias creadas/encontradas
   */
  static async processPlayerReferences(data: {
    nationality_1?: string | null
    nationality_2?: string | null
    team_name?: string | null
    team_country?: string | null
    team_competition?: string | null
    competition_country?: string | null
    competition_confederation?: string | null
    agency?: string | null
    [key: string]: any
  }): Promise<{
    data: typeof data
    createdReferences: {
      countries: string[]
      teams: string[]
      competitions: string[]
      agencies: string[]
    }
  }> {
    const createdReferences = {
      countries: [] as string[],
      teams: [] as string[],
      competitions: [] as string[],
      agencies: [] as string[]
    }

    const updatedData = { ...data }

    // 1. Procesar nacionalidades (Country)
    if (data.nationality_1) {
      const result = await this.ensureCountryExists(data.nationality_1)
      if (result.created) {
        createdReferences.countries.push(data.nationality_1)
      }
      updatedData.nationality_id = result.id
    }

    if (data.nationality_2) {
      const result = await this.ensureCountryExists(data.nationality_2)
      if (result.created) {
        createdReferences.countries.push(data.nationality_2)
      }
    }

    // 2. Procesar equipo (Equipo)
    if (data.team_name) {
      const result = await this.ensureTeamExists(data.team_name, data.team_country)
      if (result.created) {
        createdReferences.teams.push(data.team_name)
      }
      updatedData.team_id = result.id
    }

    // 3. Procesar competición (Competition)
    if (data.team_competition) {
      const result = await this.ensureCompetitionExists(
        data.team_competition,
        data.competition_country,
        data.competition_confederation
      )
      if (result.created) {
        createdReferences.competitions.push(data.team_competition)
      }
    }

    // 4. Procesar agencia (Agency)
    if (data.agency) {
      const result = await this.ensureAgencyExists(data.agency)
      if (result.created) {
        createdReferences.agencies.push(data.agency)
      }
      updatedData.agency_id = result.id
    }

    return { data: updatedData, createdReferences }
  }

  /**
   * Asegura que un país/nacionalidad existe en la tabla Country.
   * Si no existe, lo crea automáticamente.
   */
  static async ensureCountryExists(
    name: string
  ): Promise<{ id: string; created: boolean }> {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return { id: '', created: false }
    }

    try {
      // Buscar país existente por nombre
      const existing = await prisma.country.findUnique({
        where: { name: trimmedName },
        select: { id: true }
      })

      if (existing) {
        return { id: existing.id, created: false }
      }

      // Generar código de país (primeras 2 letras en mayúsculas)
      // Si ya existe el código, añadir número
      const baseCode = trimmedName.slice(0, 2).toUpperCase()
      let code = baseCode
      let attempt = 0

      while (attempt < 100) {
        const codeExists = await prisma.country.findUnique({
          where: { code },
          select: { id: true }
        })

        if (!codeExists) break

        attempt++
        code = `${baseCode}${attempt}`
      }

      // Crear nuevo país
      const newCountry = await prisma.country.create({
        data: {
          name: trimmedName,
          code: code,
          confederation: this.inferConfederation(trimmedName)
        },
        select: { id: true }
      })

      console.log(`📍 Auto-created country: ${trimmedName} (${code})`)
      return { id: newCountry.id, created: true }
    } catch (error) {
      console.error(`Error ensuring country exists: ${trimmedName}`, error)
      return { id: '', created: false }
    }
  }

  /**
   * Asegura que un equipo existe en la tabla Equipo.
   * Si no existe, lo crea automáticamente.
   */
  static async ensureTeamExists(
    teamName: string,
    teamCountry?: string | null
  ): Promise<{ id: string; created: boolean }> {
    const trimmedName = teamName.trim()
    if (!trimmedName) {
      return { id: '', created: false }
    }

    try {
      // Buscar equipo existente por nombre exacto
      const existing = await prisma.equipo.findFirst({
        where: { team_name: trimmedName },
        select: { id_team: true }
      })

      if (existing) {
        return { id: existing.id_team, created: false }
      }

      // Crear nuevo equipo
      const newTeam = await prisma.equipo.create({
        data: {
          team_name: trimmedName,
          team_country: teamCountry?.trim() || null
        },
        select: { id_team: true }
      })

      console.log(`🏟️ Auto-created team: ${trimmedName}`)
      return { id: newTeam.id_team, created: true }
    } catch (error) {
      console.error(`Error ensuring team exists: ${trimmedName}`, error)
      return { id: '', created: false }
    }
  }

  /**
   * Asegura que una competición existe en la tabla Competition.
   * Si no existe, la crea automáticamente.
   */
  static async ensureCompetitionExists(
    competitionName: string,
    country?: string | null,
    confederation?: string | null
  ): Promise<{ id: string; created: boolean }> {
    const trimmedName = competitionName.trim()
    if (!trimmedName) {
      return { id: '', created: false }
    }

    try {
      // Buscar competición existente por nombre
      const existing = await prisma.competition.findFirst({
        where: { competition_name: trimmedName },
        select: { id_competition: true }
      })

      if (existing) {
        return { id: existing.id_competition, created: false }
      }

      // Crear nueva competición
      const newCompetition = await prisma.competition.create({
        data: {
          competition_name: trimmedName,
          competition_country: country?.trim() || null,
          competition_confederation: confederation?.trim() || this.inferConfederationFromCountry(country)
        },
        select: { id_competition: true }
      })

      console.log(`🏆 Auto-created competition: ${trimmedName}`)
      return { id: newCompetition.id_competition, created: true }
    } catch (error) {
      console.error(`Error ensuring competition exists: ${trimmedName}`, error)
      return { id: '', created: false }
    }
  }

  /**
   * Asegura que una agencia existe en la tabla Agency.
   * Si no existe, la crea automáticamente.
   */
  static async ensureAgencyExists(
    agencyName: string
  ): Promise<{ id: string; created: boolean }> {
    const trimmedName = agencyName.trim()
    if (!trimmedName) {
      return { id: '', created: false }
    }

    try {
      // Buscar agencia existente por nombre
      const existing = await prisma.agency.findUnique({
        where: { name: trimmedName },
        select: { id: true }
      })

      if (existing) {
        return { id: existing.id, created: false }
      }

      // Crear nueva agencia
      const newAgency = await prisma.agency.create({
        data: {
          name: trimmedName
        },
        select: { id: true }
      })

      console.log(`🏢 Auto-created agency: ${trimmedName}`)
      return { id: newAgency.id, created: true }
    } catch (error) {
      console.error(`Error ensuring agency exists: ${trimmedName}`, error)
      return { id: '', created: false }
    }
  }

  /**
   * Infiere la confederación basada en el nombre del país
   */
  private static inferConfederation(countryName: string): string | null {
    const name = countryName.toLowerCase()

    // UEFA (Europa)
    const uefaCountries = [
      'spain', 'españa', 'germany', 'alemania', 'france', 'francia', 'italy', 'italia',
      'england', 'inglaterra', 'portugal', 'netherlands', 'holanda', 'belgium', 'bélgica',
      'turkey', 'turquía', 'ukraine', 'ucrania', 'poland', 'polonia', 'russia', 'rusia',
      'austria', 'switzerland', 'suiza', 'czech republic', 'república checa', 'greece', 'grecia',
      'scotland', 'escocia', 'croatia', 'croacia', 'denmark', 'dinamarca', 'sweden', 'suecia',
      'norway', 'noruega', 'finland', 'finlandia', 'serbia', 'romania', 'rumania', 'hungary', 'hungría',
      'slovakia', 'eslovaquia', 'slovenia', 'eslovenia', 'bosnia', 'albania', 'north macedonia',
      'montenegro', 'kosovo', 'wales', 'gales', 'ireland', 'irlanda', 'northern ireland',
      'iceland', 'islandia', 'luxembourg', 'luxemburgo', 'cyprus', 'chipre', 'israel', 'georgia',
      'armenia', 'azerbaijan', 'azerbaiyán', 'kazakhstan', 'kazajistán', 'belarus', 'bielorrusia',
      'malta', 'estonia', 'latvia', 'letonia', 'lithuania', 'lituania', 'moldova', 'moldavia',
      'faroe islands', 'islas feroe', 'gibraltar', 'andorra', 'san marino', 'liechtenstein', 'monaco', 'mónaco'
    ]

    // CONMEBOL (Sudamérica)
    const conmebolCountries = [
      'brazil', 'brasil', 'argentina', 'uruguay', 'colombia', 'chile', 'paraguay', 'peru', 'perú',
      'ecuador', 'bolivia', 'venezuela'
    ]

    // CONCACAF (Norte/Centro América y Caribe)
    const concacafCountries = [
      'mexico', 'méxico', 'usa', 'united states', 'estados unidos', 'canada', 'canadá',
      'costa rica', 'panama', 'panamá', 'honduras', 'jamaica', 'el salvador', 'guatemala',
      'haiti', 'haití', 'trinidad and tobago', 'trinidad y tobago', 'nicaragua', 'cuba',
      'dominican republic', 'república dominicana', 'curacao', 'curaçao', 'martinique', 'martinica',
      'guadeloupe', 'guadalupe', 'suriname', 'surinam', 'belize', 'belice'
    ]

    // AFC (Asia)
    const afcCountries = [
      'japan', 'japón', 'south korea', 'corea del sur', 'korea', 'corea', 'china', 'australia',
      'saudi arabia', 'arabia saudita', 'iran', 'irán', 'qatar', 'uae', 'united arab emirates',
      'emiratos árabes unidos', 'iraq', 'irak', 'uzbekistan', 'uzbekistán', 'vietnam',
      'thailand', 'tailandia', 'indonesia', 'malaysia', 'malasia', 'india', 'pakistan', 'pakistán',
      'philippines', 'filipinas', 'singapore', 'singapur', 'bahrain', 'baréin', 'oman', 'omán',
      'kuwait', 'jordan', 'jordania', 'syria', 'siria', 'lebanon', 'líbano', 'palestine', 'palestina',
      'tajikistan', 'tayikistán', 'turkmenistan', 'turkmenistán', 'kyrgyzstan', 'kirguistán',
      'hong kong', 'taiwan', 'taiwán', 'myanmar', 'cambodia', 'camboya', 'nepal', 'bangladesh',
      'sri lanka', 'maldives', 'maldivas'
    ]

    // CAF (África)
    const cafCountries = [
      'morocco', 'marruecos', 'egypt', 'egipto', 'senegal', 'nigeria', 'algeria', 'argelia',
      'tunisia', 'túnez', 'cameroon', 'camerún', 'ghana', 'ivory coast', "côte d'ivoire",
      'costa de marfil', 'south africa', 'sudáfrica', 'mali', 'malí', 'burkina faso',
      'dr congo', 'congo', 'democratic republic of congo', 'rep. del congo', 'uganda',
      'zambia', 'tanzania', 'kenya', 'kenia', 'ethiopia', 'etiopía', 'angola', 'mozambique',
      'zimbabwe', 'namibia', 'botswana', 'gabon', 'gabón', 'equatorial guinea', 'guinea ecuatorial',
      'guinea', 'benin', 'benín', 'togo', 'niger', 'níger', 'mauritania', 'cape verde', 'cabo verde',
      'gambia', 'sierra leone', 'sierra leona', 'liberia', 'guinea-bissau', 'rwanda', 'ruanda',
      'burundi', 'malawi', 'sudan', 'sudán', 'south sudan', 'sudán del sur', 'somalia', 'eritrea',
      'djibouti', 'yibuti', 'comoros', 'comoras', 'mauritius', 'mauricio', 'madagascar', 'libya', 'libia',
      'central african republic', 'república centroafricana', 'chad', 'lesotho', 'eswatini', 'suazilandia'
    ]

    // OFC (Oceanía)
    const ofcCountries = [
      'new zealand', 'nueva zelanda', 'fiji', 'papua new guinea', 'papúa nueva guinea',
      'solomon islands', 'islas salomón', 'vanuatu', 'new caledonia', 'nueva caledonia',
      'tahiti', 'samoa', 'tonga', 'american samoa', 'samoa americana', 'cook islands', 'islas cook'
    ]

    if (uefaCountries.some(c => name.includes(c))) return 'UEFA'
    if (conmebolCountries.some(c => name.includes(c))) return 'CONMEBOL'
    if (concacafCountries.some(c => name.includes(c))) return 'CONCACAF'
    if (afcCountries.some(c => name.includes(c))) return 'AFC'
    if (cafCountries.some(c => name.includes(c))) return 'CAF'
    if (ofcCountries.some(c => name.includes(c))) return 'OFC'

    return null
  }

  /**
   * Infiere la confederación basada en el país de la competición
   */
  private static inferConfederationFromCountry(country?: string | null): string | null {
    if (!country) return null
    return this.inferConfederation(country)
  }
}
