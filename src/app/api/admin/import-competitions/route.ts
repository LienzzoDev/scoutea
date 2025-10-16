/**
 * 📥 ENDPOINT DE IMPORTACIÓN DE COMPETICIONES DESDE XLS CON LIVE STREAMING
 *
 * ✅ PROPÓSITO: Importar datos de competiciones desde archivo Excel/XLS (hoja COMPETITIONS)
 * ✅ BENEFICIO: Permite al admin cargar competiciones masivamente con logs en vivo
 * ✅ RUTA: POST /api/admin/import-competitions
 * ✅ OPTIMIZACIÓN: Soporta importación masiva con batch processing y SSE streaming
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

import { prisma } from '@/lib/db'

// ⏱️ Configuración del route: timeout extendido para importaciones masivas
export const maxDuration = 300 // 5 minutos (máximo en Vercel Hobby plan)
export const dynamic = 'force-dynamic'

interface CompetitionImportRow {
  // Identificación
  id_competition?: string
  competition_name?: string
  correct_competition_name?: string
  competition_country?: string

  // URL
  url_trfm?: string

  // Clasificación
  competition_confederation?: string
  competition_tier?: number

  // Valores y estadísticas
  competition_trfm_value?: number
  competition_trfm_value_norm?: number
  competition_rating?: number
  competition_rating_norm?: number
  competition_elo?: number
  competition_level?: string
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
 * POST /api/admin/import-competitions - Importar competiciones desde XLS (hoja COMPETITIONS) con streaming
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

    // 🔍 BUSCAR LA HOJA "COMPETITIONS" (case-insensitive)
    const competitionsSheetName = workbook.SheetNames.find(
      name => name.toLowerCase() === 'competitions'
    )

    if (!competitionsSheetName) {
      return new Response(
        JSON.stringify({ error: 'El archivo no contiene una hoja llamada "COMPETITIONS". Por favor, asegúrate de que tu archivo Excel tenga una hoja con ese nombre.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const worksheet = workbook.Sheets[competitionsSheetName]
    const data: CompetitionImportRow[] = XLSX.utils.sheet_to_json(worksheet)

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'La hoja COMPETITIONS está vacía o no tiene el formato correcto.' }),
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
          createdCompetitions: [] as string[]
        }

        try {
          // Enviar inicio
          sendSSE(controller, {
            type: 'start',
            total: data.length,
            message: `📥 Iniciando importación de ${data.length} competiciones...`
          })

          // 🚀 OPTIMIZACIÓN: Pre-cargar todas las competiciones existentes en memoria
          sendSSE(controller, {
            type: 'info',
            message: '🔍 Cargando competiciones existentes en la base de datos...'
          })

          const allCompetitionNames = data
            .map(row => parseString(row.competition_name))
            .filter(Boolean) as string[]

          const existingCompetitions = await prisma.competition.findMany({
            where: {
              competition_name: { in: allCompetitionNames }
            },
            select: {
              id_competition: true,
              competition_name: true
            }
          })

          // Crear mapa de búsqueda rápida: competitionName -> competition
          const competitionMap = new Map<string, typeof existingCompetitions[0]>()
          existingCompetitions.forEach(comp => {
            if (comp.competition_name) {
              competitionMap.set(comp.competition_name, comp)
            }
          })

          sendSSE(controller, {
            type: 'info',
            message: `✅ ${existingCompetitions.length} competiciones existentes cargadas en memoria`
          })

          // 📦 PROCESAMIENTO POR LOTES (Batch processing)
          const BATCH_SIZE = 50 // Procesar de 50 en 50 para mejor feedback
          const batches = []
          for (let i = 0; i < data.length; i += BATCH_SIZE) {
            batches.push(data.slice(i, i + BATCH_SIZE))
          }

          sendSSE(controller, {
            type: 'info',
            message: `📦 Procesando ${data.length} competiciones en ${batches.length} lotes de hasta ${BATCH_SIZE}`
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

            // Procesar cada competición del lote
            for (const row of batch) {
              const competitionName = parseString(row.competition_name)

              if (!competitionName) {
                results.failed++
                results.errors.push(`Fila sin nombre de competición`)
                sendSSE(controller, {
                  type: 'error',
                  message: `⚠️ Fila sin nombre de competición`
                })
                continue
              }

              try {
                // 🔍 BUSCAR COMPETICIÓN EN EL MAPA (O(1) lookup)
                const existingCompetition = competitionMap.get(competitionName)

                // 📦 PREPARAR DATOS DE LA COMPETICIÓN
                const competitionData = {
                  competition_name: competitionName,
                  correct_competition_name: parseString(row.correct_competition_name),
                  competition_country: parseString(row.competition_country),
                  url_trfm: parseString(row.url_trfm),
                  competition_confederation: parseString(row.competition_confederation),
                  competition_tier: parseInteger(row.competition_tier),
                  competition_trfm_value: parseNumber(row.competition_trfm_value),
                  competition_trfm_value_norm: parseNumber(row.competition_trfm_value_norm),
                  competition_rating: parseNumber(row.competition_rating),
                  competition_rating_norm: parseNumber(row.competition_rating_norm),
                  competition_elo: parseNumber(row.competition_elo),
                  competition_level: parseString(row.competition_level),
                  // Keep legacy fields in sync
                  name: competitionName,
                  tier: parseInteger(row.competition_tier),
                  confederation: parseString(row.competition_confederation),
                }

                // 🆕 SI NO EXISTE, CREAR COMPETICIÓN
                if (!existingCompetition) {
                  try {
                    const newCompetition = await prisma.competition.create({
                      data: competitionData,
                      select: { id_competition: true, competition_name: true }
                    })

                    // Añadir al mapa para futuras referencias
                    if (newCompetition.competition_name) {
                      competitionMap.set(newCompetition.competition_name, newCompetition)
                    }

                    results.created++
                    if (results.createdCompetitions.length < 50) {
                      results.createdCompetitions.push(competitionName)
                    }

                    sendSSE(controller, {
                      type: 'competition_created',
                      competitionName,
                      message: `🆕 Competición creada: ${competitionName}`
                    })
                  } catch (createError) {
                    results.failed++
                    const errorMsg = createError instanceof Error ? createError.message : 'Unknown error'
                    results.errors.push(`Error creando competición ${competitionName}: ${errorMsg}`)
                    sendSSE(controller, {
                      type: 'error',
                      message: `❌ Error creando ${competitionName}: ${errorMsg}`
                    })
                    continue
                  }
                } else {
                  // 🔄 SI YA EXISTE, ACTUALIZAR
                  try {
                    await prisma.competition.update({
                      where: { id_competition: existingCompetition.id_competition },
                      data: competitionData
                    })
                    results.updated++

                    sendSSE(controller, {
                      type: 'competition_updated',
                      competitionName,
                      message: `🔄 Competición actualizada: ${competitionName}`
                    })
                  } catch (updateError) {
                    // No marcar como error, la competición existe
                    sendSSE(controller, {
                      type: 'warning',
                      message: `⚠️ Advertencia actualizando ${competitionName}`
                    })
                  }
                }

                results.success++

                // Enviar progreso cada 10 competiciones
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
                results.errors.push(`Error procesando competición ${competitionName}: ${errorMsg}`)
                sendSSE(controller, {
                  type: 'error',
                  message: `❌ Error en ${competitionName}: ${errorMsg}`
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
            messageParts.push(`${results.created} competiciones nuevas creadas`)
          }
          if (results.updated > 0) {
            messageParts.push(`${results.updated} competiciones actualizadas`)
          }
          const message = messageParts.join(' | ')

          sendSSE(controller, {
            type: 'complete',
            message,
            results
          })

          console.log('✅ Competitions Import completed:', {
            totalProcessed: data.length,
            successful: results.success,
            failed: results.failed,
            created: results.created,
            updated: results.updated,
            importedBy: userId,
            timestamp: new Date().toISOString()
          })

        } catch (error) {
          console.error('❌ Error in Competitions import:', error)
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
    console.error('❌ Error in Competitions import setup:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor durante la importación.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
