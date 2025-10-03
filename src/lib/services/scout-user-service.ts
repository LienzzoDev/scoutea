import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class ScoutUserService {
  /**
   * Vincula un usuario de Clerk con un scout existente por email
   */
  static async linkUserToScout(clerkId: string, email: string) {
    try {
      // Buscar scout por email
      const scout = await prisma.scout.findFirst({
        where: {
          email: email,
          clerkId: null, // Solo scouts que no estén ya vinculados
        },
      })

      if (!scout) {
        return {
          success: false,
          error: 'No se encontró un scout con ese email o ya está vinculado a otro usuario',
        }
      }

      // Vincular el scout con el clerkId
      const updatedScout = await prisma.scout.update({
        where: {
          id_scout: scout.id_scout,
        },
        data: {
          clerkId: clerkId,
        },
        select: {
          id_scout: true,
          scout_name: true,
          name: true,
          surname: true,
          email: true,
          nationality: true,
          country: true,
          favourite_club: true,
          open_to_work: true,
          professional_experience: true,
          total_reports: true,
          roi: true,
          net_profits: true,
          scout_level: true,
          scout_ranking: true,
          createdAt: true,
        },
      })

      return {
        success: true,
        scout: updatedScout,
      }
    } catch (error) {
      console.error('Error linking user to scout:', error)
      return {
        success: false,
        error: 'Error interno del servidor',
      }
    }
  }

  /**
   * Obtiene el scout vinculado a un usuario de Clerk
   */
  static async getScoutByClerkId(clerkId: string) {
    try {
      const scout = await prisma.scout.findUnique({
        where: {
          clerkId: clerkId,
        },
        select: {
          id_scout: true,
          scout_name: true,
          name: true,
          surname: true,
          email: true,
          nationality: true,
          country: true,
          favourite_club: true,
          open_to_work: true,
          professional_experience: true,
          total_reports: true,
          roi: true,
          net_profits: true,
          scout_level: true,
          scout_ranking: true,
          createdAt: true,
        },
      })

      return scout
    } catch (error) {
      console.error('Error getting scout by clerkId:', error)
      return null
    }
  }

  /**
   * Crea un nuevo scout y lo vincula con un usuario de Clerk
   */
  static async createScoutForUser(clerkId: string, userData: {
    email: string
    firstName: string
    lastName: string
  }) {
    try {
      console.log('🔍 Creating scout with data:', { clerkId, userData })
      
      const scout = await prisma.scout.create({
        data: {
          clerkId: clerkId,
          email: userData.email,
          name: userData.firstName,
          surname: userData.lastName,
          scout_name: `${userData.firstName} ${userData.lastName}`,
          join_date: new Date(),
          total_reports: 0,
          original_reports: 0,
          roi: 0,
          net_profits: 0,
        },
        select: {
          id_scout: true,
          scout_name: true,
          name: true,
          surname: true,
          email: true,
          nationality: true,
          country: true,
          favourite_club: true,
          open_to_work: true,
          professional_experience: true,
          total_reports: true,
          roi: true,
          net_profits: true,
          scout_level: true,
          scout_ranking: true,
          createdAt: true,
        },
      })

      console.log('✅ Scout created successfully:', scout)

      return {
        success: true,
        scout,
      }
    } catch (error) {
      console.error('❌ Error creating scout for user:', error)
      return {
        success: false,
        error: 'Error al crear el scout',
      }
    }
  }

  /**
   * Verifica si un usuario tiene un scout vinculado y lo crea si no existe
   */
  static async ensureScoutExists(clerkId: string, userData: {
    email: string
    firstName: string
    lastName: string
  }) {
    try {
      console.log('🔍 ensureScoutExists - clerkId:', clerkId)
      console.log('🔍 ensureScoutExists - userData:', userData)

      // Primero intentar obtener el scout existente
      let scout = await this.getScoutByClerkId(clerkId)
      console.log('🔍 Existing scout found:', !!scout)

      if (!scout) {
        console.log('🔍 No existing scout, trying to link by email...')
        // Si no existe, intentar vincularlo por email
        const linkResult = await this.linkUserToScout(clerkId, userData.email)
        console.log('🔍 Link result:', linkResult)
        
        if (linkResult.success) {
          scout = linkResult.scout
          console.log('✅ Successfully linked existing scout')
        } else {
          console.log('🔍 Link failed, creating new scout...')
          // Si no se puede vincular, crear uno nuevo
          const createResult = await this.createScoutForUser(clerkId, userData)
          console.log('🔍 Create result:', createResult)
          
          if (createResult.success) {
            scout = createResult.scout
            console.log('✅ Successfully created new scout')
          } else {
            console.log('❌ Failed to create scout:', createResult.error)
            return null
          }
        }
      }

      console.log('🔍 Final scout:', scout)
      return scout
    } catch (error) {
      console.error('❌ Error in ensureScoutExists:', error)
      return null
    }
  }

  /**
   * Obtiene estadísticas básicas de un scout
   */
  static async getScoutStats(scoutId: string) {
    try {
      const scout = await prisma.scout.findUnique({
        where: {
          id_scout: scoutId,
        },
        select: {
          total_reports: true,
          roi: true,
          net_profits: true,
          scout_level: true,
          scout_ranking: true,
        },
      })

      return scout
    } catch (error) {
      console.error('Error getting scout stats:', error)
      return null
    }
  }
}