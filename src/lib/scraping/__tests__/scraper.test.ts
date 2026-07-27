import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, it, expect } from 'vitest'

import { parsePlayerHtml, parseMarketValue, parseDateString } from '../scraper'

const tmFixture = readFileSync(
  join(__dirname, 'fixtures', 'transfermarkt-player-es.html'),
  'utf-8'
)

describe('parsePlayerHtml (fixture real de transfermarkt.es)', () => {
  const data = parsePlayerHtml(tmFixture, 'https://www.transfermarkt.es/lamine-yamal/profil/spieler/937958')

  it('extrae la fecha de nacimiento (formato DD/MM/YYYY español)', () => {
    expect(data.date_of_birth).toBeInstanceOf(Date)
    const date = data.date_of_birth as Date
    expect(date.getFullYear()).toBe(2007)
    expect(date.getMonth()).toBe(6) // julio
    expect(date.getDate()).toBe(13)
  })

  it('extrae el equipo actual', () => {
    expect(data.team_name).toBe('FC Barcelona')
  })

  it('extrae la posición desde el data-header (sin prefijo genérico)', () => {
    expect(data.position_player).toBe('Extremo derecho')
  })

  it('extrae el pie dominante (label español "Pie:")', () => {
    expect(data.foot).toBe('Izquierdo')
  })

  it('extrae la altura en cm desde itemprop=height', () => {
    expect(data.height).toBe(183)
  })

  it('extrae la nacionalidad (label español "Nacionalidad:")', () => {
    expect(data.nationality_1).toBe('España')
  })

  it('extrae la selección nacional (label real "Selección:")', () => {
    expect(data.national_tier).toBe('España')
  })

  it('extrae la agencia del bloque "Agente:" (Jugador no tiene columna advisor)', () => {
    expect(data.agency).toBe('Gestifute')
    expect(data.advisor).toBeUndefined()
  })

  it('extrae la URL del advisor (link /berater/) con el dominio de la URL fuente', () => {
    expect(String(data.url_trfm_advisor)).toContain('/berater/')
    expect(String(data.url_trfm_advisor)).toMatch(/^https:\/\/www\.transfermarkt\.es/)
  })

  it('extrae el fin de contrato', () => {
    const date = data.contract_end as Date
    expect(date).toBeInstanceOf(Date)
    expect(date.getFullYear()).toBe(2031)
    expect(date.getMonth()).toBe(5) // junio
    expect(date.getDate()).toBe(30)
  })

  it('extrae el valor de mercado del header ("220,00 mill. €" → 220M)', () => {
    expect(data.player_trfm_value).toBe(220_000_000)
  })
})

describe('parseMarketValue', () => {
  it('formato español con millones', () => {
    expect(parseMarketValue('220,00 mill. €')).toBe(220_000_000)
    expect(parseMarketValue('1,50 mill. €')).toBe(1_500_000)
  })

  it('formato español con miles', () => {
    expect(parseMarketValue('800 mil €')).toBe(800_000)
  })

  it('formato inglés', () => {
    expect(parseMarketValue('€220.00m')).toBe(220_000_000)
    expect(parseMarketValue('€800k')).toBe(800_000)
    expect(parseMarketValue('€1.10bn')).toBe(1_100_000_000)
  })

  it('número plano con separadores de miles', () => {
    expect(parseMarketValue('1.500.000')).toBe(1_500_000)
  })

  it('texto sin valor', () => {
    expect(parseMarketValue('sin datos')).toBe(null)
  })
})

describe('parseDateString', () => {
  it('DD/MM/YYYY', () => {
    const d = parseDateString('13/07/2007')
    expect(d?.getFullYear()).toBe(2007)
    expect(d?.getMonth()).toBe(6)
    expect(d?.getDate()).toBe(13)
  })

  it('formato inglés "Jul 13, 2007"', () => {
    const d = parseDateString('Jul 13, 2007')
    expect(d?.getFullYear()).toBe(2007)
    expect(d?.getMonth()).toBe(6)
    expect(d?.getDate()).toBe(13)
  })

  it('formato español "13 de julio de 2007"', () => {
    const d = parseDateString('13 de julio de 2007')
    expect(d?.getFullYear()).toBe(2007)
    expect(d?.getMonth()).toBe(6)
  })

  it('formato ISO "2007-07-13" (PlaymakerStats)', () => {
    const d = parseDateString('2007-07-13')
    expect(d?.getFullYear()).toBe(2007)
    expect(d?.getMonth()).toBe(6)
    expect(d?.getDate()).toBe(13)
  })

  it('texto inválido devuelve null', () => {
    expect(parseDateString('no es una fecha')).toBe(null)
    expect(parseDateString('-')).toBe(null)
  })
})
