import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import type { Scout, ScoutSearchOptions, ScoutSearchResult, ScoutStats } from '@/types/scout'

export type { Scout, ScoutSearchOptions, ScoutSearchResult, ScoutStats }

export class ScoutService {
  /**
   * 📋 SELECCIÓN MÍNIMA DE CAMPOS PARA LISTAS
   * Solo los campos necesarios para mostrar scouts en listas/grids
   */
  private static readonly LIST_SELECT = {
    id_scout: true,
    scout_name: true,
    name: true,
    surname: true,
    nationality: true,
    country: true,
    age: true,
    scout_level: true,
    scout_elo: true,
    scout_ranking: true,
    total_reports: true,
    original_reports: true,
    roi: true,
    net_profits: true,
    open_to_work: true,
    url_profile: true, // Fixed: was profile_pic, but field is url_profile
    nationality_expertise: true,
    competition_expertise: true,
    join_date: true, // Using join_date instead of createdAt
  }

  static async searchScouts(options: ScoutSearchOptions): Promise<ScoutSearchResult> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filters = {}
      } = options;

      console.log('🔍 ScoutService: Searching scouts with options:', options);

      // Construir el where clause basado en los filtros
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      // Filtros de búsqueda general
      if (filters.search) {
        where.OR = [
          { scout_name: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
          { surname: { contains: filters.search, mode: 'insensitive' } },
          { nationality: { contains: filters.search, mode: 'insensitive' } },
          { country: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Filtros específicos
      if (filters.nationality) {
        where.nationality = { contains: filters.nationality, mode: 'insensitive' };
      }
      if (filters.country) {
        where.country = { contains: filters.country, mode: 'insensitive' };
      }
      if (filters.scout_level) {
        where.scout_level = filters.scout_level;
      }
      if (filters.open_to_work !== undefined) {
        where.open_to_work = filters.open_to_work;
      }

      // Filtros de rango
      if (filters.min_age || filters.max_age) {
        where.age = {};
        if (filters.min_age) where.age.gte = filters.min_age;
        if (filters.max_age) where.age.lte = filters.max_age;
      }

      if (filters.min_scout_elo || filters.max_scout_elo) {
        where.scout_elo = {};
        if (filters.min_scout_elo) where.scout_elo.gte = filters.min_scout_elo;
        if (filters.max_scout_elo) where.scout_elo.lte = filters.max_scout_elo;
      }

      // Construir el orderBy
      const orderBy: any = {};
      if (sortBy === 'createdAt' || sortBy === 'join_date') {
        // Map createdAt to join_date for backward compatibility
        orderBy.join_date = sortOrder;
      } else if (sortBy === 'scout_elo') {
        orderBy.scout_elo = sortOrder;
      } else if (sortBy === 'total_reports') {
        orderBy.total_reports = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      // Calcular offset
      const offset = (page - 1) * limit;

      // Ejecutar consultas con select específico
      const [scouts, total] = await Promise.all([
        prisma.scout.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          select: ScoutService.LIST_SELECT,
        }),
        prisma.scout.count({ where })
      ]);

      console.log('✅ ScoutService: Found scouts:', scouts.length, 'of', total);

      return {
        scouts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ ScoutService: Error searching scouts:', error);
      throw error;
    }
  }

  static async getAllScouts(): Promise<any[]> {
    try {
      const scouts = await prisma.scout.findMany({
        orderBy: { join_date: 'desc' },
        take: 100, // Limitar para evitar cargar demasiados datos
        select: ScoutService.LIST_SELECT,
      });
      return scouts;
    } catch (error) {
      console.error('❌ ScoutService: Error getting all scouts:', error);
      throw error;
    }
  }

  static async getScoutById(id: string): Promise<any | null> {
    try {
      const scout = await prisma.scout.findUnique({
        where: { id_scout: id }
      });
      return scout;
    } catch (error) {
      console.error('❌ ScoutService: Error getting scout by id:', error);
      throw error;
    }
  }

  static async getAvailableScouts(): Promise<any[]> {
    try {
      const scouts = await prisma.scout.findMany({
        where: { open_to_work: true },
        orderBy: { scout_elo: 'desc' },
        take: 50
      });
      return scouts;
    } catch (error) {
      console.error('❌ ScoutService: Error getting available scouts:', error);
      throw error;
    }
  }

  static async getScoutRanking(): Promise<any[]> {
    try {
      const scouts = await prisma.scout.findMany({
        orderBy: { scout_ranking: 'asc' },
        take: 100
      });
      return scouts;
    } catch (error) {
      console.error('❌ ScoutService: Error getting scout ranking:', error);
      throw error;
    }
  }

  static async getScoutStats(): Promise<ScoutStats> {
    try {
      const [totalScouts, avgElo, topScouts] = await Promise.all([
        prisma.scout.count(),
        prisma.scout.aggregate({
          _avg: { scout_elo: true }
        }),
        prisma.scout.findMany({
          orderBy: { scout_elo: 'desc' },
          take: 5
        })
      ]);

      return {
        totalScouts,
        averageRating: avgElo._avg.scout_elo || 0,
        topScouts
      };
    } catch (error) {
      console.error('❌ ScoutService: Error getting scout stats:', error);
      throw error;
    }
  }

  static async createScout(data: any): Promise<any> {
    try {
      const scout = await prisma.scout.create({
        data
      });
      return scout;
    } catch (error) {
      console.error('❌ ScoutService: Error creating scout:', error);
      throw error;
    }
  }
}