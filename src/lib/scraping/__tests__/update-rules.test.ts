import { describe, it, expect } from 'vitest'

import {
  shouldUpdateDateOfBirth,
  shouldUpdatePosition,
  shouldUpdateAgency,
  shouldUpdateHeight,
  correctNationality,
  correctNationalTier,
  applyScrapedDataRules,
  isLikelySamePlayer,
  type PlayerSnapshot,
} from '../update-rules'

const emptyPlayer: PlayerSnapshot = {
  date_of_birth: null,
  team_name: null,
  team_country: null,
  team_loan_from: null,
  position_player: null,
  height: null,
  agency: null,
}

describe('shouldUpdateDateOfBirth', () => {
  it('actualiza si no hay fecha existente', () => {
    expect(shouldUpdateDateOfBirth(null, new Date(2000, 0, 1))).toBe(true)
  })

  it('no sobrescribe una fecha real con la genérica 01/01', () => {
    expect(
      shouldUpdateDateOfBirth(new Date(2000, 5, 15), new Date(2000, 0, 1))
    ).toBe(false)
  })

  it('sobrescribe la genérica 01/01 con una fecha real', () => {
    expect(
      shouldUpdateDateOfBirth(new Date(2000, 0, 1), new Date(2000, 5, 15))
    ).toBe(true)
  })
})

describe('shouldUpdatePosition', () => {
  it('limpia el prefijo genérico en inglés', () => {
    const r = shouldUpdatePosition(null, 'Defender - Centre-Back')
    expect(r.shouldUpdate).toBe(true)
    expect(r.finalPosition).toBe('Centre-Back')
  })

  it('limpia el prefijo genérico en español (páginas .es)', () => {
    const r = shouldUpdatePosition(null, 'Delantero - Extremo derecho')
    expect(r.shouldUpdate).toBe(true)
    expect(r.finalPosition).toBe('Extremo derecho')
  })

  it('no sobrescribe una posición específica con un valor genérico', () => {
    expect(shouldUpdatePosition('Extremo derecho', 'Delantero').shouldUpdate).toBe(false)
    expect(shouldUpdatePosition('Centre-Back', 'Defender').shouldUpdate).toBe(false)
  })

  it('sí escribe un genérico si la celda está vacía', () => {
    const r = shouldUpdatePosition(null, 'Delantero')
    expect(r.shouldUpdate).toBe(true)
    expect(r.finalPosition).toBe('Delantero')
  })
})

describe('shouldUpdateAgency', () => {
  it('ignora valores genéricos', () => {
    expect(shouldUpdateAgency('Real Agency', 'No Agent').shouldUpdate).toBe(false)
    expect(shouldUpdateAgency(null, 'Relatives').shouldUpdate).toBe(false)
  })

  it('limpia puntos suspensivos al final', () => {
    const r = shouldUpdateAgency(null, 'Gestifute...')
    expect(r.shouldUpdate).toBe(true)
    expect(r.finalAgency).toBe('Gestifute')
  })
})

describe('shouldUpdateHeight', () => {
  it('rechaza alturas fuera de rango', () => {
    expect(shouldUpdateHeight(null, 20).shouldUpdate).toBe(false)
    expect(shouldUpdateHeight(null, 250).shouldUpdate).toBe(false)
  })

  it('acepta alturas válidas', () => {
    expect(shouldUpdateHeight(null, 183).shouldUpdate).toBe(true)
  })
})

describe('correcciones de nombres', () => {
  it('corrige nacionalidades', () => {
    expect(correctNationality("Cote d'Ivoire")).toBe('Ivory Coast')
    expect(correctNationality('España')).toBe('España')
  })

  it('corrige categorías internacionales', () => {
    expect(correctNationalTier('Türkiye U19')).toBe('Turkey U19')
    expect(correctNationalTier('USA')).toBe('United States')
  })
})

describe('isLikelySamePlayer (salvaguarda de homónimos del fallback)', () => {
  it('acepta si no hay datos para comparar', () => {
    expect(isLikelySamePlayer(null, new Date(2000, 5, 15))).toBe(true)
    expect(isLikelySamePlayer(new Date(2000, 5, 15), undefined)).toBe(true)
  })

  it('acepta si la fecha existente es la genérica 01/01', () => {
    expect(isLikelySamePlayer(new Date(2000, 0, 1), new Date(1997, 10, 16))).toBe(true)
  })

  it('acepta si las fechas coinciden', () => {
    expect(isLikelySamePlayer(new Date(2007, 6, 13), new Date(2007, 6, 13))).toBe(true)
  })

  it('rechaza si las fechas no coinciden (posible homónimo)', () => {
    expect(isLikelySamePlayer(new Date(2007, 6, 13), new Date(2004, 4, 4))).toBe(false)
  })
})

describe('applyScrapedDataRules', () => {
  it('aplica todas las reglas y devuelve solo campos válidos', () => {
    const player: PlayerSnapshot = {
      ...emptyPlayer,
      date_of_birth: new Date(2007, 6, 13),
      position_player: 'Extremo derecho',
      agency: 'Gestifute',
    }

    const result = applyScrapedDataRules(player, {
      date_of_birth: new Date(2007, 0, 1), // genérica → fuera
      position_player: 'Delantero', // genérica con celda llena → fuera
      agency: 'No Agent', // genérica → fuera
      height: 183, // válida → se queda
      nationality_1: "Cote d'Ivoire", // se corrige
    })

    expect(result.date_of_birth).toBeUndefined()
    expect(result.position_player).toBeUndefined()
    expect(result.agency).toBeUndefined()
    expect(result.height).toBe(183)
    expect(result.nationality_1).toBe('Ivory Coast')
  })

  it('limpia el prefijo de posición cuando la celda está vacía', () => {
    const result = applyScrapedDataRules(emptyPlayer, {
      position_player: 'Delantero - Extremo derecho',
    })
    expect(result.position_player).toBe('Extremo derecho')
  })

  it('no muta el objeto original', () => {
    const scraped = { agency: 'No Agent' }
    applyScrapedDataRules(emptyPlayer, scraped)
    expect(scraped.agency).toBe('No Agent')
  })
})
