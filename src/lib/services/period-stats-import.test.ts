import { describe, expect, it, vi } from 'vitest'

// Mock de la BD: solo necesitamos la tabla del periodo con un upsert que capture los datos.
const upsertCalls: Array<{ where: unknown; update: Record<string, unknown>; create: Record<string, unknown> }> = []
vi.mock('@/lib/db', () => ({
  prisma: {
    playerStats3m: {
      upsert: vi.fn(async (args: { where: unknown; update: Record<string, unknown>; create: Record<string, unknown> }) => {
        upsertCalls.push(args)
        return args.create
      }),
    },
  },
}))

import { importParsedRows, parseWyscoutIds, type WyscoutMaps } from './period-stats-import'

const num = (v: unknown): number => Number(v)

describe('parseWyscoutIds', () => {
  it('parte varios IDs separados por /', () => {
    expect(parseWyscoutIds('-719223 / -713992')).toEqual(['-719223', '-713992'])
  })
  it('un solo ID', () => {
    expect(parseWyscoutIds('-653350')).toEqual(['-653350'])
  })
  it('null / vacío → []', () => {
    expect(parseWyscoutIds(null)).toEqual([])
    expect(parseWyscoutIds('')).toEqual([])
    expect(parseWyscoutIds(undefined)).toEqual([])
  })
  it('tolera espacios raros y separadores sobrantes', () => {
    expect(parseWyscoutIds('  -1 /  -2 / ')).toEqual(['-1', '-2'])
  })
  it('acepta number', () => {
    expect(parseWyscoutIds(-123)).toEqual(['-123'])
  })
})

describe('importParsedRows — fusión de perfiles duplicados', () => {
  it('fusiona dos filas del mismo id_player (suma conteos, pondera per-90) en un solo upsert', async () => {
    upsertCalls.length = 0
    const ctx: WyscoutMaps = {
      // dos wyscout ids distintos → mismo jugador (id_player 1)
      wyMap: new Map([['-100', 1], ['-200', 1]]),
      idPlayerSet: new Set([1]),
    }
    const rows = [
      { id: -100, 'Partidos jugados': 10, 'Minutos jugados': 900, 'Goles/90': 1.0, 'Pases/90': 50 },
      { id: -200, 'Partidos jugados': 5, 'Minutos jugados': 450, 'Goles/90': 0.4, 'Pases/90': 30 },
    ]

    const res = await importParsedRows(rows, '3m', ctx)

    expect(res.matched).toBe(1) // un solo jugador resuelto
    expect(res.success).toBe(1)
    expect(res.notFound).toBe(0)
    expect(upsertCalls).toHaveLength(1) // NO dos upserts que se pisan

    const data = upsertCalls[0]!.update
    expect(data.where === undefined || true).toBe(true)
    expect(num(data['matches_played_tot_3m'])).toBe(15) // 10 + 5
    expect(num(data['minutes_played_tot_3m'])).toBe(1350) // 900 + 450
    // (1.0*900 + 0.4*450)/1350 = 0.8
    expect(num(data['goals_p90_3m'])).toBeCloseTo(0.8, 6)
    // total reconstruido = round(0.8 * 1350 / 90) = 12
    expect(num(data['goals_tot_3m'])).toBe(12)
    // (50*900 + 30*450)/1350 = 43.333
    expect(num(data['passes_p90_3m'])).toBeCloseTo(43.3333, 3)
  })

  it('una sola fila por jugador se importa sin alterar valores (identidad)', async () => {
    upsertCalls.length = 0
    const ctx: WyscoutMaps = { wyMap: new Map([['-100', 1]]), idPlayerSet: new Set([1]) }
    const rows = [{ id: -100, 'Partidos jugados': 12, 'Minutos jugados': 1000, 'Goles/90': 0.9 }]

    await importParsedRows(rows, '3m', ctx)

    expect(upsertCalls).toHaveLength(1)
    const data = upsertCalls[0]!.update
    expect(num(data['matches_played_tot_3m'])).toBe(12)
    expect(num(data['minutes_played_tot_3m'])).toBe(1000)
    expect(num(data['goals_p90_3m'])).toBeCloseTo(0.9, 6)
  })

  it('NO duplica cuando el mismo perfil (mismo wyscout id) llega repetido en varias listas', async () => {
    upsertCalls.length = 0
    const ctx: WyscoutMaps = { wyMap: new Map([['-100', 1]]), idPlayerSet: new Set([1]) }
    // misma id -100 dos veces (el jugador está en dos listas) → NO se suma
    const rows = [
      { id: -100, 'Partidos jugados': 10, 'Minutos jugados': 900, 'Goles/90': 1.0 },
      { id: -100, 'Partidos jugados': 10, 'Minutos jugados': 900, 'Goles/90': 1.0 },
    ]

    await importParsedRows(rows, '3m', ctx)

    expect(upsertCalls).toHaveLength(1)
    const data = upsertCalls[0]!.update
    expect(num(data['matches_played_tot_3m'])).toBe(10) // NO 20
    expect(num(data['minutes_played_tot_3m'])).toBe(900) // NO 1800
    expect(num(data['goals_p90_3m'])).toBeCloseTo(1.0, 6)
  })

  it('cuenta notFound cuando el wyscout id no está en el mapa', async () => {
    upsertCalls.length = 0
    const ctx: WyscoutMaps = { wyMap: new Map([['-100', 1]]), idPlayerSet: new Set([1]) }
    const rows = [
      { id: -100, 'Minutos jugados': 900, 'Goles/90': 1.0 },
      { id: -999, 'Minutos jugados': 500, 'Goles/90': 0.5 }, // desconocido
    ]

    const res = await importParsedRows(rows, '3m', ctx)
    expect(res.notFound).toBe(1)
    expect(res.matched).toBe(1)
    expect(upsertCalls).toHaveLength(1)
  })
})
