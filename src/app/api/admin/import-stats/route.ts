/**
 * 📥 ENDPOINT DE IMPORTACIÓN DE ESTADÍSTICAS DESDE XLS CON LIVE STREAMING
 *
 * ✅ PROPÓSITO: Importar estadísticas de jugadores desde archivo Excel/XLS
 * ✅ BENEFICIO: Permite al admin cargar estadísticas masivamente con logs en vivo
 * ✅ RUTA: POST /api/admin/import-stats
 * ✅ OPTIMIZACIÓN: Soporta importación masiva de hasta 3000+ jugadores con SSE streaming
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

import { prisma } from '@/lib/db'

// ⏱️ Configuración del route: timeout extendido para importaciones masivas
export const maxDuration = 300 // 5 minutos (máximo en Vercel Hobby plan)
export const dynamic = 'force-dynamic'

interface PlayerImportRow {
  // Index signature for dynamic column access
  [key: string]: string | number | boolean | Date | undefined | null

  // Campos de identificación y nombres
  old_id?: string | number
  id_player?: string
  player_name?: string
  'wyscout_id 1'?: string | number
  'wyscout_name 1'?: string
  'wyscout_id 2'?: string | number
  'wyscout_name 2'?: string
  id_fmi?: string

  // URLs y referencias
  player_rating?: number
  photo_coverage?: string
  url_trfm_advisor?: string
  url_trfm?: string
  url_secondary?: string
  url_instagram?: string
  video?: string

  // Información personal
  date_of_birth?: string | Date
  correct_date_of_birth?: string | Date
  age?: number
  age_value?: number
  'age_value_%'?: number
  age_coeff?: number
  complete_player_name?: string

  // Posición
  position_player?: string
  correct_position_player?: string
  position_value?: number
  'position_value_%'?: number

  // Características físicas
  foot?: string
  correct_foot?: string
  height?: number
  correct_height?: number

  // Nacionalidad
  nationality_1?: string
  correct_nationality_1?: string
  nationality_value?: number
  'nationality_value_%'?: number
  nationality_2?: string
  correct_nationality_2?: string
  national_tier?: string
  rename_national_tier?: string
  correct_national_tier?: string

  // Equipo
  pre_team?: string
  team_name?: string
  correct_team_name?: string
  team_country?: string
  team_elo?: number
  team_level?: string
  team_level_value?: number
  'team_level_value_%'?: number

  // Competición
  team_competition?: string
  competition_country?: string
  team_competition_value?: number
  'team_competition_value_%'?: number
  competition_tier?: string
  competition_confederation?: string
  competition_elo?: number
  competition_level?: string
  competition_level_value?: number
  'competition_level_value_%'?: number

  // Club propietario y préstamo
  owner_club?: string
  owner_club_country?: string
  owner_club_value?: number
  'owner_club_value_%'?: number
  pre_team_loan_from?: string
  team_loan_from?: string
  correct_team_loan_from?: string
  on_loan?: boolean | string

  // Agencia y contrato
  agency?: string
  correct_agency?: string
  contract_end?: string | Date
  correct_contract_end?: string | Date

  // Valor de mercado y estadísticas
  player_trfm_value?: number
  player_trfm_value_norm?: number
  stats_evo_3m?: number
  player_rating_norm?: number
  total_fmi_pts_norm?: number
  player_elo?: number
  player_level?: string
  player_ranking?: number
  community_potential?: number
  existing_club?: string

  // Estadísticas (campos legacy de stats)
  Player?: string
  'Matches played'?: number
  'Minutes played'?: number
  'Defensive duels per 90'?: number
  'Defensive duels won, %'?: number
  'Aerial duels per 90'?: number
  'Aerial duels won, %'?: number
  'Sliding tackles per 90'?: number
  'Interceptions per 90'?: number
  'Fouls per 90'?: number
  'Yellow cards per 90'?: number
  'Red cards per 90'?: number
  'Goals per 90'?: number
  'Shots per 90'?: number
  'Assists per 90'?: number
  'Crosses per 90'?: number
  'Offensive duels per 90'?: number
  'Offensive duels won, %'?: number
  'Passes per 90'?: number
  'Accurate passes, %'?: number
  'Forward passes per 90'?: number
  'Conceded goals per 90'?: number
  'Shots against per 90'?: number
  'Clean sheets'?: number
  'Save rate, %'?: number
  'Prevented goals per 90'?: number
  id?: string | number // Wyscout ID (campo legacy)
}

/**
 * Helper: Convertir valor a fecha si es válido
 */
function parseDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null
  if (value instanceof Date) return value

  try {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Helper: Convertir valor a booleano
 */
function parseBoolean(value: boolean | string | undefined | null): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'sí') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
  }
  return null
}

// Wide type from row index access
type RowValue = string | number | boolean | Date | undefined | null

/**
 * Helper: Convertir valor a número o null
 */
function parseNumber(value: RowValue): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (value instanceof Date) return value.getTime()
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? null : num
}

/**
 * Helper: Convertir valor a string o null
 */
function parseString(value: RowValue): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return value.toISOString()
  return String(value).trim()
}

/**
 * Helper: Enviar evento SSE
 */
function sendSSE(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
  const message = `data: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
}

/**
 * POST /api/admin/import-stats - Importar estadísticas desde XLS con streaming
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'No autorizado. Debes iniciar sesión.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado. Solo los administradores pueden importar datos.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 📝 OBTENER ARCHIVO Y PARÁMETROS DEL BODY
    const formData = await request.formData()
    const file = formData.get('file') as File
    const maxRowsParam = formData.get('maxRows') as string | null
    const maxRows = maxRowsParam ? parseInt(maxRowsParam) : null

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionó ningún archivo.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar que sea un archivo Excel
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ error: 'El archivo debe ser un Excel (.xlsx, .xls) o CSV.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 📖 LEER ARCHIVO EXCEL
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return new Response(
        JSON.stringify({ error: 'El archivo no contiene ninguna hoja de cálculo.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    const worksheet = workbook.Sheets[sheetName]

    // 🔍 DETECTAR SI LA PRIMERA FILA SON ENCABEZADOS
    // Leer todas las filas como arrays para inspeccionar
    if (!worksheet) {
      return new Response(
        JSON.stringify({ error: 'No se pudo leer la hoja de cálculo.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    type CellValue = string | number | boolean | null
    const allRows = XLSX.utils.sheet_to_json<CellValue[]>(worksheet, { header: 1, defval: null })

    if (!allRows || allRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'El archivo está vacío.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const firstRow = allRows[0] ?? []
    const secondRow = allRows[1] ?? []

    // 🔍 Función para verificar si una fila contiene encabezados
    const isHeaderRow = (row: CellValue[]) => {
      return row.some((cell) => {
        const cellStr = String(cell ?? '').toLowerCase().trim()
        return cellStr === 'player_name' ||
               cellStr === 'old_id' ||
               cellStr === 'id_player' ||
               cellStr === 'wyscout_id 1' ||
               cellStr.includes('wyscout') ||
               (cellStr.includes('player') && cellStr.includes('name'))
      })
    }

    // 🔍 Verificar si la primera fila está vacía (todas las celdas son null/undefined/vacías)
    const firstRowIsEmpty = firstRow.every((cell) => !cell || String(cell).trim() === '')

    let headerRow: CellValue[]
    let dataStartIndex: number
    let hasHeaders = false

    if (firstRowIsEmpty && isHeaderRow(secondRow)) {
      // ✅ Caso 1: Primera fila vacía, encabezados en segunda fila
      headerRow = secondRow
      dataStartIndex = 2 // Los datos empiezan en la fila 3
      hasHeaders = true
    } else if (isHeaderRow(firstRow)) {
      // ✅ Caso 2: Encabezados en primera fila
      headerRow = firstRow
      dataStartIndex = 1 // Los datos empiezan en la fila 2
      hasHeaders = true
    } else {
      // ❌ Caso 3: No hay encabezados reconocibles
      headerRow = []
      dataStartIndex = 0
      hasHeaders = false
    }

    let data: PlayerImportRow[]

    if (hasHeaders) {
      // ✅ TIENE ENCABEZADOS: Usar la fila de encabezados detectada
      const headers = headerRow.map((cell) => String(cell ?? '').trim())

      // Convertir las filas restantes a objetos usando los encabezados
      data = allRows.slice(dataStartIndex).map((row) => {
        const obj: PlayerImportRow = {}
        headers.forEach((header, index) => {
          if (header && row) {
            obj[header] = row[index]
          }
        })
        return obj
      })
    } else {
      // ❌ NO TIENE ENCABEZADOS: Usar las columnas generadas por XLSX
      data = XLSX.utils.sheet_to_json<PlayerImportRow>(worksheet, {
        raw: false,
        defval: null
      })
    }

    // 🎯 APLICAR LÍMITE DE FILAS SI SE ESPECIFICÓ
    const totalRowsInFile = data.length
    if (maxRows && maxRows > 0 && maxRows < data.length) {
      data = data.slice(0, maxRows)
    }

    // 🌊 CREAR STREAM PARA SSE
    const stream = new ReadableStream({
      async start(controller) {
        const results = {
          success: 0,
          failed: 0,
          created: 0,
          updated: 0,
          errors: [] as string[],
          createdPlayers: [] as string[]
        }

        try {
          // Enviar inicio
          const startMessage = maxRows && maxRows < totalRowsInFile
            ? `📥 Iniciando importación de ${data.length} jugadores (límite aplicado: ${maxRows} de ${totalRowsInFile} filas totales)...`
            : `📥 Iniciando importación de ${data.length} jugadores...`

          sendSSE(controller, {
            type: 'start',
            total: data.length,
            message: startMessage
          })

          // 🚀 OPTIMIZACIÓN: Pre-cargar todos los jugadores existentes en memoria
          sendSSE(controller, {
            type: 'info',
            message: '🔍 Cargando jugadores existentes en la base de datos...'
          })

          const allWyscoutIds = data
            .map(row => parseString(row['wyscout_id 1'] || row.id))
            .filter(Boolean) as string[]

          // También cargar jugadores por nombre para matching sin Wyscout ID
          const allPlayerNames = data
            .map(row => parseString(row.player_name || row.Player || row['wyscout_name 1']))
            .filter(Boolean) as string[]

          const existingPlayers = await prisma.jugador.findMany({
            where: {
              OR: [
                ...(allWyscoutIds.length > 0 ? [
                  { wyscout_id_1: { in: allWyscoutIds } },
                  { wyscout_id_2: { in: allWyscoutIds } }
                ] : []),
                ...(allPlayerNames.length > 0 ? [
                  { player_name: { in: allPlayerNames } }
                ] : [])
              ]
            },
            select: {
              id_player: true,
              wyscout_id_1: true,
              wyscout_id_2: true,
              player_name: true
            }
          })

          // Crear mapa de búsqueda rápida: wyscoutId -> player y playerName -> player
          const playerMap = new Map<string, typeof existingPlayers[0]>()
          const playerNameMap = new Map<string, typeof existingPlayers[0]>()
          existingPlayers.forEach(player => {
            if (player.wyscout_id_1) playerMap.set(player.wyscout_id_1, player)
            if (player.wyscout_id_2) playerMap.set(player.wyscout_id_2, player)
            if (player.player_name) playerNameMap.set(player.player_name, player)
          })

          sendSSE(controller, {
            type: 'info',
            message: `✅ ${existingPlayers.length} jugadores existentes cargados en memoria`
          })

          // 📦 PROCESAMIENTO POR LOTES (Batch processing)
          const BATCH_SIZE = 100 // Procesar de 100 en 100
          const batches = []
          for (let i = 0; i < data.length; i += BATCH_SIZE) {
            batches.push(data.slice(i, i + BATCH_SIZE))
          }

          sendSSE(controller, {
            type: 'info',
            message: `📦 Procesando ${data.length} jugadores en ${batches.length} lotes de hasta ${BATCH_SIZE}`
          })

          // 🔍 DEBUG: Mostrar columnas del Excel para diagnóstico
          const firstDataRow = data[0]
          if (data.length > 0 && firstDataRow) {
            const columns = Object.keys(firstDataRow)

            sendSSE(controller, {
              type: 'debug',
              message: `🔍 Encabezados detectados: ${hasHeaders ? 'SÍ' : 'NO'}`
            })

            sendSSE(controller, {
              type: 'debug',
              message: `🔍 Columnas detectadas en el Excel (${columns.length}): ${columns.slice(0, 20).join(', ')}${columns.length > 20 ? '...' : ''}`
            })

            // Mostrar TODAS las columnas para diagnóstico completo
            sendSSE(controller, {
              type: 'debug',
              message: `📋 TODAS las columnas: ${columns.join(', ')}`
            })

            // DEBUG: Verificar campos problemáticos específicos
            const problematicFields = [
              'id_fmi', 'url_trfm', 'url_instagram', 'correct_date_of_birth',
              'age_value', 'age_value_%', 'age_coeff', 'pre_team',
              'correct_team_name', 'team_country', 'team_elo', 'team_level'
            ]

            const foundFields: string[] = []
            const missingFields: string[] = []

            problematicFields.forEach(field => {
              // Buscar coincidencia exacta o aproximada
              const exactMatch = columns.find(col => col === field)
              const caseInsensitiveMatch = columns.find(col => col.toLowerCase() === field.toLowerCase())
              const similarMatch = columns.find(col =>
                col.toLowerCase().replace(/[_\s]/g, '') === field.toLowerCase().replace(/[_\s]/g, '')
              )

              if (exactMatch || caseInsensitiveMatch || similarMatch) {
                foundFields.push(`${field} → "${exactMatch || caseInsensitiveMatch || similarMatch}"`)
              } else {
                missingFields.push(field)
              }
            })

            if (foundFields.length > 0) {
              sendSSE(controller, {
                type: 'debug',
                message: `✅ Campos encontrados (${foundFields.length}): ${foundFields.join(', ')}`
              })
            }

            if (missingFields.length > 0) {
              sendSSE(controller, {
                type: 'warning',
                message: `⚠️ Campos NO encontrados en Excel (${missingFields.length}): ${missingFields.join(', ')}`
              })
            }

            // Mostrar valores de estos campos en la primera fila
            const fieldValues = problematicFields.map(field => {
              const value = firstDataRow[field as keyof typeof firstDataRow]
              return `${field}: "${value || 'N/A'}"`
            }).join(' | ')

            sendSSE(controller, {
              type: 'debug',
              message: `🔍 Valores de campos problemáticos en fila 1: ${fieldValues}`
            })
          }

          // 🔄 PROCESAR CADA LOTE
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex]
            if (!batch) continue
            const batchNum = batchIndex + 1

            sendSSE(controller, {
              type: 'batch_start',
              batchNum,
              totalBatches: batches.length,
              message: `🔄 Procesando lote ${batchNum}/${batches.length}...`
            })

            // Procesar cada jugador del lote
            for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
              const row = batch[rowIndex]
              if (!row) continue
              // 🔍 DETERMINAR ID DE WYSCOUT (soportar múltiples formatos de columna)
              const wyscoutId = parseString(
                row['wyscout_id 1'] || row.id
              )

              // 🎯 BUSCAR NOMBRE DE JUGADOR en múltiples columnas posibles
              const playerName = parseString(
                row.player_name ||
                row.Player ||
                row['wyscout_name 1'] ||
                row.complete_player_name ||
                row['Player Name'] ||
                row['Nombre'] ||
                row['PLAYER'] ||
                row['Name'] ||
                // Columnas sin encabezado (__EMPTY)
                row['__EMPTY_1'] ||
                row['__EMPTY_2'] ||
                row['__EMPTY']
              )

              // Validar que al menos tengamos un nombre de jugador
              if (!playerName) {
                results.failed++
                const fileRowNum = (batchIndex * BATCH_SIZE) + rowIndex + 1
                results.errors.push(`Fila ${fileRowNum} sin nombre de jugador`)
                sendSSE(controller, {
                  type: 'error',
                  message: `⚠️ Fila ${fileRowNum} sin nombre de jugador`
                })
                continue
              }

              try {
                // 🔍 BUSCAR JUGADOR EN LOS MAPAS (O(1) lookup instead of database query!)
                // Primero buscar por Wyscout ID si existe, sino por nombre
                let existingPlayer = wyscoutId ? playerMap.get(wyscoutId) : null
                if (!existingPlayer) {
                  existingPlayer = playerNameMap.get(playerName) || null
                }

          // 📦 PREPARAR DATOS DEL JUGADOR
          const playerData = {
            // Identificación y nombres
            player_name: playerName,
            complete_player_name: parseString(row.complete_player_name),
            wyscout_id_1: wyscoutId || null,
            wyscout_name_1: parseString(row['wyscout_name 1']) || null,
            wyscout_id_2: parseString(row['wyscout_id 2']),
            wyscout_name_2: parseString(row['wyscout_name 2']),
            id_fmi: parseString(row.id_fmi || row['ID_FMI'] || row['ID FMI'] || row['id FMI'] || row['Id FMI']),

            // URLs y referencias
            player_rating: parseNumber(row.player_rating),
            photo_coverage: parseString(row.photo_coverage),
            url_trfm_advisor: parseString(row.url_trfm_advisor),
            url_trfm: parseString(row.url_trfm),
            url_secondary: parseString(row.url_secondary),
            url_instagram: parseString(row.url_instagram),
            video: parseString(row.video),

            // Información personal
            date_of_birth: parseDate(row.date_of_birth),
            correct_date_of_birth: parseDate(row.correct_date_of_birth),
            age: parseNumber(row.age) ? Math.round(parseNumber(row.age)!) : null,
            age_value: parseNumber(row.age_value),
            age_value_percent: parseNumber(row['age_value_%']),
            age_coeff: parseNumber(row.age_coeff),

            // Posición
            position_player: parseString(row.position_player),
            correct_position_player: parseString(row.correct_position_player),
            position_value: parseNumber(row.position_value),
            position_value_percent: parseNumber(row['position_value_%']),

            // Características físicas
            foot: parseString(row.foot),
            correct_foot: parseString(row.correct_foot),
            height: parseNumber(row.height),
            correct_height: parseNumber(row.correct_height),

            // Nacionalidad
            nationality_1: parseString(row.nationality_1),
            correct_nationality_1: parseString(row.correct_nationality_1),
            nationality_value: parseNumber(row.nationality_value),
            nationality_value_percent: parseNumber(row['nationality_value_%']),
            nationality_2: parseString(row.nationality_2),
            correct_nationality_2: parseString(row.correct_nationality_2),
            national_tier: parseString(row.national_tier),
            rename_national_tier: parseString(row.rename_national_tier),
            correct_national_tier: parseString(row.correct_national_tier),

            // Equipo
            pre_team: parseString(row.pre_team),
            team_name: parseString(row.team_name),
            correct_team_name: parseString(row.correct_team_name),
            team_country: parseString(row.team_country),
            team_elo: parseNumber(row.team_elo),
            team_level: parseString(row.team_level),
            team_level_value: parseNumber(row.team_level_value),
            team_level_value_percent: parseNumber(row['team_level_value_%']),

            // Competición
            team_competition: parseString(row.team_competition),
            competition_country: parseString(row.competition_country),
            team_competition_value: parseNumber(row.team_competition_value),
            team_competition_value_percent: parseNumber(row['team_competition_value_%']),
            competition_tier: parseString(row.competition_tier),
            competition_confederation: parseString(row.competition_confederation),
            competition_elo: parseNumber(row.competition_elo),
            competition_level: parseString(row.competition_level),
            competition_level_value: parseNumber(row.competition_level_value),
            competition_level_value_percent: parseNumber(row['competition_level_value_%']),

            // Club propietario y préstamo
            owner_club: parseString(row.owner_club),
            owner_club_country: parseString(row.owner_club_country),
            owner_club_value: parseNumber(row.owner_club_value),
            owner_club_value_percent: parseNumber(row['owner_club_value_%']),
            pre_team_loan_from: parseString(row.pre_team_loan_from),
            team_loan_from: parseString(row.team_loan_from),
            correct_team_loan_from: parseString(row.correct_team_loan_from),
            on_loan: parseBoolean(row.on_loan),

            // Agencia y contrato
            agency: parseString(row.agency),
            correct_agency: parseString(row.correct_agency),
            contract_end: parseDate(row.contract_end),
            correct_contract_end: parseDate(row.correct_contract_end),

            // Valor de mercado y estadísticas
            player_trfm_value: parseNumber(row.player_trfm_value),
            player_trfm_value_norm: parseNumber(row.player_trfm_value_norm),
            stats_evo_3m: parseNumber(row.stats_evo_3m),
            player_rating_norm: parseNumber(row.player_rating_norm),
            total_fmi_pts_norm: parseNumber(row.total_fmi_pts_norm),
            player_elo: parseNumber(row.player_elo),
            player_level: parseString(row.player_level),
            player_ranking: parseNumber(row.player_ranking) ? Math.round(parseNumber(row.player_ranking)!) : null,
            community_potential: parseNumber(row.community_potential),
            existing_club: parseString(row.existing_club),
          }

                let player: { id_player: number } | null = null

                // 🆕 SI NO EXISTE, CREAR JUGADOR AUTOMÁTICAMENTE
                if (!existingPlayer) {
                  try {
                    player = await prisma.jugador.create({
                      data: playerData,
                      select: { id_player: true }
                    })
                    // Añadir a los mapas para futuras referencias
                    if (player) {
                      const newPlayerData = {
                        id_player: player.id_player,
                        wyscout_id_1: wyscoutId,
                        wyscout_id_2: null as string | null,
                        player_name: playerName
                      }
                      if (wyscoutId) {
                        playerMap.set(wyscoutId, newPlayerData)
                      }
                      playerNameMap.set(playerName, newPlayerData)
                    }

                    results.created++
                    if (results.createdPlayers.length < 50) { // Limitar a 50 para evitar memoria
                      results.createdPlayers.push(wyscoutId
                        ? `${playerName} (Wyscout ID: ${wyscoutId})`
                        : `${playerName} (sin Wyscout ID)`)
                    }

                    sendSSE(controller, {
                      type: 'player_created',
                      playerName,
                      message: `🆕 Jugador creado: ${playerName}${wyscoutId ? ` (ID: ${wyscoutId})` : ''}`
                    })
                  } catch (createError) {
                    results.failed++
                    const errorMsg = createError instanceof Error ? createError.message : 'Unknown error'
                    results.errors.push(
                      `Error creando jugador ${playerName}${wyscoutId ? ` (Wyscout ID ${wyscoutId})` : ''}: ${errorMsg}`
                    )
                    sendSSE(controller, {
                      type: 'error',
                      message: `❌ Error creando ${playerName}: ${errorMsg}`
                    })
                    continue
                  }
                } else {
                  // 🔄 SI YA EXISTE, ACTUALIZAR CAMPOS DEL JUGADOR
                  try {
                    await prisma.jugador.update({
                      where: { id_player: existingPlayer.id_player },
                      data: playerData
                    })
                    player = { id_player: existingPlayer.id_player }
                    results.updated++

                    sendSSE(controller, {
                      type: 'player_updated',
                      playerName: playerName || existingPlayer.player_name,
                      message: `🔄 Jugador actualizado: ${playerName || existingPlayer.player_name}`
                    })
                  } catch (updateError) {
                    player = { id_player: existingPlayer.id_player }
                    sendSSE(controller, {
                      type: 'warning',
                      message: `⚠️ Advertencia actualizando ${playerName || existingPlayer.player_name}`
                    })
                    // No marcamos como error, continuamos con las estadísticas
                  }
                }

                // Si no tenemos un jugador válido, saltar
                if (!player) continue

                // 🔄 ACTUALIZAR/CREAR ESTADÍSTICAS (solo si hay campos de stats en el XLS)
                if (row['Matches played'] || row['Goals per 90'] || row['Passes per 90']) {
                  try {
                    // Helper to convert to integer
                    const toInt = (val: unknown): number => Math.round(parseNumber(val as number | string | undefined | null) || 0)

                    await prisma.playerStats3m.upsert({
                      where: {
                        id_player: player.id_player
                      },
                      update: {
                        // Partidos y minutos
                        matches_played_tot_3m: toInt(row['Matches played']),
                        minutes_played_tot_3m: toInt(row['Minutes played']),

                        // Duelos defensivos
                        def_duels_p90_3m: parseNumber(row['Defensive duels per 90'] as number | undefined),
                        def_duels_won_percent_3m: parseNumber(row['Defensive duels won, %'] as number | undefined),

                        // Duelos aéreos
                        aerials_duels_p90_3m: parseNumber(row['Aerial duels per 90'] as number | undefined),
                        aerials_duels_won_percent_3m: parseNumber(row['Aerial duels won, %'] as number | undefined),

                        // Tackles e intercepciones
                        tackles_p90_3m: parseNumber(row['Sliding tackles per 90'] as number | undefined),
                        interceptions_p90_3m: parseNumber(row['Interceptions per 90'] as number | undefined),

                        // Faltas y tarjetas
                        fouls_p90_3m: parseNumber(row['Fouls per 90'] as number | undefined),
                        yellow_cards_p90_3m: parseNumber(row['Yellow cards per 90'] as number | undefined),
                        red_cards_p90_3m: parseNumber(row['Red cards per 90'] as number | undefined),

                        // Goles y tiros
                        goals_p90_3m: parseNumber(row['Goals per 90'] as number | undefined),
                        shots_p90_3m: parseNumber(row['Shots per 90'] as number | undefined),

                        // Asistencias y centros
                        assists_p90_3m: parseNumber(row['Assists per 90'] as number | undefined),
                        crosses_p90_3m: parseNumber(row['Crosses per 90'] as number | undefined),

                        // Duelos ofensivos
                        off_duels_p90_3m: parseNumber(row['Offensive duels per 90'] as number | undefined),
                        off_duels_won_percent_3m: parseNumber(row['Offensive duels won, %'] as number | undefined),

                        // Pases
                        passes_p90_3m: parseNumber(row['Passes per 90'] as number | undefined),
                        accurate_passes_percent_3m: parseNumber(row['Accurate passes, %'] as number | undefined),
                        forward_passes_p90_3m: parseNumber(row['Forward passes per 90'] as number | undefined),

                        // Porteros
                        conceded_goals_p90_3m: parseNumber(row['Conceded goals per 90'] as number | undefined),
                        shots_against_p90_3m: parseNumber(row['Shots against per 90'] as number | undefined),
                        clean_sheets_tot_3m: toInt(row['Clean sheets']),
                        save_rate_percent_3m: parseNumber(row['Save rate, %'] as number | undefined),
                        prevented_goals_p90_3m: parseNumber(row['Prevented goals per 90'] as number | undefined),

                        // Físico (tracking)
                        total_meters_3m: parseNumber(row['Total meters'] as number | undefined),
                        max_speed_3m: parseNumber(row['Max speed'] as number | undefined),
                        meters_per_min_3m: parseNumber(row['Meters per minute'] as number | undefined),
                        over_15kmh_3m: parseNumber(row['Meters over 15 km/h'] as number | undefined),
                        over_20kmh_3m: parseNumber(row['Meters over 20 km/h'] as number | undefined),
                        over_25kmh_3m: parseNumber(row['Meters over 25 km/h'] as number | undefined)
                      },
                      create: {
                        id_player: player.id_player,

                        // Partidos y minutos
                        matches_played_tot_3m: toInt(row['Matches played']),
                        minutes_played_tot_3m: toInt(row['Minutes played']),

                        // Duelos defensivos
                        def_duels_p90_3m: parseNumber(row['Defensive duels per 90'] as number | undefined),
                        def_duels_won_percent_3m: parseNumber(row['Defensive duels won, %'] as number | undefined),

                        // Duelos aéreos
                        aerials_duels_p90_3m: parseNumber(row['Aerial duels per 90'] as number | undefined),
                        aerials_duels_won_percent_3m: parseNumber(row['Aerial duels won, %'] as number | undefined),

                        // Tackles e intercepciones
                        tackles_p90_3m: parseNumber(row['Sliding tackles per 90'] as number | undefined),
                        interceptions_p90_3m: parseNumber(row['Interceptions per 90'] as number | undefined),

                        // Faltas y tarjetas
                        fouls_p90_3m: parseNumber(row['Fouls per 90'] as number | undefined),
                        yellow_cards_p90_3m: parseNumber(row['Yellow cards per 90'] as number | undefined),
                        red_cards_p90_3m: parseNumber(row['Red cards per 90'] as number | undefined),

                        // Goles y tiros
                        goals_p90_3m: parseNumber(row['Goals per 90'] as number | undefined),
                        shots_p90_3m: parseNumber(row['Shots per 90'] as number | undefined),

                        // Asistencias y centros
                        assists_p90_3m: parseNumber(row['Assists per 90'] as number | undefined),
                        crosses_p90_3m: parseNumber(row['Crosses per 90'] as number | undefined),

                        // Duelos ofensivos
                        off_duels_p90_3m: parseNumber(row['Offensive duels per 90'] as number | undefined),
                        off_duels_won_percent_3m: parseNumber(row['Offensive duels won, %'] as number | undefined),

                        // Pases
                        passes_p90_3m: parseNumber(row['Passes per 90'] as number | undefined),
                        accurate_passes_percent_3m: parseNumber(row['Accurate passes, %'] as number | undefined),
                        forward_passes_p90_3m: parseNumber(row['Forward passes per 90'] as number | undefined),

                        // Porteros
                        conceded_goals_p90_3m: parseNumber(row['Conceded goals per 90'] as number | undefined),
                        shots_against_p90_3m: parseNumber(row['Shots against per 90'] as number | undefined),
                        clean_sheets_tot_3m: toInt(row['Clean sheets']),
                        save_rate_percent_3m: parseNumber(row['Save rate, %'] as number | undefined),
                        prevented_goals_p90_3m: parseNumber(row['Prevented goals per 90'] as number | undefined),

                        // Físico (tracking)
                        total_meters_3m: parseNumber(row['Total meters'] as number | undefined),
                        max_speed_3m: parseNumber(row['Max speed'] as number | undefined),
                        meters_per_min_3m: parseNumber(row['Meters per minute'] as number | undefined),
                        over_15kmh_3m: parseNumber(row['Meters over 15 km/h'] as number | undefined),
                        over_20kmh_3m: parseNumber(row['Meters over 20 km/h'] as number | undefined),
                        over_25kmh_3m: parseNumber(row['Meters over 25 km/h'] as number | undefined)
                      }
                    })
                  } catch {
                    // No marcamos como error total, el jugador fue creado/actualizado correctamente
                  }
                }

                results.success++

                // Enviar progreso cada 10 jugadores
                const currentProgress = (batchIndex * BATCH_SIZE) + rowIndex + 1
                if (currentProgress % 10 === 0 || currentProgress === data.length) {
                  sendSSE(controller, {
                    type: 'progress',
                    current: currentProgress,
                    total: data.length,
                    percentage: Math.round((currentProgress / data.length) * 100)
                  })
                }

              } catch (error) {
                results.failed++
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                results.errors.push(
                  `Error procesando jugador ${playerName}${wyscoutId ? ` (Wyscout ID ${wyscoutId})` : ''}: ${errorMsg}`
                )
                sendSSE(controller, {
                  type: 'error',
                  message: `❌ Error en ${playerName}: ${errorMsg}`
                })
              }
            }

            // Log de progreso del lote
            sendSSE(controller, {
              type: 'batch',
              batchNum,
              totalBatches: batches.length,
              message: `✅ Lote ${batchNum}/${batches.length} completado`
            })
          }

          // 📊 RESULTADO FINAL
          const messageParts = [`Importación completada: ${results.success} exitosos, ${results.failed} fallidos`]
          if (results.created > 0) {
            messageParts.push(`${results.created} jugadores nuevos creados`)
          }
          if (results.updated > 0) {
            messageParts.push(`${results.updated} jugadores actualizados`)
          }
          const message = messageParts.join(' | ')

          sendSSE(controller, {
            type: 'complete',
            message,
            results
          })

          console.log('✅ Stats Import completed:', {
            totalProcessed: data.length,
            successful: results.success,
            failed: results.failed,
            created: results.created,
            updated: results.updated,
            importedBy: userId,
            timestamp: new Date().toISOString()
          })

        } catch (error) {
          console.error('❌ Error in Stats import:', error)
          sendSSE(controller, {
            type: 'error',
            message: `❌ Error interno: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        } finally {
          controller.close()
        }
      }
    })

    // Retornar stream como Server-Sent Events
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('❌ Error in Stats import setup:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor durante la importación.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
