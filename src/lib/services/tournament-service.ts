import { prisma } from '@/lib/db';

export interface Torneo {
  id_torneo: string;
  nombre: string;
  descripcion?: string | null;
  pais?: string | null;
  ciudad?: string | null;
  fecha_inicio: Date;
  fecha_fin: Date;
  tipo_torneo: string;
  categoria?: string | null;
  genero: string;
  estado: string;
  max_equipos?: number | null;
  equipos_inscritos: number;
  premio_primero?: number | null;
  premio_segundo?: number | null;
  premio_tercero?: number | null;
  organizador?: string | null;
  contacto_email?: string | null;
  contacto_telefono?: string | null;
  sitio_web?: string | null;
}

export interface TorneoFilters {
  search?: string;
  tipo_torneo?: string;
  categoria?: string;
  genero?: string;
  estado?: string;
  pais?: string;
  es_publico?: boolean;
  es_gratuito?: boolean;
  fecha_inicio_desde?: Date;
  fecha_inicio_hasta?: Date;
}

export interface TorneoResponse {
  torneos: Torneo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class TournamentService {
  static async getTorneos(filters: TorneoFilters = {}, page = 1, limit = 10): Promise<TorneoResponse> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } },
        { organizador: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tipo_torneo) {
      where.tipo_torneo = filters.tipo_torneo;
    }

    if (filters.categoria) {
      where.categoria = filters.categoria;
    }

    if (filters.genero) {
      where.genero = filters.genero;
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.pais) {
      where.pais = { contains: filters.pais, mode: 'insensitive' };
    }

    if (filters.fecha_inicio_desde || filters.fecha_inicio_hasta) {
      where.fecha_inicio = {};
      if (filters.fecha_inicio_desde) {
        where.fecha_inicio.gte = filters.fecha_inicio_desde;
      }
      if (filters.fecha_inicio_hasta) {
        where.fecha_inicio.lte = filters.fecha_inicio_hasta;
      }
    }

    const [torneos, total] = await Promise.all([
      prisma.torneo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_inicio: 'desc' },
      }),
      prisma.torneo.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      torneos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getTorneoById(id: string): Promise<Torneo | null> {
    return await prisma.torneo.findUnique({
      where: { id_torneo: id },
    });
  }

  static async createTorneo(data: Partial<Torneo>): Promise<Torneo> {
    return await prisma.torneo.create({
      data: data as any,
    });
  }

  static async updateTorneo(id: string, data: Partial<Torneo>): Promise<Torneo> {
    return await prisma.torneo.update({
      where: { id_torneo: id },
      data: data as any,
    });
  }

  static async deleteTorneo(id: string): Promise<Torneo> {
    return await prisma.torneo.delete({
      where: { id_torneo: id },
    });
  }
}