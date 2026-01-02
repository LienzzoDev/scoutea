import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export interface Competition {
  id_competition: string;
  competition_name?: string | null;
  correct_competition_name?: string | null;
  competition_country?: string | null;
  url_trfm?: string | null;
  competition_confederation?: string | null;
  competition_tier?: number | null;
  competition_trfm_value?: number | null;
  competition_trfm_value_norm?: number | null;
  competition_rating?: number | null;
  competition_rating_norm?: number | null;
  competition_elo?: number | null;
  competition_level?: string | null;
  // Legacy fields
  name?: string | null;
  short_name?: string | null;
  country_id?: string | null;
  tier?: number | null;
  confederation?: string | null;
  season_format?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompetitionDetailed extends Competition {
  country?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface SearchCompetitionsOptions {
  cursor?: string;
  limit?: number;
  search?: string;
  country?: string;
  confederation?: string;
  tier?: number;
}


export class CompetitionService {
  static async getAllCompetitions(): Promise<Competition[]> {
    const competitions = await prisma.competition.findMany({
      include: {
        country: true,
      },
      orderBy: [
        { competition_tier: 'asc' },
        { competition_name: 'asc' },
      ],
    });

    return competitions.map(comp => ({
      id_competition: comp.id_competition,
      competition_name: comp.competition_name || comp.name,
      correct_competition_name: comp.correct_competition_name,
      competition_country: comp.competition_country,
      url_trfm: comp.url_trfm,
      competition_confederation: comp.competition_confederation || comp.confederation,
      competition_tier: comp.competition_tier || comp.tier,
      competition_trfm_value: comp.competition_trfm_value,
      competition_trfm_value_norm: comp.competition_trfm_value_norm,
      competition_rating: comp.competition_rating,
      competition_rating_norm: comp.competition_rating_norm,
      competition_elo: comp.competition_elo,
      competition_level: comp.competition_level,
      // Legacy
      name: comp.name,
      short_name: comp.short_name,
      tier: comp.tier,
      confederation: comp.confederation,
    }));
  }

  static async getCompetitionById(id: string): Promise<CompetitionDetailed | null> {
    const competition = await prisma.competition.findUnique({
      where: { id_competition: id },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!competition) return null;

    return {
      id_competition: competition.id_competition,
      competition_name: competition.competition_name || competition.name,
      correct_competition_name: competition.correct_competition_name,
      competition_country: competition.competition_country,
      url_trfm: competition.url_trfm,
      competition_confederation: competition.competition_confederation || competition.confederation,
      competition_tier: competition.competition_tier || competition.tier,
      competition_trfm_value: competition.competition_trfm_value,
      competition_trfm_value_norm: competition.competition_trfm_value_norm,
      competition_rating: competition.competition_rating,
      competition_rating_norm: competition.competition_rating_norm,
      competition_elo: competition.competition_elo,
      competition_level: competition.competition_level,
      // Legacy
      name: competition.name,
      short_name: competition.short_name,
      country_id: competition.country_id,
      tier: competition.tier,
      confederation: competition.confederation,
      season_format: competition.season_format,
      country: competition.country,
    };
  }

  static async getCompetitionsByCountry(countryId: string): Promise<Competition[]> {
    const competitions = await prisma.competition.findMany({
      where: { country_id: countryId },
      include: {
        country: true,
      },
      orderBy: [
        { competition_tier: 'asc' },
        { competition_name: 'asc' },
      ],
    });

    return competitions.map(comp => ({
      id_competition: comp.id_competition,
      competition_name: comp.competition_name || comp.name,
      correct_competition_name: comp.correct_competition_name,
      competition_country: comp.competition_country,
      url_trfm: comp.url_trfm,
      competition_confederation: comp.competition_confederation || comp.confederation,
      competition_tier: comp.competition_tier || comp.tier,
      competition_trfm_value: comp.competition_trfm_value,
      competition_trfm_value_norm: comp.competition_trfm_value_norm,
      competition_rating: comp.competition_rating,
      competition_rating_norm: comp.competition_rating_norm,
      competition_elo: comp.competition_elo,
      competition_level: comp.competition_level,
      // Legacy
      name: comp.name,
      short_name: comp.short_name,
      tier: comp.tier,
      confederation: comp.confederation,
    }));
  }

  static async searchCompetitions(options: SearchCompetitionsOptions) {
    const cursor = options.cursor;
    const limit = options.limit || 50;

    const where: Prisma.CompetitionWhereInput = {};
    const orConditions: Prisma.CompetitionWhereInput[] = [];

    // Build OR conditions for search
    if (options.search) {
      orConditions.push(
        { competition_name: { contains: options.search, mode: 'insensitive' } },
        { correct_competition_name: { contains: options.search, mode: 'insensitive' } },
        { competition_country: { contains: options.search, mode: 'insensitive' } },
        { name: { contains: options.search, mode: 'insensitive' } } // Legacy
      );
    }

    // Add country filter
    if (options.country) {
      where.competition_country = { contains: options.country, mode: 'insensitive' };
    }

    // Add confederation filter
    if (options.confederation) {
      orConditions.push(
        { competition_confederation: { contains: options.confederation, mode: 'insensitive' } },
        { confederation: { contains: options.confederation, mode: 'insensitive' } } // Legacy
      );
    }

    // Add tier filter
    if (options.tier !== undefined) {
      where.competition_tier = options.tier;
    }

    // Only add OR if we have conditions
    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    try {
      console.log('🔍 Searching competitions with WHERE:', JSON.stringify(where, null, 2));

      // Query con cursor - usar id_competition para ordenar ya que es estable
      const competitions = await prisma.competition.findMany({
        where,
        take: limit + 1, // Tomar uno extra para saber si hay más
        ...(cursor ? {
          skip: 1, // Saltar el cursor
          cursor: {
            id_competition: cursor
          }
        } : {}),
        orderBy: {
          id_competition: 'asc' // Usar id_competition para ordenamiento estable
        },
      });

      console.log('✅ Found', competitions.length, 'competitions');

      // Determinar si hay más resultados
      const hasMore = competitions.length > limit;
      const competitionsToReturn = hasMore ? competitions.slice(0, limit) : competitions;
      const nextCursor = hasMore ? competitions[limit - 1]?.id_competition : null;

      // Obtener total solo en la primera carga (sin cursor)
      let total: number | undefined;
      if (!cursor) {
        total = await prisma.competition.count({ where });
        console.log('📊 Total competitions:', total);
      }

      return {
        competitions: competitionsToReturn.map(comp => ({
          id_competition: comp.id_competition,
          competition_name: comp.competition_name || comp.name,
          correct_competition_name: comp.correct_competition_name,
          competition_country: comp.competition_country,
          url_trfm: comp.url_trfm,
          competition_confederation: comp.competition_confederation || comp.confederation,
          competition_tier: comp.competition_tier || comp.tier,
          competition_trfm_value: comp.competition_trfm_value,
          competition_trfm_value_norm: comp.competition_trfm_value_norm,
          competition_rating: comp.competition_rating,
          competition_rating_norm: comp.competition_rating_norm,
          competition_elo: comp.competition_elo,
          competition_level: comp.competition_level,
          // Legacy
          name: comp.name,
          short_name: comp.short_name,
          tier: comp.tier,
          confederation: comp.confederation,
          country_id: comp.country_id,
        })),
        hasMore,
        nextCursor,
        total,
        pagination: {
          limit,
          total,
          hasNext: hasMore
        }
      };
    } catch (error) {
      console.error('❌ Error in searchCompetitions:', error);
      throw error;
    }
  }

  static async createCompetition(data: {
    competition_name: string;
    correct_competition_name?: string;
    competition_country?: string;
    url_trfm?: string;
    competition_confederation?: string;
    competition_tier?: number;
    competition_trfm_value?: number;
    competition_trfm_value_norm?: number;
    competition_rating?: number;
    competition_rating_norm?: number;
    competition_elo?: number;
    competition_level?: string;
    // Legacy
    short_name?: string;
    country_id?: string;
    tier?: number;
    confederation?: string;
    season_format?: string;
  }) {
    const competition = await prisma.competition.create({
      data: {
        competition_name: data.competition_name,
        correct_competition_name: data.correct_competition_name || null,
        competition_country: data.competition_country || null,
        url_trfm: data.url_trfm || null,
        competition_confederation: data.competition_confederation || data.confederation || null,
        competition_tier: data.competition_tier || data.tier || null,
        competition_trfm_value: data.competition_trfm_value || null,
        competition_trfm_value_norm: data.competition_trfm_value_norm || null,
        competition_rating: data.competition_rating || null,
        competition_rating_norm: data.competition_rating_norm || null,
        competition_elo: data.competition_elo || null,
        competition_level: data.competition_level || null,
        // Legacy
        name: data.competition_name,
        short_name: data.short_name || null,
        country_id: data.country_id || null,
        tier: data.tier || data.competition_tier || null,
        confederation: data.confederation || data.competition_confederation || null,
        season_format: data.season_format || null,
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return competition;
  }

  static async updateCompetition(
    id: string,
    data: Partial<{
      competition_name: string;
      correct_competition_name: string;
      competition_country: string;
      url_trfm: string;
      competition_confederation: string;
      competition_tier: number | string;
      competition_trfm_value: number | string;
      competition_trfm_value_norm: number | string;
      competition_rating: number | string;
      competition_rating_norm: number | string;
      competition_elo: number | string;
      competition_level: string;
      // Legacy
      name: string;
      short_name: string;
      country_id: string;
      tier: number | string;
      confederation: string;
      season_format: string;
    }>
  ) {
    // Helper to parse number or return null if empty/invalid
    const parseNumberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = typeof value === 'number' ? value : parseFloat(String(value));
      return isNaN(parsed) ? null : parsed;
    };

    // Build update data object, only including defined values
    const updateData: Prisma.CompetitionUpdateInput = {};
    if (data.competition_name !== undefined) {
      updateData.competition_name = data.competition_name;
      updateData.name = data.competition_name; // Keep legacy in sync
    }
    // Also handle legacy name field from edit forms
    if (data.name !== undefined && data.competition_name === undefined) {
      updateData.name = data.name;
      updateData.competition_name = data.name; // Keep new field in sync
    }
    if (data.correct_competition_name !== undefined) updateData.correct_competition_name = data.correct_competition_name;
    if (data.competition_country !== undefined) updateData.competition_country = data.competition_country;
    if (data.url_trfm !== undefined) updateData.url_trfm = data.url_trfm;
    if (data.competition_confederation !== undefined) {
      updateData.competition_confederation = data.competition_confederation;
      updateData.confederation = data.competition_confederation; // Keep legacy in sync
    }
    // Also handle legacy confederation field from edit forms
    if (data.confederation !== undefined && data.competition_confederation === undefined) {
      updateData.confederation = data.confederation;
      updateData.competition_confederation = data.confederation; // Keep new field in sync
    }
    if (data.competition_tier !== undefined) {
      const tierValue = parseNumberOrNull(data.competition_tier);
      updateData.competition_tier = tierValue;
      updateData.tier = tierValue; // Keep legacy in sync
    }
    // Also handle legacy tier field from edit forms
    if (data.tier !== undefined && data.competition_tier === undefined) {
      const tierValue = parseNumberOrNull(data.tier);
      updateData.tier = tierValue;
      updateData.competition_tier = tierValue; // Keep new field in sync
    }
    if (data.competition_trfm_value !== undefined) updateData.competition_trfm_value = parseNumberOrNull(data.competition_trfm_value);
    if (data.competition_trfm_value_norm !== undefined) updateData.competition_trfm_value_norm = parseNumberOrNull(data.competition_trfm_value_norm);
    if (data.competition_rating !== undefined) updateData.competition_rating = parseNumberOrNull(data.competition_rating);
    if (data.competition_rating_norm !== undefined) updateData.competition_rating_norm = parseNumberOrNull(data.competition_rating_norm);
    if (data.competition_elo !== undefined) updateData.competition_elo = parseNumberOrNull(data.competition_elo);
    if (data.competition_level !== undefined) updateData.competition_level = data.competition_level || null;
    if (data.short_name !== undefined) updateData.short_name = data.short_name || null;
    // Only update country relation if it's a non-empty string to avoid FK constraint violation
    if (data.country_id !== undefined && data.country_id !== '') {
      updateData.country = { connect: { id: data.country_id } };
    } else if (data.country_id === '') {
      // If explicitly set to empty string, disconnect the relation
      updateData.country = { disconnect: true };
    }
    if (data.season_format !== undefined) updateData.season_format = data.season_format || null;

    const competition = await prisma.competition.update({
      where: { id_competition: id },
      data: updateData,
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return competition;
  }

  static async deleteCompetition(id: string) {
    await prisma.competition.delete({
      where: { id_competition: id },
    });
  }
}
