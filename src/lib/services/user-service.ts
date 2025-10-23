import { Usuario } from '@prisma/client'

import { prisma } from '@/lib/db'

export interface CreateUserData {
  clerkId: string
  email: string
  firstName: string
  lastName: string
  dateOfBirth?: Date
  address?: string
  city?: string
  country?: string
  profileCompleted?: boolean
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  dateOfBirth?: Date
  address?: string
  city?: string
  country?: string
  profileCompleted?: boolean
  subscription?: any
}

export class UserService {
  /**
   * Obtener usuario por ID de Clerk
   */
  static async getUserByClerkId(clerkId: string): Promise<Usuario | null> {
    try {
      return await prisma.usuario.findUnique({
        where: { clerkId }
      })
    } catch (error) {
      console.error('Error getting user by Clerk ID:', error)
      throw error
    }
  }

  /**
   * Obtener usuario por email
   */
  static async getUserByEmail(email: string): Promise<Usuario | null> {
    try {
      return await prisma.usuario.findUnique({
        where: { email }
      })
    } catch (error) {
      console.error('Error getting user by email:', error)
      throw error
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async createUser(userData: CreateUserData): Promise<Usuario> {
    try {
      return await prisma.usuario.create({
        data: {
          clerkId: userData.clerkId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          address: userData.address,
          city: userData.city,
          country: userData.country,
          profileCompleted: userData.profileCompleted || false
        }
      })
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Actualizar usuario por Clerk ID
   */
  static async updateUser(clerkId: string, updates: UpdateUserData): Promise<Usuario> {
    try {
      return await prisma.usuario.update({
        where: { clerkId },
        data: updates
      })
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  /**
   * Crear o actualizar usuario (upsert)
   */
  static async upsertUser(userData: CreateUserData): Promise<Usuario> {
    try {
      return await prisma.usuario.upsert({
        where: { clerkId: userData.clerkId },
        update: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          address: userData.address,
          city: userData.city,
          country: userData.country,
          profileCompleted: userData.profileCompleted
        },
        create: {
          clerkId: userData.clerkId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          address: userData.address,
          city: userData.city,
          country: userData.country,
          profileCompleted: userData.profileCompleted || false
        }
      })
    } catch (error) {
      console.error('Error upserting user:', error)
      throw error
    }
  }

  /**
   * Eliminar usuario y sus registros relacionados (Scout, etc.)
   */
  static async deleteUser(clerkId: string): Promise<Usuario> {
    try {
      // Usar una transacción para eliminar todo de forma atómica
      return await prisma.$transaction(async (tx) => {
        // 1. Buscar scout si existe
        const scout = await tx.scout.findUnique({
          where: { clerkId }
        })

        if (scout) {
          console.log(`Deleting scout with clerkId: ${clerkId}, scout_id: ${scout.id_scout}`)

          // 1.1. Desvincular reportes del scout (soft delete - preservar valor histórico)
          const reportCount = await tx.reporte.count({
            where: { scout_id: scout.id_scout }
          })

          if (reportCount > 0) {
            console.log(`Setting ${reportCount} reports to orphaned status`)
            await tx.reporte.updateMany({
              where: { scout_id: scout.id_scout },
              data: { scout_id: null }
            })
          }

          // 1.2. Eliminar listas de scouts (ScoutList) - se hace automáticamente con onDelete: Cascade
          // 1.3. Eliminar mensajes de contacto (ScoutContactMessage) - se hace automáticamente con onDelete: Cascade

          // 1.4. Eliminar el scout
          await tx.scout.delete({
            where: { clerkId }
          })
          console.log(`Scout deleted successfully: ${clerkId}`)
        }

        // 2. Eliminar usuario de la tabla Usuario
        // PlayerList y otras relaciones con onDelete: Cascade se eliminarán automáticamente
        const deletedUser = await tx.usuario.delete({
          where: { clerkId }
        })

        console.log(`User and all related data deleted successfully from database: ${clerkId}`)
        return deletedUser
      })
    } catch (error) {
      console.error('Error deleting user and related records:', error)
      throw error
    }
  }
}