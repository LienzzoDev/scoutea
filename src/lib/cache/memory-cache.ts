/**
 * 💾 IN-MEMORY CACHE SERVICE
 *
 * ✅ PROPÓSITO: Caché en memoria para reducir queries a la base de datos
 * ✅ BENEFICIO: 10-100x más rápido que queries a BD para datos frecuentes
 * ✅ USO: Para filtros, listas, y datos que no cambian frecuentemente
 *
 * NOTA: Este es un caché simple en memoria. Para producción con múltiples
 * instancias, considerar Redis o Memcached.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export class MemoryCacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private hits = 0
  private misses = 0

  // TTL por defecto: 5 minutos
  static readonly TTL = {
    PLAYERS_LIST: 5 * 60 * 1000,      // 5 minutos
    PLAYER_DETAIL: 10 * 60 * 1000,    // 10 minutos
    FILTERS: 15 * 60 * 1000,          // 15 minutos
    RADAR_DATA: 30 * 60 * 1000,       // 30 minutos
    STATS: 60 * 60 * 1000,            // 1 hora
    SCOUTS_LIST: 10 * 60 * 1000,      // 10 minutos
    TEAMS_LIST: 30 * 60 * 1000,       // 30 minutos
  }

  /**
   * Obtener valor del caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.misses++
      return null
    }

    // Verificar si expiró
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++
    return entry.data as T
  }

  /**
   * Guardar valor en caché
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || MemoryCacheService.TTL.PLAYERS_LIST)

    this.cache.set(key, {
      data,
      expiresAt,
    })
  }

  /**
   * Invalidar (borrar) una clave específica
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidar todas las claves que coincidan con un patrón
   */
  invalidatePattern(pattern: string): number {
    let count = 0
    const regex = new RegExp(pattern)

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * Limpiar entradas expiradas
   */
  cleanExpired(): number {
    let count = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    const total = this.hits + this.misses
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
      totalRequests: total,
    }
  }
}

// Singleton instance
export const cache = new MemoryCacheService()

/**
 * 🔄 WRAPPER PARA QUERIES CON CACHÉ
 *
 * Envuelve una función que hace query a la BD con caché automático
 *
 * @example
 * const players = await cachedQuery(
 *   'players:list',
 *   () => prisma.jugador.findMany(),
 *   MemoryCacheService.TTL.PLAYERS_LIST
 * )
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Intentar obtener de caché
  const cached = cache.get<T>(key)
  if (cached !== null) {
    console.log(`✅ Cache HIT: ${key}`)
    return cached
  }

  // Si no está en caché, ejecutar query
  console.log(`❌ Cache MISS: ${key}`)
  const result = await queryFn()

  // Guardar en caché
  cache.set(key, result, ttl)

  return result
}

/**
 * 🔄 DECORATOR PARA MÉTODOS CON CACHÉ
 *
 * @example
 * class PlayerService {
 *   @Cached('players:all', MemoryCacheService.TTL.PLAYERS_LIST)
 *   static async getAllPlayers() {
 *     return prisma.jugador.findMany()
 *   }
 * }
 */
export function Cached(keyPrefix: string, ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Generar clave única basada en argumentos
      const argsKey = args.length > 0 ? ':' + JSON.stringify(args) : ''
      const cacheKey = `${keyPrefix}${argsKey}`

      return cachedQuery(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      )
    }

    return descriptor
  }
}

// Limpiar caché expirado cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cache.cleanExpired()
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`)
    }
  }, 5 * 60 * 1000)
}
