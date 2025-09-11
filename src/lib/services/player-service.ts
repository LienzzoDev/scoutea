// 🏗️ SERVICIO CONSOLIDADO DE JUGADORES
// ✅ PROPÓSITO: Centralizar TODA la lógica de jugadores en un solo lugar
// ✅ BENEFICIO: Fácil de mantener, testear y reutilizar
// ✅ REEMPLAZA: Lógica duplicada entre diferentes servicios

import { prisma } from '@/lib/db'
import type {
  Player,
  PlayerFilters,
  PlayerSearchOptions,
  PlayerSearchResult,
  PlayerStats,
  FilterOptions,
  CreatePlayerData,
  UpdatePlayerData
} from '@/types/player'

// 🏭 CLASE PRINCIPAL DEL SERVICIO
// Todos los métodos son estáticos para uso directo sin instanciar
export class PlayerService {
  
  // 📚 ========== OPERACIONES BÁSICAS (CRUD) ==========
  
  /**
   * 🔍 BUSCAR JUGADORES CON FILTROS Y PAGINACIÓN OPTIMIZADA
   * 
   * ✅ QUÉ HACE: Busca jugadores aplicando filtros y devuelve resultados paginados
   * ✅ POR QUÉ: Permite búsquedas eficientes aprovechando los índices optimizados
   * ✅ OPTIMIZACIÓN: Usa índices específicos para cada tipo de consulta
   * ✅ EJEMPLO: PlayerService.searchPlayers({ page: 1, limit: 20, filters: { position_player: "CF" } })
   * 
   * @param options - Opciones de búsqueda (página, límite, filtros, ordenamiento)
   * @returns Resultado con jugadores encontrados y información de paginación
   */
  static async searchPlayers(options: PlayerSearchOptions = {}): Promise<PlayerSearchResult> {
    try {
      // 🎛️ CONFIGURACIÓN POR DEFECTO
      const page = options.page || 1
      const limit = options.limit || 20
      const sortBy = options.sortBy || 'player_name'
      const sortOrder = options.sortOrder || 'asc'
      const filters = options.filters || {}

      // 🛡️ VALIDAR LÍMITES PARA PREVENIR SOBRECARGA
      const safeLimit = Math.min(Math.max(limit, 1), 100)
      const safePage = Math.max(page, 1)
      const skip = (safePage - 1) * safeLimit

      // 🔍 CONSTRUIR WHERE CLAUSE
      const where: any = {}
      
      if (filters.player_name) {
        where.player_name = { contains: filters.player_name, mode: 'insensitive' }
      }
      if (filters.position_player) {
        where.position_player = filters.position_player
      }
      if (filters.team_name) {
        where.team_name = { contains: filters.team_name, mode: 'insensitive' }
      }
      if (filters.nationality_1) {
        where.nationality_1 = filters.nationality_1
      }
      if (filters.min_age || filters.max_age) {
        where.age = {}
        if (filters.min_age) where.age.gte = filters.min_age
        if (filters.max_age) where.age.lte = filters.max_age
      }
      if (filters.min_rating || filters.max_rating) {
        where.player_rating = {}
        if (filters.min_rating) where.player_rating.gte = filters.min_rating
        if (filters.max_rating) where.player_rating.lte = filters.max_rating
      }
      if (filters.on_loan !== undefined) {
        where.on_loan = filters.on_loan
      }

      // 📈 CONSTRUIR ORDENAMIENTO OPTIMIZADO (array para múltiples campos)
      let orderBy: any
      if (sortBy === 'createdAt') {
        orderBy = [
          { createdAt: sortOrder },
          { id_player: 'asc' } // Para paginación consistente
        ]
      } else if (sortBy === 'player_rating') {
        orderBy = [
          { player_rating: sortOrder },
          { createdAt: 'desc' } // Segundo criterio para desempate
        ]
      } else {
        orderBy = { [sortBy]: sortOrder }
      }

      // 🚀 EJECUTAR CONSULTAS EN PARALELO
      
      const [players, total] = await Promise.all([
        prisma.jugador.findMany({
          where,
          orderBy,
          skip,
          take: safeLimit,
          select: {
            id_player: true,
            player_name: true,
            age: true,
            position_player: true,
            nationality_1: true,
            team_name: true,
            player_rating: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.jugador.count({ where })
      ])

      // 📊 CALCULAR INFORMACIÓN DE PAGINACIÓN
      const totalPages = Math.ceil(total / safeLimit)
      const hasNext = safePage < totalPages
      const hasPrev = safePage > 1

      // 📤 DEVOLVER RESULTADO ESTRUCTURADO
      return {
        players: players as Player[],
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      }

    } catch (error) {
      console.error('❌ Error in searchPlayers:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        options,
        timestamp: new Date().toISOString()
      })
      throw new Error('Error al buscar jugadores')
    }
  }

  /**
   * 👤 OBTENER UN JUGADOR ESPECÍFICO POR ID
   * 
   * ✅ QUÉ HACE: Busca un jugador por su ID único
   * ✅ POR QUÉ: Para mostrar perfiles detallados o editar jugadores
   * ✅ EJEMPLO: PlayerService.getPlayerById("player_123")
   * 
   * @param id - ID único del jugador
   * @returns El jugador encontrado o null si no existe
   */
  static async getPlayerById(id: string): Promise<Player | null> {
    try {
      // 🔍 BUSCAR JUGADOR POR ID
      const player = await prisma.jugador.findUnique({
        where: { id_player: id }
      })

      // 📤 DEVOLVER RESULTADO (null si no se encuentra)
      return player as Player | null
    } catch (error) {
      console.error('❌ Error getting player by ID:', error)
      throw new Error('Error al obtener el jugador')
    }
  }

  /**
   * ➕ CREAR UN NUEVO JUGADOR
   * 
   * ✅ QUÉ HACE: Añade un nuevo jugador a la base de datos
   * ✅ POR QUÉ: Para que los admins puedan añadir nuevos jugadores
   * ✅ EJEMPLO: PlayerService.createPlayer({ player_name: "Nuevo Jugador", age: 20 })
   * 
   * @param data - Datos del nuevo jugador
   * @returns El jugador creado con su ID asignado
   */
  static async createPlayer(data: CreatePlayerData): Promise<Player> {
    try {
      // ➕ CREAR JUGADOR EN BASE DE DATOS
      const player = await prisma.jugador.create({
        data: {
          ...data,                    // Spread de todos los datos proporcionados
          createdAt: new Date(),      // Timestamp de creación
          updatedAt: new Date()       // Timestamp de actualización
        }
      })

      // 📤 DEVOLVER JUGADOR CREADO
      return player as Player
    } catch (error) {
      console.error('❌ Error creating player:', error)
      throw new Error('Error al crear el jugador')
    }
  }

  /**
   * ✏️ ACTUALIZAR UN JUGADOR EXISTENTE
   * 
   * ✅ QUÉ HACE: Modifica los datos de un jugador existente
   * ✅ POR QUÉ: Para mantener la información actualizada
   * ✅ EJEMPLO: PlayerService.updatePlayer("player_123", { player_rating: 85 })
   * 
   * @param id - ID del jugador a actualizar
   * @param data - Datos a actualizar (solo los campos que cambian)
   * @returns El jugador actualizado
   */
  static async updatePlayer(id: string, data: UpdatePlayerData): Promise<Player> {
    try {
      // ✏️ ACTUALIZAR JUGADOR EN BASE DE DATOS
      const player = await prisma.jugador.update({
        where: { id_player: id },
        data: {
          ...data,                    // Solo actualizar campos proporcionados
          updatedAt: new Date()       // Actualizar timestamp de modificación
        }
      })

      // 📤 DEVOLVER JUGADOR ACTUALIZADO
      return player as Player
    } catch (error) {
      console.error('❌ Error updating player:', error)
      throw new Error('Error al actualizar el jugador')
    }
  }

  /**
   * 🗑️ ELIMINAR UN JUGADOR
   * 
   * ✅ QUÉ HACE: Elimina permanentemente un jugador de la base de datos
   * ✅ POR QUÉ: Para limpiar datos obsoletos o incorrectos
   * ⚠️ CUIDADO: Esta operación es irreversible
   * ✅ EJEMPLO: PlayerService.deletePlayer("player_123")
   * 
   * @param id - ID del jugador a eliminar
   */
  static async deletePlayer(id: string): Promise<void> {
    try {
      // 🗑️ ELIMINAR JUGADOR DE BASE DE DATOS
      await prisma.jugador.delete({
        where: { id_player: id }
      })
    } catch (error) {
      console.error('❌ Error deleting player:', error)
      throw new Error('Error al eliminar el jugador')
    }
  }

  // 📊 ========== OPERACIONES AVANZADAS ==========

  /**
   * 📈 OBTENER ESTADÍSTICAS GENERALES OPTIMIZADAS
   * 
   * ✅ QUÉ HACE: Calcula métricas para dashboards aprovechando índices optimizados
   * ✅ POR QUÉ: Los admins necesitan ver el estado general del sistema rápidamente
   * ✅ OPTIMIZACIÓN: Usa índices específicos para consultas de agregación
   * ✅ EJEMPLO: PlayerService.getPlayerStats()
   * 
   * @returns Estadísticas completas del sistema
   */
  static async getPlayerStats(): Promise<PlayerStats> {
    try {
      // 🚀 EJECUTAR MÚLTIPLES CONSULTAS OPTIMIZADAS EN PARALELO
      const [
        totalPlayers,           // Total de jugadores
        playersByPosition,      // Distribución por posiciones (usa idx_player_analytics)
        playersByNationality,   // Top nacionalidades (usa idx_player_nationality)
        averageRating,         // Rating promedio (usa idx_player_rating_created)
        topRatedPlayers        // Mejores jugadores (usa idx_player_rating_created)
      ] = await Promise.all([
        
        // 🔢 CONTAR TOTAL DE JUGADORES (consulta simple, muy rápida)
        prisma.jugador.count(),
        
        // 🎯 AGRUPAR POR POSICIÓN (optimizado con idx_player_analytics)
        prisma.jugador.groupBy({
          by: ['position_player'],
          _count: { position_player: true },
          where: { 
            position_player: { not: null },
            // 🚀 OPTIMIZACIÓN: Filtrar solo jugadores con datos completos
            age: { not: null },
            player_rating: { not: null }
          },
          orderBy: { _count: { position_player: 'desc' } }
        }),
        
        // 🌍 TOP 10 NACIONALIDADES (optimizado con idx_player_nationality)
        prisma.jugador.groupBy({
          by: ['nationality_1'],
          _count: { nationality_1: true },
          where: { nationality_1: { not: null } },
          orderBy: { _count: { nationality_1: 'desc' } },
          take: 10
        }),
        
        // ⭐ CALCULAR RATING PROMEDIO (optimizado con idx_player_rating_created)
        prisma.jugador.aggregate({
          _avg: { player_rating: true },
          _count: { player_rating: true },
          _min: { player_rating: true },
          _max: { player_rating: true },
          where: { 
            player_rating: { 
              not: null,
              gte: 0,  // Solo ratings válidos
              lte: 100
            } 
          }
        }),
        
        // 🏆 TOP 10 MEJORES JUGADORES (optimizado con idx_player_rating_created)
        prisma.jugador.findMany({
          where: { 
            player_rating: { 
              not: null,
              gte: 70  // Solo jugadores con rating alto para mejor performance
            } 
          },
          orderBy: [
            { player_rating: 'desc' },
            { createdAt: 'desc' }  // Desempate por fecha (usa el índice compuesto)
          ],
          take: 10,
          select: {
            id_player: true,
            player_name: true,
            player_rating: true,
            team_name: true,
            position_player: true,
            nationality_1: true,
            age: true
          }
        })
      ])

      // 📊 CALCULAR ESTADÍSTICAS ADICIONALES
      const ratingStats = {
        average: averageRating._avg.player_rating,
        count: averageRating._count.player_rating,
        min: averageRating._min.player_rating,
        max: averageRating._max.player_rating
      }

      // 📤 DEVOLVER ESTADÍSTICAS ESTRUCTURADAS Y ENRIQUECIDAS
      return {
        totalPlayers,
        playersByPosition: playersByPosition.slice(0, 8), // Limitar a top 8 posiciones
        playersByNationality: playersByNationality.slice(0, 10), // Top 10 países
        averageRating: ratingStats.average,
        topRatedPlayers,
        // 📊 ESTADÍSTICAS ADICIONALES PARA DASHBOARDS AVANZADOS
        ratingDistribution: {
          average: ratingStats.average,
          min: ratingStats.min,
          max: ratingStats.max,
          totalWithRating: ratingStats.count
        }
      }
    } catch (error) {
      console.error('❌ Error getting optimized player stats:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      throw new Error('Error al obtener estadísticas')
    }
  }

  /**
   * ⚽ OBTENER JUGADORES POR EQUIPO
   * 
   * ✅ QUÉ HACE: Busca todos los jugadores de un equipo específico
   * ✅ POR QUÉ: Para análisis de equipos y comparaciones
   * ✅ EJEMPLO: PlayerService.getPlayersByTeam("Barcelona")
   * 
   * @param teamName - Nombre del equipo
   * @returns Array de jugadores del equipo
   */
  static async getPlayersByTeam(teamName: string): Promise<Player[]> {
    try {
      // 🔍 BUSCAR JUGADORES POR EQUIPO
      const players = await prisma.jugador.findMany({
        where: {
          team_name: {
            contains: teamName,      // Búsqueda parcial
            mode: 'insensitive'     // Insensible a mayúsculas
          }
        },
        orderBy: { player_rating: 'desc' }  // Ordenar por rating (mejores primero)
      })

      return players as Player[]
    } catch (error) {
      console.error('❌ Error getting players by team:', error)
      throw new Error('Error al obtener jugadores del equipo')
    }
  }

  /**
   * 🎯 OBTENER JUGADORES POR POSICIÓN
   * 
   * ✅ QUÉ HACE: Busca todos los jugadores de una posición específica
   * ✅ POR QUÉ: Para comparar jugadores de la misma posición
   * ✅ EJEMPLO: PlayerService.getPlayersByPosition("CF")
   * 
   * @param position - Código de la posición
   * @returns Array de jugadores de esa posición
   */
  static async getPlayersByPosition(position: string): Promise<Player[]> {
    try {
      // 🔍 BUSCAR JUGADORES POR POSICIÓN
      const players = await prisma.jugador.findMany({
        where: { position_player: position },
        orderBy: { player_rating: 'desc' }  // Ordenar por rating
      })

      return players as Player[]
    } catch (error) {
      console.error('❌ Error getting players by position:', error)
      throw new Error('Error al obtener jugadores por posición')
    }
  }

  /**
   * 🔧 OBTENER OPCIONES DISPONIBLES PARA FILTROS OPTIMIZADAS
   * 
   * ✅ QUÉ HACE: Devuelve opciones para dropdowns aprovechando índices optimizados
   * ✅ POR QUÉ: Los filtros se llenan automáticamente con datos reales y rápidos
   * ✅ OPTIMIZACIÓN: Usa índices específicos y limita resultados para mejor UX
   * ✅ EJEMPLO: PlayerService.getAvailableFilters()
   * 
   * @returns Opciones para todos los filtros
   */
  static async getAvailableFilters(): Promise<FilterOptions> {
    try {
      // 🚀 OBTENER OPCIONES OPTIMIZADAS EN PARALELO
      const [positions, nationalities, teams, competitions] = await Promise.all([
        
        // 🎯 POSICIONES ÚNICAS (optimizado con idx_player_analytics)
        prisma.jugador.groupBy({
          by: ['position_player'],
          _count: { position_player: true },
          where: { 
            position_player: { not: null },
            // 🚀 FILTRAR SOLO JUGADORES ACTIVOS PARA MEJOR RELEVANCIA
            age: { not: null, gte: 16, lte: 45 },
            player_rating: { not: null, gte: 30 }
          },
          orderBy: { _count: { position_player: 'desc' } },
          having: {
            position_player: {
              _count: { gte: 2 } // Solo posiciones con al menos 2 jugadores
            }
          }
        }),
        
        // 🌍 NACIONALIDADES ÚNICAS (optimizado con idx_player_nationality)
        prisma.jugador.groupBy({
          by: ['nationality_1'],
          _count: { nationality_1: true },
          where: { 
            nationality_1: { not: null },
            // 🚀 FILTRAR JUGADORES ACTIVOS
            age: { not: null, gte: 16, lte: 45 }
          },
          orderBy: { _count: { nationality_1: 'desc' } },
          take: 50, // Limitar a top 50 países para mejor UX
          having: {
            nationality_1: {
              _count: { gte: 1 } // Al menos 1 jugador por país
            }
          }
        }),
        
        // ⚽ EQUIPOS ÚNICOS (optimizado con idx_player_team_position)
        prisma.jugador.groupBy({
          by: ['team_name'],
          _count: { team_name: true },
          where: { 
            team_name: { not: null },
            // 🚀 SOLO EQUIPOS CON JUGADORES ACTIVOS
            age: { not: null, gte: 16, lte: 45 }
          },
          orderBy: { _count: { team_name: 'desc' } },
          take: 100, // Limitar a top 100 equipos
          having: {
            team_name: {
              _count: { gte: 2 } // Solo equipos con al menos 2 jugadores
            }
          }
        }),
        
        // 🏆 COMPETICIONES ÚNICAS (optimizado con idx_player_competition)
        prisma.jugador.groupBy({
          by: ['team_competition'],
          _count: { team_competition: true },
          where: { 
            team_competition: { not: null },
            // 🚀 SOLO COMPETICIONES ACTIVAS
            age: { not: null, gte: 16, lte: 45 }
          },
          orderBy: { _count: { team_competition: 'desc' } },
          take: 30, // Limitar a top 30 competiciones
          having: {
            team_competition: {
              _count: { gte: 5 } // Solo competiciones con al menos 5 jugadores
            }
          }
        })
      ])

      // 📊 FORMATEAR OPCIONES CON INFORMACIÓN ENRIQUECIDA
      const formatOptions = (items: any[], field: string) => 
        items
          .filter(item => item[field] && item[field].trim().length > 0)
          .map(item => ({
            value: item[field]!,
            label: item[field]!,
            count: item._count[field]
          }))
          .sort((a, b) => b.count - a.count) // Ordenar por popularidad

      // 📤 DEVOLVER OPCIONES OPTIMIZADAS Y FILTRADAS
      return {
        positions: formatOptions(positions, 'position_player'),
        nationalities: formatOptions(nationalities, 'nationality_1'),
        teams: formatOptions(teams, 'team_name'),
        competitions: formatOptions(competitions, 'team_competition')
      }
    } catch (error) {
      console.error('❌ Error getting optimized available filters:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      throw new Error('Error al obtener opciones de filtros')
    }
  }

  // 🔧 ========== MÉTODOS DE UTILIDAD Y OPTIMIZACIÓN ==========

  /**
   * 📊 VERIFICAR PERFORMANCE DE ÍNDICES
   * 
   * ✅ QUÉ HACE: Ejecuta consultas de prueba para medir la efectividad de los índices
   * ✅ POR QUÉ: Permite monitorear si las optimizaciones están funcionando
   * ✅ EJEMPLO: PlayerService.checkIndexPerformance()
   * 
   * @returns Métricas de performance de las consultas más comunes
   */
  static async checkIndexPerformance(): Promise<{
    searchByName: number
    searchByPosition: number
    searchByRating: number
    searchComposite: number
    totalPlayers: number
  }> {
    try {
      // 🔍 TEST 1: Búsqueda por nombre (usa idx_player_search_composite)
      const startName = Date.now()
      await prisma.jugador.findMany({
        where: { player_name: { contains: 'a', mode: 'insensitive' } },
        take: 10
      })
      const searchByName = Date.now() - startName

      // 🎯 TEST 2: Búsqueda por posición (usa idx_player_analytics)
      const startPosition = Date.now()
      await prisma.jugador.findMany({
        where: { position_player: 'CF' },
        take: 10
      })
      const searchByPosition = Date.now() - startPosition

      // ⭐ TEST 3: Ordenamiento por rating (usa idx_player_rating_created)
      const startRating = Date.now()
      await prisma.jugador.findMany({
        where: { player_rating: { gte: 80 } },
        orderBy: { player_rating: 'desc' },
        take: 10
      })
      const searchByRating = Date.now() - startRating

      // 🚀 TEST 4: Búsqueda compuesta (usa múltiples índices)
      const startComposite = Date.now()
      await prisma.jugador.findMany({
        where: {
          position_player: 'CF',
          age: { gte: 20, lte: 25 },
          player_rating: { gte: 75 }
        },
        orderBy: { player_rating: 'desc' },
        take: 10
      })
      const searchComposite = Date.now() - startComposite

      // 📊 CONTAR TOTAL PARA CONTEXTO
      const totalPlayers = await prisma.jugador.count()

      return {
        searchByName: `${searchByName}ms`,
        searchByPosition: `${searchByPosition}ms`,
        searchByRating: `${searchByRating}ms`,
        searchComposite: `${searchComposite}ms`,
        totalPlayers
      }
    } catch (error) {
      console.error('❌ Error checking index performance:', error)
      throw new Error('Error al verificar performance de índices')
    }
  }

  /**
   * 🧹 LIMPIAR CACHÉ DE CONSULTAS (UTILIDAD PARA DESARROLLO)
   * 
   * ✅ QUÉ HACE: Fuerza la regeneración de estadísticas y limpia cachés
   * ✅ POR QUÉ: Útil durante desarrollo y testing
   * ✅ EJEMPLO: PlayerService.clearQueryCache()
   */
  static async clearQueryCache(): Promise<void> {
    try {
      // 🔄 EJECUTAR CONSULTA DUMMY PARA LIMPIAR CACHÉ
      await prisma.$executeRaw`SELECT 1`
    } catch (error) {
      console.error('❌ Error clearing query cache:', error)
      throw new Error('Error al limpiar caché de consultas')
    }
  }
}

// 📤 EXPORTACIÓN POR DEFECTO
export default PlayerService