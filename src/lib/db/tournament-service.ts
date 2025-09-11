import { prisma } from '@/lib/db'

export interface Torneo {
  id_torneo: string
  nombre: string
  descripcion?: string
  pais?: string
  ciudad?: string
  fecha_inicio: Date
  fecha_fin: Date
  tipo_torneo: string
  categoria?: string
  genero: string
  estado: string
  max_equipos?: number
  equipos_inscritos: number
  premio_primero?: number
  premio_segundo?: number
  premio_tercero?: number
  organizador?: string
  contacto_email?: string
  contacto_telefono?: string
  sitio_web?: string
  redes_sociales?: any
  reglas_especiales?: string
  requisitos_inscripcion?: string
  fecha_limite_inscripcion?: Date
  imagen_url?: string
  banner_url?: string
  pdf_url?: string
  es_publico: boolean
  es_gratuito: boolean
  costo_inscripcion?: number
  moneda: string
  id_competition?: string
  competition?: {
    id_competition: string
    competition_name: string
    competition_country?: string
    competition_confederation?: string
    competition_tier?: string
    competition_level?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface CreateTorneoData {
  nombre: string
  descripcion?: string
  pais?: string
  ciudad?: string
  fecha_inicio: Date
  fecha_fin: Date
  tipo_torneo: string
  categoria?: string
  genero: string
  estado?: string
  max_equipos?: number
  premio_primero?: number
  premio_segundo?: number
  premio_tercero?: number
  organizador?: string
  contacto_email?: string
  contacto_telefono?: string
  sitio_web?: string
  redes_sociales?: any
  reglas_especiales?: string
  requisitos_inscripcion?: string
  fecha_limite_inscripcion?: Date
  imagen_url?: string
  banner_url?: string
  pdf_url?: string
  es_publico?: boolean
  es_gratuito?: boolean
  costo_inscripcion?: number
  moneda?: string
  id_competition?: string
}

export interface UpdateTorneoData extends Partial<CreateTorneoData> {
  equipos_inscritos?: number
}

export interface TorneoFilters {
  search?: string
  tipo_torneo?: string
  categoria?: string
  genero?: string
  estado?: string
  pais?: string
  es_publico?: boolean
  es_gratuito?: boolean
  fecha_inicio_desde?: Date
  fecha_inicio_hasta?: Date
}

export class TournamentService {
  // Obtener todos los torneos con filtros
  static async getTorneos(filters: TorneoFilters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } },
        { organizador: { contains: filters.search, mode: 'insensitive' } }
      ]
    }
    
    if (filters.tipo_torneo) {
      where.tipo_torneo = filters.tipo_torneo
    }
    
    if (filters.categoria) {
      where.categoria = filters.categoria
    }
    
    if (filters.genero) {
      where.genero = filters.genero
    }
    
    if (filters.estado) {
      where.estado = filters.estado
    }
    
    if (filters.pais) {
      where.pais = filters.pais
    }
    
    if (filters.es_publico !== undefined) {
      where.es_publico = filters.es_publico
    }
    
    if (filters.es_gratuito !== undefined) {
      where.es_gratuito = filters.es_gratuito
    }
    
    if (filters.fecha_inicio_desde || filters.fecha_inicio_hasta) {
      where.fecha_inicio = {}
      if (filters.fecha_inicio_desde) {
        where.fecha_inicio.gte = filters.fecha_inicio_desde
      }
      if (filters.fecha_inicio_hasta) {
        where.fecha_inicio.lte = filters.fecha_inicio_hasta
      }
    }
    
    const [torneos, total] = await Promise.all([
      prisma.torneo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          competition: {
            select: {
              id_competition: true,
              competition_name: true,
              competition_country: true,
              competition_confederation: true,
              competition_tier: true,
              competition_level: true
            }
          }
        }
      }),
      prisma.torneo.count({ where })
    ])
    
    return {
      torneos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
  
  // Obtener un torneo por ID
  static async getTorneoById(id: string) {
    return await prisma.torneo.findUnique({
      where: { id_torneo: id },
      include: {
        competition: {
          select: {
            id_competition: true,
            competition_name: true,
            competition_country: true,
            competition_confederation: true,
            competition_tier: true,
            competition_level: true
          }
        }
      }
    })
  }
  
  // Crear un nuevo torneo
  static async createTorneo(data: CreateTorneoData) {
    try {
      return await prisma.torneo.create({
        data: {
          ...data,
          equipos_inscritos: 0,
          estado: data.estado || 'planificado',
          es_publico: data.es_publico ?? true,
          es_gratuito: data.es_gratuito ?? false,
          moneda: data.moneda || 'EUR'
        }
      })
    } catch (error) {
      console.error('Error creating torneo in database:', error)
      throw error
    }
  }
  
  // Actualizar un torneo
  static async updateTorneo(id: string, data: UpdateTorneoData) {
    return await prisma.torneo.update({
      where: { id_torneo: id },
      data
    })
  }
  
  // Eliminar un torneo
  static async deleteTorneo(id: string) {
    return await prisma.torneo.delete({
      where: { id_torneo: id }
    })
  }
  
  // Obtener opciones de filtros
  static async getFilterOptions() {
    const [
      tiposTorneo,
      categorias,
      generos,
      estados,
      paises
    ] = await Promise.all([
      prisma.torneo.findMany({
        select: { tipo_torneo: true },
        distinct: ['tipo_torneo'],
        where: { tipo_torneo: { not: null } }
      }),
      prisma.torneo.findMany({
        select: { categoria: true },
        distinct: ['categoria'],
        where: { categoria: { not: null } }
      }),
      prisma.torneo.findMany({
        select: { genero: true },
        distinct: ['genero']
      }),
      prisma.torneo.findMany({
        select: { estado: true },
        distinct: ['estado']
      }),
      prisma.torneo.findMany({
        select: { pais: true },
        distinct: ['pais'],
        where: { pais: { not: null } }
      })
    ])
    
    return {
      tiposTorneo: tiposTorneo.map(t => t.tipo_torneo).filter(Boolean),
      categorias: categorias.map(c => c.categoria).filter(Boolean),
      generos: generos.map(g => g.genero),
      estados: estados.map(e => e.estado),
      paises: paises.map(p => p.pais).filter(Boolean)
    }
  }
  
  // Obtener torneos públicos para mostrar a los miembros
  static async getTorneosPublicos(filters: Omit<TorneoFilters, 'es_publico'> = {}, page = 1, limit = 10) {
    return await this.getTorneos({ ...filters, es_publico: true }, page, limit)
  }
  
  // Obtener todas las competiciones disponibles
  static async getCompeticiones() {
    return await prisma.competicion.findMany({
      select: {
        id_competition: true,
        competition_name: true,
        competition_country: true,
        competition_confederation: true,
        competition_tier: true,
        competition_level: true
      },
      orderBy: { competition_name: 'asc' }
    })
  }
}
