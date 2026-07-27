import { describe, it, expect, vi } from 'vitest'

import { RateLimiter } from '../rate-limiter'

// Delays mínimos para que los tests no esperen backoffs reales
const fastConfig = {
  maxRetriesPerRequest: 3,
  baseRetryDelay: 1,
  maxRetryDelay: 2,
  errorThresholdPercent: 20,
}

describe('RateLimiter', () => {
  it('devuelve el resultado en caso de éxito', async () => {
    const limiter = new RateLimiter(fastConfig)
    const result = await limiter.executeWithRetry(async () => 'ok')
    expect(result.success).toBe(true)
    expect(result.data).toBe('ok')
    expect(result.retries).toBe(0)
  })

  it('reintenta errores transitorios hasta el máximo configurado', async () => {
    const limiter = new RateLimiter(fastConfig)
    const fn = vi.fn().mockRejectedValue(new Error('HTTP Error 500: Internal Server Error'))
    const result = await limiter.executeWithRetry(fn)
    expect(result.success).toBe(false)
    expect(fn).toHaveBeenCalledTimes(4) // 1 intento + 3 reintentos
  })

  it('NO reintenta errores permanentes (404)', async () => {
    const limiter = new RateLimiter(fastConfig)
    const fn = vi.fn().mockRejectedValue(new Error('HTTP Error 404: Not Found'))
    const result = await limiter.executeWithRetry(fn)
    expect(result.success).toBe(false)
    expect(result.error).toContain('404')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('con 5 rate limits consecutivos devuelve fallo SIN lanzar excepción', async () => {
    const limiter = new RateLimiter(fastConfig)
    const fn = vi.fn().mockRejectedValue(new Error('HTTP Error 429: Too Many Requests'))

    // Primera llamada: 4 intentos rate-limited (consecutivos = 4)
    const first = await limiter.executeWithRetry(fn)
    expect(first.success).toBe(false)
    expect(first.wasRateLimited).toBe(true)

    // Segunda llamada: el primer intento llega a 5 consecutivos.
    // Antes esto LANZABA y el job acababa en "failed"; ahora devuelve fallo
    // para que el caller pueda pausar el job.
    const second = await limiter.executeWithRetry(fn)
    expect(second.success).toBe(false)
    expect(second.wasRateLimited).toBe(true)

    expect(limiter.getConsecutiveRateLimits()).toBeGreaterThanOrEqual(5)
  })

  it('un éxito resetea el contador de rate limits consecutivos', async () => {
    const limiter = new RateLimiter(fastConfig)
    const failing = vi.fn().mockRejectedValue(new Error('HTTP Error 429: Too Many Requests'))
    await limiter.executeWithRetry(failing)
    expect(limiter.getConsecutiveRateLimits()).toBeGreaterThan(0)

    await limiter.executeWithRetry(async () => 'ok')
    expect(limiter.getConsecutiveRateLimits()).toBe(0)
  })
})
