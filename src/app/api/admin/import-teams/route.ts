/**
 * 📥 ENDPOINT DE IMPORTACIÓN DE EQUIPOS DESDE XLS CON LIVE STREAMING
 *
 * ✅ PROPÓSITO: Importar datos de equipos desde archivo Excel/XLS (hoja TEAMS)
 * ✅ BENEFICIO: Permite al admin cargar equipos masivamente con logs en vivo
 * ✅ RUTA: POST /api/admin/import-teams
 * ✅ OPTIMIZACIÓN: Soporta importación masiva con batch processing y SSE streaming
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

import { prisma } from '@/lib/db'

// ⏱️ Configuración del route: timeout extendido para importaciones masivas
export const maxDuration = 300 // 5 minutos (máximo en Vercel Hobby plan)
export const dynamic = 'force-dynamic'

interface TeamImportRow {
  // Identificación
  id_team?: string
  team_name?: string
  correct_team_name?: string
  team_country?: string

  // URLs
  url_trfm_advisor?: string
  url_trfm?: string

  // Propietario
  owner_club?: string
  owner_club_country?: string

  // Competición
  pre_competition?: string
  competition?: string
  correct_competition?: string
  competition_country?: string

  // Valores y estadísticas
  team_trfm_value?: number
  team_trfm_value_norm?: number
  team_rating?: number
  team_rating_norm?: number
  team_elo?: number
  team_level?: string

  // Campos adicionales (opcionales)
  short_name?: string
  founded_year?: number | string
  stadium?: string
  website_url?: string
  logo_url?: string
}

/**
 * Helper: Convertir valor a número o null
 */
function parseNumber(value: number | string | undefined | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? null : num
}

/**
 * Helper: Convertir valor a string o null
 */
function parseString(value: string | number | undefined | null): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value).trim()
}

/**
 * Helper: Convertir valor a entero o null
 */
function parseInteger(value: number | string | undefined | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseInt(value, 10) : Math.round(value)
  return isNaN(num) ? null : num
}

/**
 * Helper: Enviar evento SSE
 */
function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
}

/**
 * POST /api/admin/import-teams - Importar equipos desde XLS (hoja TEAMS) con streaming
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

    // 📝 OBTENER ARCHIVO DEL BODY
    const formData = await request.formData()
    const file = formData.get('file') as File

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

    // 🔍 BUSCAR LA HOJA "TEAMS" (case-insensitive)
    const teamsSheetName = workbook.SheetNames.find(
      name => name.toLowerCase() === 'teams'
    )

    if (!teamsSheetName) {
      return new Response(
        JSON.stringify({ error: 'El archivo no contiene una hoja llamada "TEAMS". Por favor, asegúrate de que tu archivo Excel tenga una hoja con ese nombre.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const worksheet = workbook.Sheets[teamsSheetName]
    const data: TeamImportRow[] = XLSX.utils.sheet_to_json(worksheet)

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'La hoja TEAMS está vacía o no tiene el formato correcto.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
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
          createdTeams: [] as string[]
        }

        try {
          // Enviar inicio
          sendSSE(controller, {
            type: 'start',
            total: data.length,
            message: `📥 Iniciando importación de ${data.length} equipos...`
          })

          // 🚀 OPTIMIZACIÓN: Pre-cargar todos los equipos existentes en memoria
          sendSSE(controller, {
            type: 'info',
            message: '🔍 Cargando equipos existentes en la base de datos...'
          })

          const allTeamNames = data
            .map(row => parseString(row.team_name))
            .filter(Boolean) as string[]

          const existingTeams = await prisma.equipo.findMany({
            where: {
              team_name: { in: allTeamNames }
            },
            select: {
              id_team: true,
              team_name: true
            }
          })

          // Crear mapa de búsqueda rápida: teamName -> team
          const teamMap = new Map<string, typeof existingTeams[0]>()
          existingTeams.forEach(team => {
            teamMap.set(team.team_name, team)
          })

          sendSSE(controller, {
            type: 'info',
            message: `✅ ${existingTeams.length} equipos existentes cargados en memoria`
          })

          // 📦 PROCESAMIENTO POR LOTES (Batch processing)
          const BATCH_SIZE = 50 // Procesar de 50 en 50 para mejor feedback
          const batches = []
          for (let i = 0; i < data.length; i += BATCH_SIZE) {
            batches.push(data.slice(i, i + BATCH_SIZE))
          }

          sendSSE(controller, {
            type: 'info',
            message: `📦 Procesando ${data.length} equipos en ${batches.length} lotes de hasta ${BATCH_SIZE}`
          })

          // 🔄 PROCESAR CADA LOTE
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex]
            const batchNum = batchIndex + 1

            sendSSE(controller, {
              type: 'batch_start',
              batchNum,
              totalBatches: batches.length,
              message: `🔄 Procesando lote ${batchNum}/${batches.length}...`
            })

            // Procesar cada equipo del lote
            for (const row of batch) {
              const teamName = parseString(row.team_name)

              if (!teamName) {
                results.failed++
                results.errors.push(`Fila sin nombre de equipo`)
                sendSSE(controller, {
                  type: 'error',
                  message: `⚠️ Fila sin nombre de equipo`
                })
                continue
              }

              try {
                // 🔍 BUSCAR EQUIPO EN EL MAPA (O(1) lookup)
                const existingTeam = teamMap.get(teamName)

                // 📦 PREPARAR DATOS DEL EQUIPO
                const teamData = {
                  team_name: teamName,
                  correct_team_name: parseString(row.correct_team_name),
                  team_country: parseString(row.team_country),
                  url_trfm_advisor: parseString(row.url_trfm_advisor),
                  url_trfm: parseString(row.url_trfm),
                  owner_club: parseString(row.owner_club),
                  owner_club_country: parseString(row.owner_club_country),
                  pre_competition: parseString(row.pre_competition),
                  competition: parseString(row.competition),
                  correct_competition: parseString(row.correct_competition),
                  competition_country: parseString(row.competition_country),
                  team_trfm_value: parseNumber(row.team_trfm_value),
                  team_trfm_value_norm: parseNumber(row.team_trfm_value_norm),
                  team_rating: parseNumber(row.team_rating),
                  team_rating_norm: parseNumber(row.team_rating_norm),
                  team_elo: parseNumber(row.team_elo),
                  team_level: parseString(row.team_level),
                  short_name: parseString(row.short_name),
                  founded_year: parseInteger(row.founded_year),
                  stadium: parseString(row.stadium),
                  website_url: parseString(row.website_url),
                  logo_url: parseString(row.logo_url),
                }

                // 🆕 SI NO EXISTE, CREAR EQUIPO
                if (!existingTeam) {
                  try {
                    const newTeam = await prisma.equipo.create({
                      data: teamData,
                      select: { id_team: true, team_name: true }
                    })

                    // Añadir al mapa para futuras referencias
                    teamMap.set(teamName, newTeam)

                    results.created++
                    if (results.createdTeams.length < 50) {
                      results.createdTeams.push(teamName)
                    }

                    sendSSE(controller, {
                      type: 'team_created',
                      teamName,
                      message: `🆕 Equipo creado: ${teamName}`
                    })
                  } catch (createError) {
                    results.failed++
                    const errorMsg = createError instanceof Error ? createError.message : 'Unknown error'
                    results.errors.push(`Error creando equipo ${teamName}: ${errorMsg}`)
                    sendSSE(controller, {
                      type: 'error',
                      message: `❌ Error creando ${teamName}: ${errorMsg}`
                    })
                    continue
                  }
                } else {
                  // 🔄 SI YA EXISTE, ACTUALIZAR
                  try {
                    await prisma.equipo.update({
                      where: { id_team: existingTeam.id_team },
                      data: teamData
                    })
                    results.updated++

                    sendSSE(controller, {
                      type: 'team_updated',
                      teamName,
                      message: `🔄 Equipo actualizado: ${teamName}`
                    })
                  } catch (updateError) {
                    // No marcar como error, el equipo existe
                    sendSSE(controller, {
                      type: 'warning',
                      message: `⚠️ Advertencia actualizando ${teamName}`
                    })
                  }
                }

                results.success++

                // Enviar progreso cada 10 equipos
                const currentProgress = (batchIndex * BATCH_SIZE) + batch.indexOf(row) + 1
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
                results.errors.push(`Error procesando equipo ${teamName}: ${errorMsg}`)
                sendSSE(controller, {
                  type: 'error',
                  message: `❌ Error en ${teamName}: ${errorMsg}`
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
            messageParts.push(`${results.created} equipos nuevos creados`)
          }
          if (results.updated > 0) {
            messageParts.push(`${results.updated} equipos actualizados`)
          }
          const message = messageParts.join(' | ')

          sendSSE(controller, {
            type: 'complete',
            message,
            results
          })

          console.log('✅ Teams Import completed:', {
            totalProcessed: data.length,
            successful: results.success,
            failed: results.failed,
            created: results.created,
            updated: results.updated,
            importedBy: userId,
            timestamp: new Date().toISOString()
          })

        } catch (error) {
          console.error('❌ Error in Teams import:', error)
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
    console.error('❌ Error in Teams import setup:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor durante la importación.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
