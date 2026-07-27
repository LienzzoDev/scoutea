/**
 * 📥 ENDPOINT DE IMPORTACIÓN DE ATRIBUTOS FMI (JSON / ZIP) CON LIVE STREAMING
 *
 * ✅ PROPÓSITO: Importar atributos FMI (Football Manager) desde un ZIP de archivos JSON
 *    (uno por jugador, nombrado por su id_fmi) o desde un único .json (objeto o array).
 * ✅ MATCHING: por `id_fmi` — el campo `"Id"` del JSON ES el id_fmi (no el Wyscout ID),
 *    y coincide con el nombre del archivo. Fallback al nombre del archivo si falta `Id`.
 * ✅ RUTA: POST /api/admin/import-fmi  (multipart/form-data con `file`)
 * ✅ Tras importar, recalcula total_fmi_pts_norm = PERCENTILE(total_fmi_pts) × 100.
 */

import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import JSZip from 'jszip'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { recalcFmiDerivatives } from '@/lib/services/fmi-derivatives-service'

export const maxDuration = 300
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_ZIP_SIZE = 200 * 1024 * 1024 // 200 MB

interface AttrBlock {
  [key: string]: number
}

interface FMIPlayerData {
  Id: number // id_fmi del jugador
  CA?: number
  PA?: number
  RCA?: number
  ActualRating?: number
  PotentialRating?: number
  Height?: number
  Weight?: number
  GoalKeeperAttributes?: AttrBlock
  MentalAttributes?: AttrBlock
  PhysicalAttributes?: AttrBlock
  HiddenAttributes?: AttrBlock
  TechnicalAttributes?: AttrBlock
  PersonalityAttributes?: AttrBlock
  Positions?: AttrBlock
}

// Mapa Positions del JSON → columnas de la tabla `atributos`
const POSITION_MAP: Record<string, string> = {
  Goalkeeper: 'goalkeeper_fmi',
  Striker: 'striker_fmi',
  AttackingMidCentral: 'attacking_mid_central_fmi',
  AttackingMidLeft: 'attacking_mid_left_fmi',
  AttackingMidRight: 'attacking_mid_right_fmi',
  DefenderCentral: 'defender_central_fmi',
  DefenderLeft: 'defender_left_fmi',
  DefenderRight: 'defender_right_fmi',
  DefensiveMidfielder: 'defensive_midfielder_fmi',
  MidfielderCentral: 'midfielder_central_fmi',
  MidfielderLeft: 'midfielder_left_fmi',
  MidfielderRight: 'midfielder_right_fmi',
  WingBackLeft: 'wing_back_left_fmi',
  WingBackRight: 'wing_back_right_fmi',
}

function n(value: number | undefined | null): number | null {
  return typeof value === 'number' && !isNaN(value) ? value : null
}

/** Construye el objeto de atributos para upsert (sin id_player). */
function buildAtributosData(d: FMIPlayerData): Record<string, number | null> {
  const t = d.TechnicalAttributes ?? {}
  const m = d.MentalAttributes ?? {}
  const p = d.PhysicalAttributes ?? {}
  const g = d.GoalKeeperAttributes ?? {}
  const h = d.HiddenAttributes ?? {}
  const pe = d.PersonalityAttributes ?? {}

  // NOTA: total_fmi_pts NO se escribe aquí. Su única definición es la fórmula
  // del ATTRIBUTES.xlsx (SUM de atributos /2 − negativos) que calcula
  // recalcFmiDerivatives al final del import. CA y PA se guardan como
  // ca_fmi / pa_fmi.
  const data: Record<string, number | null> = {
    id_fmi: n(d.Id),

    // Valores brutos FMI
    ca_fmi: n(d.CA),
    pa_fmi: n(d.PA),
    rca_fmi: n(d.RCA),
    actual_rating_fmi: n(d.ActualRating),
    potential_rating_fmi: n(d.PotentialRating),
    weight_fmi: n(d.Weight),

    // Técnicos
    corners_fmi: n(t.Corners),
    crossing_fmi: n(t.Crossing),
    dribbling_fmi: n(t.Dribbling),
    finishing_fmi: n(t.Finishing),
    first_touch_fmi: n(t.FirstTouch),
    free_kick_taking_fmi: n(t.Freekicks),
    heading_fmi: n(t.Heading),
    long_shots_fmi: n(t.LongShots),
    passing_fmi: n(t.Passing),
    penalty_taking_fmi: n(t.PenaltyTaking),
    tackling_fmi: n(t.Tackling),
    technique_fmi: n(t.Technique),
    marking_fmi: n(t.Marking),
    long_throws_fmi: n(t.Longthrows),

    // Mentales
    off_the_ball_fmi: n(m.OffTheBall),
    positioning_fmi: n(m.Positioning),
    aggression_fmi: n(m.Aggression),
    anticipation_fmi: n(m.Anticipation),
    bravery_fmi: n(m.Bravery),
    composure_fmi: n(m.Composure),
    concentration_fmi: n(m.Concentration),
    decisions_fmi: n(m.Decisions),
    determination_fmi: n(m.Determination),
    flair_fmi: n(m.Flair),
    leadership_fmi: n(m.Leadership),
    team_work_fmi: n(m.Teamwork),
    vision_fmi: n(m.Vision),
    work_rate_fmi: n(m.Workrate),

    // Físicos
    acceleration_fmi: n(p.Acceleration),
    agility_fmi: n(p.Agility),
    balance_fmi: n(p.Balance),
    jumping_fmi: n(p.Jumping),
    natural_fitness_fmi: n(p.NaturalFitness),
    pace_fmi: n(p.Pace),
    stamina_fmi: n(p.Stamina),
    strength_fmi: n(p.Strength),
    left_foot_fmi: n(p.LeftFoot),
    right_foot_fmi: n(p.RightFoot),

    // Portero
    aerial_ability_fmi: n(g.AerialAbility),
    command_of_area_fmi: n(g.CommandOfArea),
    communication_fmi: n(g.Communication),
    eccentricity_fmi: n(g.Eccentricity),
    handling_fmi: n(g.Handling),
    kicking_fmi: n(g.Kicking),
    one_on_ones_fmi: n(g.OneOnOnes),
    tendency_to_punch_fmi: n(g.TendencyToPunch),
    reflexes_fmi: n(g.Reflexes),
    rushing_out_fmi: n(g.RushingOut),
    throwing_fmi: n(g.Throwing),

    // Ocultos
    consistency_fmi: n(h.Consistency),
    dirtiness_fmi: n(h.Dirtiness),
    important_matches_fmi: n(h.ImportantMatches),
    injury_proness_fmi: n(h.InjuryProness),
    versality_fmi: n(h.Versatility),

    // Personalidad
    adaptability_fmi: n(pe.Adaptability),
    ambition_fmi: n(pe.Ambition),
    loyalty_fmi: n(pe.Loyalty),
    pressure_fmi: n(pe.Pressure),
    professional_fmi: n(pe.Professional),
    sportsmanship_fmi: n(pe.Sportsmanship),
    temperament_fmi: n(pe.Temperament),
    controversy_fmi: n(pe.Controversy),
  }

  // Posiciones (Positions → *_fmi)
  const positions = d.Positions ?? {}
  for (const [jsonKey, col] of Object.entries(POSITION_MAP)) {
    data[col] = n(positions[jsonKey])
  }

  return data
}

function sendSSE(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
}

interface ParsedEntry {
  filename: string
  data: FMIPlayerData
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado. Debes iniciar sesión.' }, { status: 401 })
    }
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden importar datos.' },
        { status: 403 }
      )
    }

    // 📦 LEER ARCHIVO (ZIP o JSON)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const maxFilesParam = formData.get('maxFiles') as string | null
    const maxFiles = maxFilesParam ? parseInt(maxFilesParam) : null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo.' }, { status: 400 })
    }
    if (file.size > MAX_ZIP_SIZE) {
      return NextResponse.json({ error: 'El archivo supera el límite de 200 MB.' }, { status: 400 })
    }

    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
    const parsed: ParsedEntry[] = []
    const parseErrors: string[] = []

    if (ext === '.zip') {
      const zip = await JSZip.loadAsync(await file.arrayBuffer()).catch(() => null)
      if (!zip) {
        return NextResponse.json({ error: 'Archivo ZIP inválido o corrupto.' }, { status: 400 })
      }
      const jsonEntries = Object.values(zip.files).filter(
        (e) =>
          !e.dir &&
          !e.name.startsWith('__MACOSX/') &&
          !e.name.split('/').pop()!.startsWith('.') &&
          e.name.toLowerCase().endsWith('.json')
      )
      for (const entry of jsonEntries) {
        const filename = entry.name.split('/').pop() || entry.name
        try {
          const text = await entry.async('string')
          const obj = JSON.parse(text) as FMIPlayerData
          parsed.push({ filename, data: obj })
        } catch {
          parseErrors.push(`No se pudo parsear ${filename}`)
        }
      }
    } else if (ext === '.json') {
      try {
        const obj = JSON.parse(await file.text())
        const arr = Array.isArray(obj) ? obj : [obj]
        arr.forEach((o, i) => parsed.push({ filename: `${file.name}#${i}`, data: o }))
      } catch {
        return NextResponse.json({ error: 'El archivo JSON no es válido.' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'El archivo debe ser .zip o .json.' }, { status: 400 })
    }

    const entries = maxFiles && maxFiles > 0 ? parsed.slice(0, maxFiles) : parsed
    const totalInFile = parsed.length

    const stream = new ReadableStream({
      async start(controller) {
        const results = {
          success: 0,
          failed: 0,
          notFound: 0,
          errors: [] as string[],
        }

        try {
          sendSSE(controller, {
            type: 'start',
            total: entries.length,
            message: `📥 Iniciando importación FMI de ${entries.length} archivos${
              maxFiles && maxFiles < totalInFile ? ` (límite ${maxFiles} de ${totalInFile})` : ''
            }...`,
          })

          if (parseErrors.length > 0) {
            sendSSE(controller, {
              type: 'warning',
              message: `⚠️ ${parseErrors.length} archivos no se pudieron parsear y se omiten.`,
            })
          }

          // 🚀 Precargar mapa id_fmi → { id_player, height }
          sendSSE(controller, { type: 'info', message: '🔍 Cargando jugadores existentes (id_fmi)...' })
          const players = await prisma.jugador.findMany({
            where: { id_fmi: { not: null } },
            select: { id_player: true, id_fmi: true, height: true },
          })
          const fmiMap = new Map<string, { id_player: number; height: number | null }>()
          for (const p of players) {
            if (p.id_fmi) fmiMap.set(String(p.id_fmi).trim(), { id_player: p.id_player, height: p.height })
          }
          sendSSE(controller, { type: 'info', message: `✅ ${fmiMap.size} jugadores con id_fmi en BD` })

          const heightUpdates: Array<[number, number]> = []

          // 🔄 Procesar en lotes
          const BATCH = 100
          for (let i = 0; i < entries.length; i += BATCH) {
            const batch = entries.slice(i, i + BATCH)

            for (let j = 0; j < batch.length; j++) {
              const { filename, data } = batch[j]!
              // id_fmi: campo Id del JSON, o nombre del archivo como fallback
              const fmiFromFile = filename.replace(/\.json$/i, '').trim()
              const idFmi = data.Id != null ? String(data.Id).trim() : fmiFromFile

              const match = fmiMap.get(idFmi)
              if (!match) {
                results.notFound++
                results.failed++
                if (results.errors.length < 100) {
                  results.errors.push(`id_fmi ${idFmi} (${filename}) no encontrado en BD`)
                }
                continue
              }

              try {
                const attrData = buildAtributosData(data)
                await prisma.atributos.upsert({
                  where: { id_player: match.id_player },
                  update: attrData,
                  create: { id_player: match.id_player, ...attrData },
                })

                // Altura: rellenar solo si falta en el jugador (no pisar dato del Excel)
                if (match.height == null && n(data.Height) != null) {
                  heightUpdates.push([match.id_player, n(data.Height)!])
                }

                results.success++
              } catch (err) {
                results.failed++
                if (results.errors.length < 100) {
                  results.errors.push(
                    `Error en ${filename}: ${err instanceof Error ? err.message : 'desconocido'}`
                  )
                }
              }
            }

            const current = Math.min(i + BATCH, entries.length)
            sendSSE(controller, {
              type: 'progress',
              current,
              total: entries.length,
              percentage: Math.round((current / entries.length) * 100),
            })
          }

          // 📏 Rellenar alturas faltantes (bulk)
          if (heightUpdates.length > 0) {
            sendSSE(controller, { type: 'info', message: `📏 Rellenando altura en ${heightUpdates.length} jugadores...` })
            await bulkUpdateNumeric('jugadores', 'height', 'double precision', heightUpdates)
          }

          // 🧮 Recalcular TODOS los derivados FMI (niveles, roles, estilos,
          // tendencias, total_fmi_pts y total_fmi_pts_norm) para que game-flow
          // y positioning no queden obsoletos tras el import.
          sendSSE(controller, { type: 'info', message: '🧮 Recalculando derivados FMI (roles, estilos, tendencias, norm)...' })
          const { updated: derivativesUpdated } = await recalcFmiDerivatives((e) => {
            if (e.type === 'phase') {
              sendSSE(controller, { type: 'info', message: e.message })
            }
          })
          sendSSE(controller, { type: 'success', message: `✅ Derivados FMI recalculados en ${derivativesUpdated} jugadores` })

          const message = `Importación FMI completada: ${results.success} importados, ${results.notFound} sin jugador, ${results.failed - results.notFound} con error`
          sendSSE(controller, { type: 'complete', message, results })

          console.log('✅ FMI Import completed:', {
            totalProcessed: entries.length,
            ...results,
            importedBy: userId,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error('❌ Error in FMI import:', error)
          sendSSE(controller, {
            type: 'error',
            message: `❌ Error interno: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('❌ Error in FMI import setup:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor durante la importación.' },
      { status: 500 }
    )
  }
}

/** UPDATE masivo `tabla.columna` desde (VALUES ...) por id_player, en lotes. */
async function bulkUpdateNumeric(
  table: 'jugadores' | 'atributos',
  column: string,
  cast: 'double precision' | 'integer',
  pairs: Array<[number, number]>
): Promise<void> {
  const chunk = 1000
  for (let i = 0; i < pairs.length; i += chunk) {
    const slice = pairs.slice(i, i + chunk)
    const tuples = Prisma.join(
      slice.map(([id, val]) => Prisma.sql`(${id}::int, ${val}::${Prisma.raw(cast)})`)
    )
    await prisma.$executeRaw`
      UPDATE ${Prisma.raw(table)} AS j
      SET ${Prisma.raw(column)} = v.val
      FROM (VALUES ${tuples}) AS v(id, val)
      WHERE j.id_player = v.id
    `
  }
}
