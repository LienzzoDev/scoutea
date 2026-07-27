import { describe, expect, it } from 'vitest'

import { mergeRawStatsRows } from './stats-merge'

/**
 * Filas "crudas" = las que produce XLSX.sheet_to_json del export "gino" (claves = cabeceras en
 * español). El merge se prueba a mano contra la matemática esperada.
 */

describe('mergeRawStatsRows', () => {
  it('con una sola fila devuelve la misma fila (identidad, sin tocar valores)', () => {
    const row = { Jugador: 'X', 'Minutos jugados': 500, 'Goles/90': 0.7, id: -123 }
    expect(mergeRawStatsRows([row])).toBe(row)
  })

  it('suma conteos (partidos, minutos, porterías imbatidas)', () => {
    const merged = mergeRawStatsRows([
      { 'Partidos jugados': 10, 'Minutos jugados': 900, 'Porterías imbatidas en los 90': 3 },
      { 'Partidos jugados': 5, 'Minutos jugados': 450, 'Porterías imbatidas en los 90': 2 },
    ])
    expect(merged['Partidos jugados']).toBe(15)
    expect(merged['Minutos jugados']).toBe(1350)
    expect(merged['Porterías imbatidas en los 90']).toBe(5)
  })

  it('promedia per-90 ponderando por minutos', () => {
    const merged = mergeRawStatsRows([
      { 'Minutos jugados': 900, 'Goles/90': 1.0, 'Pases/90': 50, 'Duelos defensivos/90': 5 },
      { 'Minutos jugados': 450, 'Goles/90': 0.4, 'Pases/90': 30, 'Duelos defensivos/90': 3 },
    ])
    // (1.0*900 + 0.4*450)/1350 = 1080/1350 = 0.8
    expect(merged['Goles/90'] as number).toBeCloseTo(0.8, 6)
    // (50*900 + 30*450)/1350 = 58500/1350 = 43.3333
    expect(merged['Pases/90'] as number).toBeCloseTo(43.33333, 4)
    // (5*900 + 3*450)/1350 = 5850/1350 = 4.3333
    expect(merged['Duelos defensivos/90'] as number).toBeCloseTo(4.33333, 4)
  })

  it('recombina porcentajes ponderando por su volumen (per-90 × minutos)', () => {
    const merged = mergeRawStatsRows([
      { 'Minutos jugados': 900, 'Pases/90': 50, 'Precisión pases, %': 80, 'Duelos defensivos/90': 5, 'Duelos defensivos ganados, %': 60 },
      { 'Minutos jugados': 450, 'Pases/90': 30, 'Precisión pases, %': 90, 'Duelos defensivos/90': 3, 'Duelos defensivos ganados, %': 50 },
    ])
    // vol1=50*900=45000, vol2=30*450=13500 → (80*45000+90*13500)/58500 = 4,815,000/58500 = 82.3077
    expect(merged['Precisión pases, %'] as number).toBeCloseTo(82.30769, 4)
    // vol1=5*900=4500, vol2=3*450=1350 → (60*4500+50*1350)/5850 = 337500/5850 = 57.6923
    expect(merged['Duelos defensivos ganados, %'] as number).toBeCloseTo(57.69231, 4)
  })

  it('reconstruye save rate (Paradas, %) desde goles recibidos, sin tiros a puerta', () => {
    const merged = mergeRawStatsRows([
      // conceded=1.0*900/90=10, sot=10/(1-0.75)=40, saves=30
      { 'Minutos jugados': 900, 'Goles recibidos/90': 1.0, 'Paradas, %': 75 },
      // conceded=2.0*450/90=10, sot=10/(1-0.80)=50, saves=40
      { 'Minutos jugados': 450, 'Goles recibidos/90': 2.0, 'Paradas, %': 80 },
    ])
    // saves=70, sot=90 → 70/90 = 77.7778%
    expect(merged['Paradas, %'] as number).toBeCloseTo(77.77778, 4)
  })

  it('save rate = null cuando ningún perfil es portero (sin Paradas, %)', () => {
    const merged = mergeRawStatsRows([
      { 'Minutos jugados': 900, 'Goles/90': 1.0 },
      { 'Minutos jugados': 450, 'Goles/90': 0.4 },
    ])
    expect(merged['Paradas, %']).toBeNull()
  })

  it('Σminutos = 0 → conteos presentes, per-90 y % a null', () => {
    const merged = mergeRawStatsRows([
      { 'Partidos jugados': 0, 'Minutos jugados': 0, 'Goles/90': 5, 'Precisión pases, %': 90, 'Pases/90': 10 },
      { 'Partidos jugados': 0, 'Minutos jugados': 0, 'Goles/90': 3, 'Precisión pases, %': 80, 'Pases/90': 8 },
    ])
    expect(merged['Partidos jugados']).toBe(0)
    expect(merged['Minutos jugados']).toBe(0)
    expect(merged['Goles/90']).toBeNull()
    expect(merged['Precisión pases, %']).toBeNull()
  })

  it('un campo null en un perfil no rompe el ponderado per-90 (cuenta como 0 en ese perfil)', () => {
    const merged = mergeRawStatsRows([
      { 'Minutos jugados': 900, 'Goles/90': 1.0 },
      { 'Minutos jugados': 900, 'Goles/90': null },
    ])
    // (1.0*900 + 0*900)/1800 = 0.5
    expect(merged['Goles/90'] as number).toBeCloseTo(0.5, 6)
  })

  it('per-90 null en TODOS los perfiles → null (no 0)', () => {
    const merged = mergeRawStatsRows([
      { 'Minutos jugados': 900, 'Goles/90': null },
      { 'Minutos jugados': 450, 'Goles/90': null },
    ])
    expect(merged['Goles/90']).toBeNull()
  })

  it('conserva Jugador e id representativos (primer no vacío)', () => {
    const merged = mergeRawStatsRows([
      { Jugador: 'Joaquin', id: -719223, 'Minutos jugados': 900 },
      { Jugador: 'Joaquin', id: -713992, 'Minutos jugados': 450 },
    ])
    expect(merged['Jugador']).toBe('Joaquin')
    expect(merged['id']).toBe(-719223)
  })
})
