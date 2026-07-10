/**
 * 📥 ENDPOINT DE IMPORTACIÓN DE ESTADÍSTICAS DESDE XLS CON LIVE STREAMING
 *
 * ✅ PROPÓSITO: Importar estadísticas de jugadores desde archivo Excel/XLS
 * ✅ BENEFICIO: Permite al admin cargar estadísticas masivamente con logs en vivo
 * ✅ RUTA: POST /api/admin/import-stats
 * ✅ OPTIMIZACIÓN: Soporta importación masiva de hasta 3000+ jugadores con SSE streaming
 */

import { auth } from '@clerk/nextjs/server'
import { del } from '@vercel/blob'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

import { prisma } from '@/lib/db'
import {
  mapRowToStatsData,
  recalcPeriodNormalizations,
  type NormalizedRow,
} from '@/lib/services/period-stats-import'

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
 * Soporta strings ISO, Date, y numbers como serial date de Excel (días desde 1899-12-30)
 */
function parseDate(value: string | number | Date | undefined | null): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return value

  // Excel serial date: número entero (días desde 1899-12-30)
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = (value - 25569) * 86400 * 1000
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }

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
 * Helper: Normalizar clave para joins entre hojas (case/espacios-insensible)
 */
function normKey(value: RowValue): string {
  return String(value ?? '').trim().toLowerCase()
}

/**
 * Helper: Primer string no vacío de una lista. Trata "-" y "" como vacío
 * (el dataset usa "-" como placeholder de "sin dato").
 */
function coalesceStr(...values: RowValue[]): string | null {
  for (const v of values) {
    const s = parseString(v)
    if (s !== null && s !== '-') return s
  }
  return null
}

/**
 * Helper: Primer número válido de una lista (ignora "-", "No", strings no numéricos).
 */
function coalesceNum(...values: RowValue[]): number | null {
  for (const v of values) {
    const n = parseNumber(v)
    if (n !== null) return n
  }
  return null
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
    // Dos vías: (a) JSON { blobUrl } — el archivo ya se subió a Vercel Blob desde el navegador,
    // saltándose el límite de 4.5 MB del body de las funciones; leemos los bytes desde la URL.
    // (b) multipart/form-data con `file` — vía tradicional para archivos pequeños.
    const contentType = request.headers.get('content-type') || ''
    const jsonError = (msg: string, status = 400) =>
      new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })

    let buffer: Buffer
    let fileName: string
    let maxRows: number | null
    let skipExisting: boolean
    // URL del blob a limpiar tras leerlo (solo en la vía blob).
    let blobToDelete: string | null = null

    if (contentType.includes('application/json')) {
      const body = (await request.json().catch(() => null)) as
        | { blobUrl?: string; filename?: string; maxRows?: number | null; skipExisting?: boolean }
        | null
      const blobUrl = body?.blobUrl
      if (!blobUrl) return jsonError('Falta blobUrl en la petición.')
      fileName = body?.filename || 'import.xlsx'
      maxRows = typeof body?.maxRows === 'number' ? body.maxRows : null
      skipExisting = body?.skipExisting === true
      blobToDelete = blobUrl

      const blobRes = await fetch(blobUrl).catch(() => null)
      if (!blobRes || !blobRes.ok) return jsonError('No se pudo leer el archivo subido (blob).')
      buffer = Buffer.from(await blobRes.arrayBuffer())
    } else {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const maxRowsParam = formData.get('maxRows') as string | null
      maxRows = maxRowsParam ? parseInt(maxRowsParam) : null
      // Si está activo, los jugadores que ya existen en BD se saltan completamente
      // (no se actualizan ni se reescriben sus stats). Pensado para retomar tras un cuelgue.
      skipExisting = formData.get('skipExisting') === 'true'
      if (!file) return jsonError('No se proporcionó ningún archivo.')
      fileName = file.name
      buffer = Buffer.from(await file.arrayBuffer())
    }

    // Verificar que sea un archivo Excel/CSV (por la extensión del nombre original)
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0]
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      if (blobToDelete) await del(blobToDelete).catch(() => {})
      return jsonError('El archivo debe ser un Excel (.xlsx, .xls) o CSV.')
    }

    // 📖 LEER ARCHIVO EXCEL. Ya leído a `buffer`; el blob (si lo hubo) puede borrarse.
    if (blobToDelete) await del(blobToDelete).catch(() => {})
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
      // ✅ TIENE ENCABEZADOS: usamos sheet_to_json con range apuntando a la fila de
      // encabezados para que xlsx haga el auto-naming (`__EMPTY`, `__EMPTY_1`, ...).
      // Esto es importante porque BASE DATOS.xlsx tiene columnas con header de imagen
      // (URLs) que vienen sin texto y se perdían con el mapping manual previo.
      data = XLSX.utils.sheet_to_json<PlayerImportRow>(worksheet, {
        defval: null,
        range: dataStartIndex - 1,
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

    // 🔗 CONSTRUIR MAPAS DE REFERENCIA DESDE LAS OTRAS HOJAS
    // BASE DATOS.xlsx es relacional: la hoja PLAYERS solo trae el nombre del equipo,
    // y los datos de equipo/competición/nación viven en hojas aparte. Sin este cruce,
    // campos como team_elo, competition_tier, owner_club quedaban vacíos para casi
    // todos los jugadores.
    type RefRow = Record<string, RowValue>
    const readSheet = (name: string): RefRow[] => {
      const sheet = workbook.Sheets[name]
      if (!sheet) return []
      return XLSX.utils.sheet_to_json<RefRow>(sheet, { defval: null, range: 0 })
    }

    // TEAMS: clave por team_name y correct_team_name
    const teamMap = new Map<string, RefRow>()
    for (const t of readSheet('TEAMS')) {
      const k1 = normKey(t.team_name)
      const k2 = normKey(t.correct_team_name)
      if (k1) teamMap.set(k1, t)
      if (k2 && !teamMap.has(k2)) teamMap.set(k2, t)
    }

    // COMPETITIONS: clave por competition_name y correct_competition_name
    const compMap = new Map<string, RefRow>()
    for (const c of readSheet('COMPETITIONS')) {
      const k1 = normKey(c.competition_name)
      const k2 = normKey(c.correct_competition_name)
      if (k1) compMap.set(k1, c)
      if (k2 && !compMap.has(k2)) compMap.set(k2, c)
    }

    // NATIONS: clave por national_tier
    const nationMap = new Map<string, RefRow>()
    for (const n of readSheet('NATIONS')) {
      const k = normKey(n.national_tier)
      if (k) nationMap.set(k, n)
    }

    /**
     * Resuelve los datos de equipo/competición/nación de un jugador cruzando
     * las hojas de referencia. Devuelve también el nombre de competición resuelto.
     */
    const resolveReferences = (row: PlayerImportRow) => {
      const teamKey = normKey(row.correct_team_name ?? row.team_name)
      const team = teamKey ? teamMap.get(teamKey) : undefined

      // La competición se toma de la fila del jugador o, si no, de la hoja TEAMS
      const compName =
        coalesceStr(
          row.team_competition,
          team?.correct_competition,
          team?.competition
        )
      const comp = compName ? compMap.get(normKey(compName)) : undefined

      const nation = nationMap.get(normKey(row.national_tier))
      return { team, comp, compName, nation }
    }

    // 🌊 CREAR STREAM PARA SSE
    const stream = new ReadableStream({
      async start(controller) {
        const results = {
          success: 0,
          failed: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [] as string[],
          createdPlayers: [] as string[]
        }
        let statsImported = 0

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

          if (skipExisting) {
            sendSSE(controller, {
              type: 'info',
              message: '⏭️ Modo retomar activo: los jugadores ya existentes se saltarán.'
            })
          }

          // 🔗 Informar de las hojas de referencia cargadas para el cruce
          sendSSE(controller, {
            type: 'info',
            message: `🔗 Hojas de referencia cargadas: TEAMS (${teamMap.size} claves), COMPETITIONS (${compMap.size}), NATIONS (${nationMap.size}). Se enriquecerán equipo/competición/club propietario.`
          })

          // 🚀 OPTIMIZACIÓN: Pre-cargar todos los jugadores existentes en memoria
          sendSSE(controller, {
            type: 'info',
            message: '🔍 Cargando jugadores existentes en la base de datos...'
          })

          // Cargar TODOS los jugadores existentes y matchear en memoria. Antes se filtraba con un
          // OR/IN sobre los IDs+nombres del archivo, pero con archivos grandes eso genera decenas de
          // miles de bind variables y supera el límite de Postgres (máx 32767 → error P2035). La BD
          // ronda unos pocos miles de jugadores, así que traerlos todos (4 columnas) es barato.
          const existingPlayers = await prisma.jugador.findMany({
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

                // ⏭️ SKIP-IF-EXISTS (modo retomar)
                if (skipExisting && existingPlayer) {
                  results.skipped++
                  results.success++
                  const currentProgress = (batchIndex * BATCH_SIZE) + rowIndex + 1
                  if (currentProgress % 50 === 0 || currentProgress === data.length) {
                    sendSSE(controller, {
                      type: 'progress',
                      current: currentProgress,
                      total: data.length,
                      percentage: Math.round((currentProgress / data.length) * 100)
                    })
                  }
                  continue
                }

          // 🔗 ENRIQUECER CON DATOS DE LAS HOJAS DE REFERENCIA (TEAMS/COMPETITIONS/NATIONS)
          const refs = resolveReferences(row)

          // 📦 PREPARAR DATOS DEL JUGADOR
          const playerData = {
            // Identificación y nombres
            // old_id conserva el id_player original del Excel (la PK de BD es autoincremental)
            old_id: parseString(row.id_player as string | number | undefined),
            player_name: playerName,
            complete_player_name: parseString(row.complete_player_name),
            wyscout_id_1: wyscoutId || null,
            wyscout_name_1: parseString(row['wyscout_name 1']) || null,
            wyscout_id_2: parseString(row['wyscout_id 2']),
            wyscout_name_2: parseString(row['wyscout_name 2']),
            id_fmi: parseString(row.id_fmi || row['ID_FMI'] || row['ID FMI'] || row['id FMI'] || row['Id FMI']),

            // URLs y referencias
            // Nota: el Excel "BASE DATOS" envía las URLs en columnas con header de imagen,
            // que xlsx parsea como `__EMPTY_*`. Hacemos fallback posicional a esos nombres.
            player_rating: parseNumber(row.player_rating),
            photo_coverage: parseString(row.photo_coverage),
            url_trfm_advisor: parseString(row.url_trfm_advisor),
            url_trfm: parseString(row.url_trfm ?? row['__EMPTY_1']),
            url_secondary: parseString(row.url_secondary ?? row['__EMPTY_8']),
            url_instagram: parseString(row.url_instagram ?? row['__EMPTY_7']),
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
            // correct_nationality_* es el campo que consumen los cálculos (nationality_value).
            // El Excel no trae las columnas correct_*, así que hacemos fallback a nationality_*.
            nationality_1: parseString(row.nationality_1),
            correct_nationality_1: coalesceStr(row.correct_nationality_1, row.nationality_1),
            nationality_value: parseNumber(row.nationality_value),
            nationality_value_percent: parseNumber(row['nationality_value_%']),
            nationality_2: parseString(row.nationality_2),
            correct_nationality_2: coalesceStr(row.correct_nationality_2, row.nationality_2),
            national_tier: parseString(row.national_tier),
            // rename_national_tier: del jugador o, si falta, de la hoja NATIONS
            rename_national_tier: coalesceStr(row.rename_national_tier, refs.nation?.rename_national_tier),
            correct_national_tier: parseString(row.correct_national_tier),

            // Equipo (enriquecido desde la hoja TEAMS por team_name)
            pre_team: parseString(row.pre_team),
            team_name: parseString(row.team_name),
            correct_team_name: coalesceStr(row.correct_team_name, refs.team?.correct_team_name),
            team_country: coalesceStr(row.team_country, refs.team?.team_country),
            team_elo: coalesceNum(row.team_elo, refs.team?.team_elo),
            team_level: coalesceStr(row.team_level, refs.team?.team_level),
            team_level_value: parseNumber(row.team_level_value),
            team_level_value_percent: parseNumber(row['team_level_value_%']),
            team_status: coalesceStr(row.team_status, refs.team?.status),

            // Competición (de TEAMS para el nombre, de COMPETITIONS para el detalle)
            team_competition: coalesceStr(row.team_competition, refs.compName),
            competition_country: coalesceStr(row.competition_country, refs.comp?.competition_country, refs.team?.competition_country),
            team_competition_value: parseNumber(row.team_competition_value),
            team_competition_value_percent: parseNumber(row['team_competition_value_%']),
            competition_tier: coalesceStr(row.competition_tier, refs.comp?.competition_tier),
            competition_confederation: coalesceStr(row.competition_confederation, refs.comp?.competition_confederation),
            competition_elo: coalesceNum(row.competition_elo, refs.comp?.competition_elo),
            competition_level: coalesceStr(row.competition_level, refs.comp?.competition_level),
            competition_level_value: parseNumber(row.competition_level_value),
            competition_level_value_percent: parseNumber(row['competition_level_value_%']),

            // Club propietario y préstamo (enriquecido desde TEAMS)
            owner_club: coalesceStr(row.owner_club, refs.team?.owner_club),
            owner_club_country: coalesceStr(row.owner_club_country, refs.team?.owner_club_country),
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

            // Reportes y estado
            text_report: parseString(row.text_report),
            video_report_1: parseString(row['video_report 1']),

            // Estado inicial al ser añadido (para evolución / EVO)
            // Nota: Excel usa `initial_team`, schema usa `initial_team_name`.
            initial_player_trfm_value: parseNumber(row.initial_player_trfm_value),
            initial_team_name: parseString(row.initial_team),
            initial_team_level: parseString(row.initial_team_level),
            initial_team_elo: parseNumber(row.initial_team_elo),
            initial_competition: parseString(row.initial_competition),
            initial_competition_level: parseString(row.initial_competition_level),
            initial_competition_elo: parseNumber(row.initial_competition_elo),
            transfer_team_pts: parseNumber(row.transfer_team_pts),
            transfer_competition_pts: parseNumber(row.transfer_competition_pts),
            roi: parseNumber(row.roi),
            profit: parseNumber(row.profit),
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
                // Se traduce la fila inglesa a claves de campo y se pasa por el mismo
                // núcleo que el importador de ZIP (mapRowToStatsData), que calcula
                // también los _tot y effectiveness_percent — antes este importador
                // guardaba solo los _p90 y el radar quedaba sin datos derivados.
                if (row['Matches played'] || row['Goals per 90'] || row['Passes per 90']) {
                  try {
                    const normRow: NormalizedRow = {
                      matches_played_tot_3m: row['Matches played'] as number | string,
                      minutes_played_tot_3m: row['Minutes played'] as number | string,
                      def_duels_p90_3m: row['Defensive duels per 90'] as number | string,
                      def_duels_won_percent_3m: row['Defensive duels won, %'] as number | string,
                      aerials_duels_p90_3m: row['Aerial duels per 90'] as number | string,
                      aerials_duels_won_percent_3m: row['Aerial duels won, %'] as number | string,
                      tackles_p90_3m: row['Sliding tackles per 90'] as number | string,
                      interceptions_p90_3m: row['Interceptions per 90'] as number | string,
                      fouls_p90_3m: row['Fouls per 90'] as number | string,
                      yellow_cards_p90_3m: row['Yellow cards per 90'] as number | string,
                      red_cards_p90_3m: row['Red cards per 90'] as number | string,
                      goals_p90_3m: row['Goals per 90'] as number | string,
                      shots_p90_3m: row['Shots per 90'] as number | string,
                      assists_p90_3m: row['Assists per 90'] as number | string,
                      crosses_p90_3m: row['Crosses per 90'] as number | string,
                      off_duels_p90_3m: row['Offensive duels per 90'] as number | string,
                      off_duels_won_percent_3m: row['Offensive duels won, %'] as number | string,
                      passes_p90_3m: row['Passes per 90'] as number | string,
                      accurate_passes_percent_3m: row['Accurate passes, %'] as number | string,
                      forward_passes_p90_3m: row['Forward passes per 90'] as number | string,
                      conceded_goals_p90_3m: row['Conceded goals per 90'] as number | string,
                      shots_against_p90_3m: row['Shots against per 90'] as number | string,
                      clean_sheets_tot_3m: row['Clean sheets'] as number | string,
                      save_rate_percent_3m: row['Save rate, %'] as number | string,
                      prevented_goals_p90_3m: row['Prevented goals per 90'] as number | string,
                      total_meters_3m: row['Total meters'] as number | string,
                      max_speed_3m: row['Max speed'] as number | string,
                      meters_per_min_3m: row['Meters per minute'] as number | string,
                      over_15kmh_3m: row['Meters over 15 km/h'] as number | string,
                      over_20kmh_3m: row['Meters over 20 km/h'] as number | string,
                      over_25kmh_3m: row['Meters over 25 km/h'] as number | string,
                    }
                    const statsData = mapRowToStatsData(normRow, '3m')
                    // No pisar wyscout_id existente cuando la fila no lo trae
                    if (statsData.wyscout_id == null) delete statsData.wyscout_id

                    await prisma.playerStats3m.upsert({
                      where: { id_player: player.id_player },
                      update: statsData,
                      create: { id_player: player.id_player, ...statsData },
                    })
                    statsImported++
                  } catch (statsError) {
                    sendSSE(controller, {
                      type: 'warning',
                      message: `⚠️ Stats no guardadas para ${playerName}: ${statsError instanceof Error ? statsError.message : 'error'}`
                    })
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

          // 📊 Normalizar percentiles/rankings del periodo tras el import
          // (mismo pipeline que el importador de ZIP): sin esto el radar lee
          // los _norm antiguos o vacíos.
          if (statsImported > 0) {
            try {
              sendSSE(controller, { type: 'info', message: '📊 Recalculando normalizaciones (percentiles/rankings 3m)...' })
              const normalized = await recalcPeriodNormalizations('3m', (msg) =>
                sendSSE(controller, { type: 'info', message: msg })
              )
              sendSSE(controller, { type: 'success', message: `✅ Normalizaciones recalculadas para ${normalized} jugadores` })
            } catch (normError) {
              sendSSE(controller, {
                type: 'warning',
                message: `⚠️ Error recalculando normalizaciones: ${normError instanceof Error ? normError.message : 'desconocido'}`
              })
            }
          }

          // 📊 RESULTADO FINAL
          const messageParts = [`Importación completada: ${results.success} exitosos, ${results.failed} fallidos`]
          if (results.created > 0) {
            messageParts.push(`${results.created} jugadores nuevos creados`)
          }
          if (results.updated > 0) {
            messageParts.push(`${results.updated} jugadores actualizados`)
          }
          if (results.skipped > 0) {
            messageParts.push(`${results.skipped} ya existentes saltados`)
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
            skipped: results.skipped,
            skipExisting,
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
