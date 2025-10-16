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
   * Eliminar usuario
   */
  static async deleteUser(clerkId: string): Promise<Usuario> {
    try {
      return await prisma.usuario.delete({
        where: { clerkId }
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }
}