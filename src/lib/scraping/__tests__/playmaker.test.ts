import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, it, expect } from 'vitest'

import {
  parsePlaymakerPlayerHtml,
  parseContractYearMonth,
  isCloudflareChallenge,
  extractFirstPlayerLink,
  decodeHtmlResponse,
  MIRRORS,
} from '../playmaker'

// Fixture legacy (playmakerstats 2023, diseño entity_bio) en ISO-8859-1
const legacyFixtureBuffer = readFileSync(
  join(__dirname, 'fixtures', 'playmakerstats-player.html')
)
const legacyFixture = new TextDecoder('iso-8859-1').decode(legacyFixtureBuffer)

// Fixture actual (ceroacero.es 2026, diseño card-data) en UTF-8
const ceroaceroFixture = readFileSync(
  join(__dirname, 'fixtures', 'ceroacero-player-es.html'),
  'utf-8'
)

// Fixture de resultados de búsqueda de ceroacero.es
const ceroaceroSearchFixture = readFileSync(
  join(__dirname, 'fixtures', 'ceroacero-search-es.html'),
  'utf-8'
)

describe('parsePlaymakerPlayerHtml — diseño nuevo (fixture real de ceroacero.es)', () => {
  const data = parsePlaymakerPlayerHtml(ceroaceroFixture)

  it('extrae la fecha de nacimiento (ISO con edad entre paréntesis)', () => {
    expect(data.date_of_birth).toBeInstanceOf(Date)
    const date = data.date_of_birth as Date
    expect(date.getFullYear()).toBe(2007)
    expect(date.getMonth()).toBe(6) // julio
    expect(date.getDate()).toBe(13)
  })

  it('extrae la nacionalidad', () => {
    expect(data.nationality_1).toBe('España')
  })

  it('extrae la posición (misma nomenclatura que Transfermarkt ES)', () => {
    expect(data.position_player).toBe('Extremo derecho')
  })

  it('extrae el pie', () => {
    expect(data.foot).toBe('Izquierdo')
  })

  it('extrae la altura de "Altura / Peso" ("178 cm / 70 kg")', () => {
    expect(data.height).toBe(178)
  })

  it('extrae el club actual', () => {
    expect(data.team_name).toBe('FC Barcelona')
  })

  it('extrae el fin de contrato ("2031/06" → último día del mes)', () => {
    const date = data.contract_end as Date
    expect(date).toBeInstanceOf(Date)
    expect(date.getFullYear()).toBe(2031)
    expect(date.getMonth()).toBe(5) // junio
    expect(date.getDate()).toBe(30)
  })
})

describe('parsePlaymakerPlayerHtml — diseño legacy (fixture real de playmakerstats.com)', () => {
  const data = parsePlaymakerPlayerHtml(legacyFixture)

  it('extrae la fecha de nacimiento del campo Born/Age', () => {
    expect(data.date_of_birth).toBeInstanceOf(Date)
    const date = data.date_of_birth as Date
    expect(date.getFullYear()).toBe(1997)
    expect(date.getMonth()).toBe(10) // noviembre
    expect(date.getDate()).toBe(16)
  })

  it('extrae la nacionalidad', () => {
    expect(data.nationality_1).toBe('Brazil')
  })

  it('extrae la posición', () => {
    expect(data.position_player).toBe('Ala')
  })

  it('extrae la altura en cm ("184 cm")', () => {
    expect(data.height).toBe(184)
  })

  it('extrae el club actual con los acentos correctos', () => {
    expect(data.team_name).toBe('São José Futsal')
  })
})

describe('parseContractYearMonth', () => {
  it('parsea "2031/06" al último día del mes', () => {
    const d = parseContractYearMonth('2031/06')
    expect(d?.getFullYear()).toBe(2031)
    expect(d?.getMonth()).toBe(5)
    expect(d?.getDate()).toBe(30)
  })

  it('parsea meses de 31 días y diciembre', () => {
    expect(parseContractYearMonth('2030/12')?.getDate()).toBe(31)
    expect(parseContractYearMonth('2030/1')?.getDate()).toBe(31)
  })

  it('rechaza formatos inválidos', () => {
    expect(parseContractYearMonth('2031/13')).toBe(null)
    expect(parseContractYearMonth('junio 2031')).toBe(null)
  })
})

describe('decodeHtmlResponse', () => {
  it('decodifica ISO-8859-1 cuando la decodificación UTF-8 produce caracteres de reemplazo', async () => {
    const html = await decodeHtmlResponse(
      legacyFixtureBuffer.buffer.slice(
        legacyFixtureBuffer.byteOffset,
        legacyFixtureBuffer.byteOffset + legacyFixtureBuffer.byteLength
      ) as ArrayBuffer,
      'text/html'
    )
    expect(html).toContain('São José Futsal')
  })

  it('respeta el charset declarado en Content-Type', async () => {
    const bytes = new TextEncoder().encode('hola').buffer as ArrayBuffer
    const html = await decodeHtmlResponse(bytes, 'text/html; charset=ISO-8859-1')
    expect(html).toBe('hola')
  })
})

describe('isCloudflareChallenge', () => {
  it('detecta el challenge "Just a moment"', () => {
    expect(isCloudflareChallenge('<title>Just a moment...</title>')).toBe(true)
    expect(isCloudflareChallenge('script src="https://challenges.cloudflare.com/x.js"')).toBe(true)
  })

  it('no marca HTML normal', () => {
    expect(isCloudflareChallenge(legacyFixture)).toBe(false)
    expect(isCloudflareChallenge(ceroaceroFixture)).toBe(false)
  })
})

describe('extractFirstPlayerLink', () => {
  it('extrae el link de jugador de una búsqueda real de ceroacero.es (sin ?search=1)', () => {
    const link = extractFirstPlayerLink(ceroaceroSearchFixture, MIRRORS[0])
    expect(link).toBe('https://www.ceroacero.es/jugador/lamine-yamal/1013243')
  })

  it('extrae links estilo playmakerstats (player.php?id=)', () => {
    const searchHtml = `
      <div class="result">
        <a href="/equipa.php?id=100">Un equipo</a>
        <a href="/player.php?id=1043142">Guilherme</a>
      </div>`
    expect(extractFirstPlayerLink(searchHtml, MIRRORS[1])).toBe(
      'https://www.playmakerstats.com/player.php?id=1043142'
    )
  })

  it('devuelve null si no hay jugadores', () => {
    expect(extractFirstPlayerLink('<div>Sin resultados</div>')).toBe(null)
  })
})
