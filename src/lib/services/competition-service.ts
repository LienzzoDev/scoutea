import { prisma } from '@/lib/db';

export interface Competition {
  id: string;
  name: string;
  country: string;
  level: string;
  tier?: number;
  confederation?: string | null;
  shortName?: string | null;
}

export interface CompetitionDetailed {
  id: string;
  name: string;
  short_name: string | null;
  country_id: string;
  tier: number;
  confederation: string | null;
  season_format: string | null;
  country: {
    id: string;
    name: string;
    code: string;
  };
}

export interface SearchCompetitionsOptions {
  page?: number;
  limit?: number;
  search?: string;
  country_id?: string;
  tier?: number;
  confederation?: string;
}

export class CompetitionService {
  static async getAllCompetitions(): Promise<Competition[]> {
    const competitions = await prisma.competition.findMany({
      include: {
        country: true,
      },
      orderBy: [
        { tier: 'asc' },
        { name: 'asc' },
      ],
    });

    return competitions.map(comp => ({
      id: comp.id,
      name: comp.name,
      country: comp.country.name,
      level: `Tier ${comp.tier}`,
      tier: comp.tier,
      confederation: comp.confederation,
      shortName: comp.short_name,
    }));
  }

  static async getCompetitionById(id: string): Promise<CompetitionDetailed | null> {
    const competition = await prisma.competition.findUnique({
      where: { id },
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
      id: competition.id,
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
        { tier: 'asc' },
        { name: 'asc' },
      ],
    });

    return competitions.map(comp => ({
      id: comp.id,
      name: comp.name,
      country: comp.country.name,
      level: `Tier ${comp.tier}`,
      tier: comp.tier,
      confederation: comp.confederation,
      shortName: comp.short_name,
    }));
  }

  static async searchCompetitions(options: SearchCompetitionsOptions) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { short_name: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.country_id) {
      where.country_id = options.country_id;
    }

    if (options.tier) {
      where.tier = options.tier;
    }

    if (options.confederation) {
      where.confederation = options.confederation;
    }

    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        include: {
          country: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { tier: 'asc' },
          { name: 'asc' },
        ],
      }),
      prisma.competition.count({ where }),
    ]);

    return {
      competitions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async createCompetition(data: {
    name: string;
    short_name?: string;
    country_id: string;
    tier: number;
    confederation?: string;
    season_format?: string;
  }) {
    // Verificar que no exista una competición con el mismo nombre
    const existing = await prisma.competition.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('Ya existe una competición con ese nombre');
    }

    const competition = await prisma.competition.create({
      data: {
        name: data.name,
        short_name: data.short_name || null,
        country_id: data.country_id,
        tier: data.tier,
        confederation: data.confederation || null,
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
    data: {
      name?: string;
      short_name?: string;
      country_id?: string;
      tier?: number;
      confederation?: string;
      season_format?: string;
    }
  ) {
    // Si se está cambiando el nombre, verificar que no exista otra con ese nombre
    if (data.name) {
      const existing = await prisma.competition.findFirst({
        where: {
          name: data.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new Error('Ya existe una competición con ese nombre');
      }
    }

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        name: data.name,
        short_name: data.short_name,
        country_id: data.country_id,
        tier: data.tier,
        confederation: data.confederation,
        season_format: data.season_format,
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

  static async deleteCompetition(id: string) {
    await prisma.competition.delete({
      where: { id },
    });
  }
}