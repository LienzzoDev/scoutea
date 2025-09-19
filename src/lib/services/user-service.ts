import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateUserData {
  clerkId: string
  email: string
  firstName: string
  lastName: string
  nationality?: string
  dateOfBirth?: Date
  location?: string
  bio?: string
  experience?: number
  specialization?: string
  languages?: string[]
  website?: string
  linkedin?: string
  twitter?: string
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  nationality?: string
  dateOfBirth?: Date
  location?: string
  bio?: string
  experience?: number
  specialization?: string
  languages?: string[]
  website?: string
  linkedin?: string
  twitter?: string
  profileCompleted?: boolean
  subscription?: any
}

export class UserService {
  // Crear un nuevo usuario
  static async createUser(data: CreateUserData) {
    try {
      const user = await prisma.usuario.create({
        data: {
          ...data,
          profileCompleted: false
        }
      })
      return user
    } catch (_error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  // Obtener usuario por Clerk ID
  static async getUserByClerkId(clerkId: string) {
    try {
      const user = await prisma.usuario.findUnique({
        where: { clerkId }
      })
      return user
    } catch (_error) {
      console.error('Error getting user by clerk ID:', error)
      throw error
    }
  }

  // Obtener usuario por email
  static async getUserByEmail(email: string) {
    try {
      const user = await prisma.usuario.findUnique({
        where: { email }
      })
      return user
    } catch (_error) {
      console.error('Error getting user by email:', error)
      throw error
    }
  }

  // Actualizar usuario
  static async updateUser(clerkId: string, data: UpdateUserData) {
    try {
      const user = await prisma.usuario.update({
        where: { clerkId },
        data
      })
      return user
    } catch (_error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Marcar perfil como completado
  static async markProfileCompleted(clerkId: string) {
    try {
      const user = await prisma.usuario.update({
        where: { clerkId },
        data: { profileCompleted: true }
      })
      return user
    } catch (_error) {
      console.error('Error marking profile as completed:', error)
      throw error
    }
  }

  // Actualizar información de suscripción
  static async updateSubscription(clerkId: string, subscription: unknown) {
    try {
      const user = await prisma.usuario.update({
        where: { clerkId },
        data: { subscription }
      })
      return user
    } catch (_error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }

  // Verificar si el perfil está completado
  static async isProfileCompleted(clerkId: string): Promise<boolean> {
    try {
      const user = await prisma.usuario.findUnique({
        where: { clerkId },
        select: { profileCompleted: true }
      })
      return user?.profileCompleted || false
    } catch (_error) {
      console.error('Error checking profile completion:', error)
      return false
    }
  }

  // Eliminar usuario
  static async deleteUser(clerkId: string) {
    try {
      await prisma.usuario.delete({
        where: { clerkId }
      })
      return true
    } catch (_error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }
}
