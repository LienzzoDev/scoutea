import type { JobOffer as PrismaJobOffer } from '@prisma/client'

import { prisma } from '@/lib/db'
import type {
  JobOffer,
  CreateJobOfferInput,
  JobOfferFilters,
  JobOffersResponse,
} from '@/types/job-offer'

export class JobOfferService {
  /**
   * Mapea una oferta de trabajo de Prisma al tipo JobOffer de la aplicación
   */
  private static mapPrismaToJobOffer(jobOffer: PrismaJobOffer & { team?: { id_team: string; team_name: string; logo_url: string | null; team_country: string | null } | null }): JobOffer {
    return {
      id: jobOffer.id,
      title: jobOffer.title,
      category: jobOffer.category,
      description: jobOffer.description,
      short_description: jobOffer.short_description,
      team_id: jobOffer.team_id,
      team: jobOffer.team ? {
        id_team: jobOffer.team.id_team,
        team_name: jobOffer.team.team_name,
        logo_url: jobOffer.team.logo_url,
        team_country: jobOffer.team.team_country,
      } : null,
      club_name: jobOffer.club_name,
      custom_logo_url: jobOffer.custom_logo_url,
      location: jobOffer.location,
      remote_allowed: jobOffer.remote_allowed,
      position_type: jobOffer.position_type,
      contract_type: jobOffer.contract_type,
      experience_level: jobOffer.experience_level,
      salary_min: jobOffer.salary_min,
      salary_max: jobOffer.salary_max,
      salary_currency: jobOffer.salary_currency,
      salary_period: jobOffer.salary_period,
      requirements: jobOffer.requirements,
      responsibilities: jobOffer.responsibilities,
      benefits: jobOffer.benefits,
      status: jobOffer.status as 'draft' | 'published' | 'closed',
      expires_at: jobOffer.expires_at,
      contact_email: jobOffer.contact_email,
      contact_phone: jobOffer.contact_phone,
      application_url: jobOffer.application_url,
      created_by: jobOffer.created_by,
      createdAt: jobOffer.createdAt,
      updatedAt: jobOffer.updatedAt,
      views_count: jobOffer.views_count,
      applications_count: jobOffer.applications_count,
    }
  }

  /**
   * Obtiene todas las ofertas de trabajo con filtros opcionales
   */
  static async getJobOffers(filters: JobOfferFilters = {}): Promise<JobOffersResponse> {
    const {
      status,
      position_type,
      contract_type,
      experience_level,
      team_id,
      remote_allowed,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters

    // Construir condiciones de filtro
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (status) where.status = status
    if (position_type) where.position_type = position_type
    if (contract_type) where.contract_type = contract_type
    if (experience_level) where.experience_level = experience_level
    if (team_id) where.team_id = team_id
    if (remote_allowed !== undefined) where.remote_allowed = remote_allowed

    // Búsqueda en título y descripción
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Paginación
    const skip = (page - 1) * limit

    // Obtener ofertas y total
    const [jobOffers, total] = await Promise.all([
      prisma.jobOffer.findMany({
        where,
        include: {
          team: {
            select: {
              id_team: true,
              team_name: true,
              logo_url: true,
              team_country: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.jobOffer.count({ where }),
    ])

    return {
      jobOffers: jobOffers.map(this.mapPrismaToJobOffer),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Obtiene una oferta de trabajo por ID
   */
  static async getJobOfferById(id: string): Promise<JobOffer | null> {
    const jobOffer = await prisma.jobOffer.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id_team: true,
            team_name: true,
            logo_url: true,
            team_country: true,
          },
        },
      },
    })

    if (!jobOffer) return null

    return this.mapPrismaToJobOffer(jobOffer)
  }

  /**
   * Crea una nueva oferta de trabajo
   */
  static async createJobOffer(data: CreateJobOfferInput, createdBy: string): Promise<JobOffer> {
    const jobOffer = await prisma.jobOffer.create({
      data: {
        ...data,
        created_by: createdBy,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
      },
      include: {
        team: {
          select: {
            id_team: true,
            team_name: true,
            logo_url: true,
            team_country: true,
          },
        },
      },
    })

    return this.mapPrismaToJobOffer(jobOffer)
  }

  /**
   * Actualiza una oferta de trabajo existente
   */
  static async updateJobOffer(id: string, data: Partial<CreateJobOfferInput>): Promise<JobOffer> {
    // Filtrar undefined para evitar problemas con exactOptionalPropertyTypes
    // Filtrar undefined para evitar problemas con exactOptionalPropertyTypes
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as any

    // Manejar conversión de fecha si existe
    if (data.expires_at) {
      cleanData.expires_at = new Date(data.expires_at)
    }

    const jobOffer = await prisma.jobOffer.update({
      where: { id },
      data: cleanData,
      include: {
        team: {
          select: {
            id_team: true,
            team_name: true,
            logo_url: true,
            team_country: true,
          },
        },
      },
    })

    return this.mapPrismaToJobOffer(jobOffer)
  }

  /**
   * Elimina una oferta de trabajo
   */
  static async deleteJobOffer(id: string): Promise<void> {
    await prisma.jobOffer.delete({
      where: { id },
    })
  }

  /**
   * Incrementa el contador de vistas de una oferta
   */
  static async incrementViews(id: string): Promise<void> {
    await prisma.jobOffer.update({
      where: { id },
      data: {
        views_count: {
          increment: 1,
        },
      },
    })
  }

  /**
   * Incrementa el contador de aplicaciones de una oferta
   */
  static async incrementApplications(id: string): Promise<void> {
    await prisma.jobOffer.update({
      where: { id },
      data: {
        applications_count: {
          increment: 1,
        },
      },
    })
  }

  /**
   * Obtiene ofertas publicadas y no expiradas (para scouts)
   */
  static async getPublishedJobOffers(filters: Omit<JobOfferFilters, 'status'> = {}): Promise<JobOffersResponse> {
    return this.getJobOffers({
      ...filters,
      status: 'published',
    })
  }

  /**
   * Cierra ofertas expiradas automáticamente
   */
  static async closeExpiredOffers(): Promise<number> {
    const now = new Date()

    const result = await prisma.jobOffer.updateMany({
      where: {
        status: 'published',
        expires_at: {
          lte: now,
        },
      },
      data: {
        status: 'closed',
      },
    })

    return result.count
  }
}
