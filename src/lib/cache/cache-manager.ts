// 🚀 SISTEMA DE CACHÉ INTELIGENTE
// 🎯 PROPÓSITO: Mejorar performance con caché estratégico y TTL apropiado
// 📊 IMPACTO: Respuestas más rápidas, menos carga en BD

interface CacheEntry<T = any> {
  value: T
  timestamp: number
  ttl: number
  key: string
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
}

export class CacheManager {
  private static instance: CacheManager
  private memoryCache: Map<string, CacheEntry> = new Map()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0
  }

  // 🕐 TTL por tipo de dato (en milisegundos)
  private static readonly TTL = {
    PLAYER_LIST: 5 * 60 * 1000,      // 5 minutos - listas cambian frecuentemente
    PLAYER_DETAILS: 10 * 60 * 1000,  // 10 minutos - detalles cambian menos
    PLAYER_STATS: 30 * 60 * 1000,    // 30 minutos - estadísticas son más estables
    FILTER_OPTIONS: 60 * 60 * 1000,  // 1 hora - opciones de filtros raramente cambian
    SEARCH_RESULTS: 3 * 60 * 1000,   // 3 minutos - resultados de búsqueda
    TEAM_DATA: 15 * 60 * 1000,       // 15 minutos - datos de equipos
    COMPETITION_DATA: 30 * 60 * 1000 // 30 minutos - datos de competiciones
  } as const

  // 🔧 Singleton pattern para instancia única
  static getInstance(): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager()
      // Limpiar caché expirado cada 5 minutos
      setInterval(() => {
        this.instance.cleanExpired()
      }, 5 * 60 * 1000)
    }
    return this.instance
  }

  // 💾 Almacenar valor en caché
  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || CacheManager.TTL.PLAYER_LIST,
      key
    }
    
    this.memoryCache.set(key, entry)
    this.stats.sets++
    this.stats.size = this.memoryCache.size

    // Log para debugging en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Cache SET: ${key} (TTL: ${entry.ttl}ms)`)
    }
  }

  // 📖 Obtener valor del caché
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    
    if (!entry) {
      this.stats.misses++
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ Cache MISS: ${key}`)
      }
      return null
    }

    // ⏰ Verificar si expiró
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key)
      this.stats.misses++
      this.stats.deletes++
      this.stats.size = this.memoryCache.size
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏰ Cache EXPIRED: ${key}`)
      }
      return null
    }

    this.stats.hits++
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Cache HIT: ${key}`)
    }
    
    return entry.value as T
  }

  // 🗑️ Eliminar entrada específica
  delete(key: string): boolean {
    const deleted = this.memoryCache.delete(key)
    if (deleted) {
      this.stats.deletes++
      this.stats.size = this.memoryCache.size
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Cache DELETE: ${key}`)
      }
    }
    return deleted
  }

  // 🧹 Invalidar por patrón
  invalidate(pattern?: string): void {
    if (!pattern) {
      // Limpiar todo el caché
      const size = this.memoryCache.size
      this.memoryCache.clear()
      this.stats.deletes += size
      this.stats.size = 0
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧹 Cache CLEAR ALL (${size} entries)`)
      }
      return
    }

    // Invalidar por patrón
    let deletedCount = 0
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
        deletedCount++
      }
    }
    
    this.stats.deletes += deletedCount
    this.stats.size = this.memoryCache.size
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Cache INVALIDATE pattern "${pattern}" (${deletedCount} entries)`)
    }
  }

  // 🔍 Verificar si existe una clave
  has(key: string): boolean {
    const entry = this.memoryCache.get(key)
    if (!entry) return false
    
    // Verificar si no ha expirado
    return Date.now() - entry.timestamp <= entry.ttl
  }

  // 🧹 Limpiar entradas expiradas
  private cleanExpired(): void {
    let cleanedCount = 0
    const now = Date.now()
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      this.stats.deletes += cleanedCount
      this.stats.size = this.memoryCache.size
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧹 Cache CLEANUP: ${cleanedCount} expired entries`)
      }
    }
  }

  // 📊 Obtener estadísticas del caché
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    }
  }

  // 🔧 Obtener información de todas las entradas (para debugging)
  getEntries(): Array<{ key: string; timestamp: number; ttl: number; expired: boolean }> {
    const now = Date.now()
    return Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      ttl: entry.ttl,
      expired: now - entry.timestamp > entry.ttl
    }))
  }

  // 🎯 Métodos específicos para diferentes tipos de datos

  // 👥 Caché para listas de jugadores
  setPlayerList(key: string, players: any[]): void {
    this.set(`players:list:${key}`, players, CacheManager.TTL.PLAYER_LIST)
  }

  getPlayerList(key: string): any[] | null {
    return this.get(`players:list:${key}`)
  }

  // 👤 Caché para detalles de jugador
  setPlayerDetails(playerId: string, player: any): void {
    this.set(`players:details:${playerId}`, player, CacheManager.TTL.PLAYER_DETAILS)
  }

  getPlayerDetails(playerId: string): any | null {
    return this.get(`players:details:${playerId}`)
  }

  // 📊 Caché para estadísticas
  setPlayerStats(key: string, stats: any): void {
    this.set(`players:stats:${key}`, stats, CacheManager.TTL.PLAYER_STATS)
  }

  getPlayerStats(key: string): any | null {
    return this.get(`players:stats:${key}`)
  }

  // 🔍 Caché para opciones de filtros
  setFilterOptions(options: any): void {
    this.set('filters:options', options, CacheManager.TTL.FILTER_OPTIONS)
  }

  getFilterOptions(): any | null {
    return this.get('filters:options')
  }

  // 🔍 Caché para resultados de búsqueda
  setSearchResults(searchKey: string, results: any): void {
    this.set(`search:${searchKey}`, results, CacheManager.TTL.SEARCH_RESULTS)
  }

  getSearchResults(searchKey: string): any | null {
    return this.get(`search:${searchKey}`)
  }

  // 🏆 Caché para datos de equipos
  setTeamData(teamId: string, team: any): void {
    this.set(`teams:${teamId}`, team, CacheManager.TTL.TEAM_DATA)
  }

  getTeamData(teamId: string): any | null {
    return this.get(`teams:${teamId}`)
  }

  // 🏆 Caché para datos de competiciones
  setCompetitionData(competitionId: string, competition: any): void {
    this.set(`competitions:${competitionId}`, competition, CacheManager.TTL.COMPETITION_DATA)
  }

  getCompetitionData(competitionId: string): any | null {
    return this.get(`competitions:${competitionId}`)
  }

  // 🔄 Invalidación inteligente por tipo
  invalidatePlayerData(playerId?: string): void {
    if (playerId) {
      // Invalidar datos específicos de un jugador
      this.invalidate(`players:details:${playerId}`)
      this.invalidate(`players:stats:${playerId}`)
    } else {
      // Invalidar todos los datos de jugadores
      this.invalidate('players:')
    }
    
    // También invalidar listas que podrían contener este jugador
    this.invalidate('players:list:')
    this.invalidate('search:')
  }

  invalidateTeamData(teamId?: string): void {
    if (teamId) {
      this.invalidate(`teams:${teamId}`)
    } else {
      this.invalidate('teams:')
    }
  }

  invalidateSearchResults(): void {
    this.invalidate('search:')
  }

  invalidateFilterOptions(): void {
    this.delete('filters:options')
  }
}

// 🎯 Exportar instancia singleton
export const cacheManager = CacheManager.getInstance()

// 🔧 Tipos para TypeScript
export type CacheKey = keyof typeof CacheManager.TTL
export type { CacheStats, CacheEntry }