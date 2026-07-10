/**
 * 📥 IMPORTACIÓN DE STATS POR PERIODO DESDE ZIP (varios XLSX) CON LIVE STREAMING
 *
 * ✅ El ZIP contiene varios .xlsx (export Wyscout, columnas en español). El periodo
 *    se deriva de la SEGUNDA palabra del nombre del archivo: "3W 6M.xlsx" → 6M → 6m.
 *    (3M→3m, 6M→6m, 1Y→1y, 2Y→2y). La primera palabra se ignora.
 * ✅ VINCULACIÓN: por la columna `id` (Wyscout ID) → wyscout_id_1/2, con fallback a id_player.
 * ✅ RUTA: POST /api/admin/import-stats-zip  (multipart/form-data con `file`)
 * ✅ Tras importar cada periodo, recalcula sus normalizaciones y rankings.
 */

import { auth } from '@clerk/nextjs/server'
import JSZip from 'jszip'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'

import {
  importParsedRows,
  loadWyscoutMaps,
  recalcPeriodNormalizations,
} from '@/lib/services/period-stats-import'
import { type StatsPeriod, isValidPeriod } from '@/lib/utils/stats-period-utils'

export const maxDuration = 300
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_ZIP_SIZE = 200 * 1024 * 1024 // 200 MB

function sendSSE(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
}

/** Deriva el periodo del nombre del archivo (2ª palabra: 3M/6M/1Y/2Y). */
function periodFromFilename(filename: string): StatsPeriod | null {
  const base = filename.replace(/\.[^.]+$/, '').trim()
  const tokens = base.split(/\s+/)
  const candidates = tokens.length >= 2 ? [tokens[1]!, ...tokens] : tokens
  for (const tok of candidates) {
    const p = tok.toLowerCase()
    if (isValidPeriod(p)) return p
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado. Debes iniciar sesión.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado. Solo administradores.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return new Response(JSON.stringify({ error: 'No se proporcionó ningún archivo.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (file.size > MAX_ZIP_SIZE) {
      return new Response(JSON.stringify({ error: 'El archivo supera el límite de 200 MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
    // Lista de { filename, buffer } a procesar
    const files: Array<{ filename: string; buffer: ArrayBuffer | Buffer }> = []

    if (ext === '.zip') {
      const zip = await JSZip.loadAsync(await file.arrayBuffer()).catch(() => null)
      if (!zip) {
        return new Response(JSON.stringify({ error: 'ZIP inválido o corrupto.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const entries = Object.values(zip.files).filter(
        (e) =>
          !e.dir &&
          !e.name.startsWith('__MACOSX/') &&
          !e.name.split('/').pop()!.startsWith('.') &&
          /\.xlsx?$/i.test(e.name)
      )
      for (const entry of entries) {
        const filename = entry.name.split('/').pop() || entry.name
        files.push({ filename, buffer: await entry.async('nodebuffer') })
      }
    } else if (ext === '.xlsx' || ext === '.xls') {
      files.push({ filename: file.name, buffer: await file.arrayBuffer() })
    } else {
      return new Response(JSON.stringify({ error: 'El archivo debe ser .zip o .xlsx.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const results = { success: 0, notFound: 0, failed: 0, errors: [] as string[] }
        const touchedPeriods = new Set<StatsPeriod>()

        try {
          sendSSE(controller, { type: 'start', message: `📥 Procesando ${files.length} archivo(s) de stats...` })

          // Precargar mapas de matching (wyscout_id → id_player, set de id_player)
          sendSSE(controller, { type: 'info', message: '🔍 Cargando jugadores (wyscout_id)...' })
          const maps = await loadWyscoutMaps()
          sendSSE(controller, { type: 'info', message: `✅ ${maps.wyMap.size} Wyscout IDs en BD` })

          for (const { filename, buffer } of files) {
            const period = periodFromFilename(filename)
            if (!period) {
              results.errors.push(`${filename}: no se pudo derivar el periodo (3M/6M/1Y/2Y)`)
              sendSSE(controller, { type: 'warning', message: `⚠️ ${filename}: periodo no reconocido, se omite` })
              continue
            }

            const wb = XLSX.read(buffer as Buffer, { type: 'buffer' })
            const sheetName = wb.SheetNames[0]
            const ws = sheetName ? wb.Sheets[sheetName] : undefined
            if (!ws) {
              sendSSE(controller, { type: 'warning', message: `⚠️ ${filename}: sin hoja de cálculo, se omite` })
              continue
            }
            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
            touchedPeriods.add(period)
            sendSSE(controller, { type: 'info', message: `📄 ${filename} → periodo ${period.toUpperCase()} (${rows.length} filas)` })

            // Importa las filas (matching + dedup + upsert) reutilizando el core compartido.
            const fileRes = await importParsedRows(
              rows,
              period,
              maps,
              (processed, total) => {
                // Throttle: SSE cada ~200 filas o al terminar (como antes).
                if (processed % 200 < 8 || processed === total) {
                  sendSSE(controller, {
                    type: 'progress',
                    filename,
                    period,
                    current: processed,
                    total,
                    percentage: total ? Math.round((processed / total) * 100) : 100,
                  })
                }
              },
              filename
            )
            results.success += fileRes.success
            results.notFound += fileRes.notFound
            results.failed += fileRes.failed
            if (results.errors.length < 100) {
              results.errors.push(...fileRes.errors.slice(0, 100 - results.errors.length))
            }

            // Avisos de diagnóstico de columnas (cambio parcial de cabeceras del export).
            for (const w of fileRes.warnings) {
              sendSSE(controller, { type: 'warning', message: `⚠️ ${w}` })
            }
            // Caso catastrófico: el núcleo abortó por cabeceras irreconocibles (0 matches con filas).
            if (fileRes.matched === 0 && rows.length > 0 && fileRes.errors.length > 0) {
              sendSSE(controller, { type: 'error', message: `❌ ${fileRes.errors[0]}` })
              continue
            }

            sendSSE(controller, { type: 'success', message: `✅ ${filename}: ${fileRes.success} jugadores importados (${rows.length} filas, ${fileRes.matched} únicos)` })
          }

          // Recalcular normalizaciones y rankings por cada periodo tocado (aislado por periodo)
          for (const period of touchedPeriods) {
            sendSSE(controller, { type: 'info', message: `📊 Recalculando normalizaciones de ${period.toUpperCase()}...` })
            try {
              const n = await recalcPeriodNormalizations(period, (msg) => sendSSE(controller, { type: 'info', message: msg }))
              sendSSE(controller, { type: 'success', message: `✅ Normalizaciones ${period.toUpperCase()}: ${n} jugadores` })
            } catch (e) {
              sendSSE(controller, { type: 'error', message: `❌ Error normalizando ${period.toUpperCase()}: ${e instanceof Error ? e.message : 'desconocido'}` })
            }
          }

          const message = `Stats importadas: ${results.success} ok, ${results.notFound} sin jugador, ${results.failed - results.notFound} con error`
          sendSSE(controller, { type: 'complete', message, results })

          console.log('✅ Stats ZIP import completed:', { ...results, periods: [...touchedPeriods], importedBy: userId, timestamp: new Date().toISOString() })
        } catch (error) {
          console.error('❌ Error in stats ZIP import:', error)
          sendSSE(controller, { type: 'error', message: `❌ Error interno: ${error instanceof Error ? error.message : 'Unknown error'}` })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  } catch (error) {
    console.error('❌ Error in stats ZIP import setup:', error)
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
