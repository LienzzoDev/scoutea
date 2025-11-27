/**
 * Scout-Clerk Synchronization Service
 *
 * Mantiene la sincronización entre scouts en la base de datos y usuarios en Clerk.
 * Limpia scouts huérfanos (usuarios eliminados de Clerk).
 */

import { clerkClient } from '@clerk/nextjs/server'

import { prisma } from '@/lib/db'

export class ScoutClerkSyncService {
  /**
   * Verifica si un usuario existe en Clerk
   * @param clerkId - ID del usuario en Clerk
   * @param excludeAdmins - Si es true, excluye usuarios admin (default: false)
   */
  static async userExistsInClerk(clerkId: string, excludeAdmins = false): Promise<boolean> {
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(clerkId)

      if (!user) return false

      // Verificar que el usuario NO sea admin (solo si excludeAdmins es true)
      if (excludeAdmins) {
        const role = user.publicMetadata?.role as string | undefined
        if (role === 'admin') {
          console.log(`User ${clerkId} is admin - excluding from scout list`)
          return false
        }
      }

      return true
    } catch (error) {
      // Si el usuario no existe, Clerk lanza un error
      console.log(`User ${clerkId} not found in Clerk`)
      return false
    }
  }

  /**
   * Obtiene todos los scouts con clerkId
   */
  static async getScoutsWithClerkId(): Promise<{ id_scout: string; clerkId: string }[]> {
    const scouts = await prisma.scout.findMany({
      where: {
        clerkId: {
          not: null
        }
      },
      select: {
        id_scout: true,
        clerkId: true
      }
    })

    return scouts.filter(s => s.clerkId !== null) as { id_scout: string; clerkId: string }[]
  }

  /**
   * Elimina un scout de la base de datos
   */
  static async deleteScout(scoutId: string): Promise<void> {
    try {
      // Primero eliminar reportes del scout (si hay relación)
      await prisma.reporte.deleteMany({
        where: { scout_id: scoutId }
      })

      // Luego eliminar el scout
      await prisma.scout.delete({
        where: { id_scout: scoutId }
      })

      console.log(`✅ Scout ${scoutId} deleted successfully`)
    } catch (error) {
      console.error(`❌ Error deleting scout ${scoutId}:`, error)
      throw error
    }
  }

  /**
   * Sincroniza scouts con Clerk - elimina scouts de usuarios que ya no existen o son admins
   *
   * @param dryRun - Si es true, solo reporta scouts a eliminar sin eliminarlos
   * @returns Lista de scouts eliminados o a eliminar
   */
  static async syncScoutsWithClerk(dryRun = false): Promise<{
    scoutsChecked: number
    scoutsToDelete: string[]
    scoutsDeleted: string[]
    errors: { scoutId: string; error: string }[]
  }> {
    const result = {
      scoutsChecked: 0,
      scoutsToDelete: [] as string[],
      scoutsDeleted: [] as string[],
      errors: [] as { scoutId: string; error: string }[]
    }

    try {
      console.log(`🔄 Starting scout-Clerk sync (${dryRun ? 'DRY RUN' : 'LIVE'})...`)

      // Obtener todos los scouts con clerkId
      const scouts = await this.getScoutsWithClerkId()
      result.scoutsChecked = scouts.length

      console.log(`📊 Found ${scouts.length} scouts with clerkId`)

      // Verificar cada scout en Clerk
      for (const scout of scouts) {
        try {
          // Para sync, excluimos admins (queremos eliminar scouts de admin users)
          const exists = await this.userExistsInClerk(scout.clerkId, true)

          if (!exists) {
            console.log(`⚠️  Scout ${scout.id_scout} (Clerk: ${scout.clerkId}) - User not found in Clerk`)
            result.scoutsToDelete.push(scout.id_scout)

            if (!dryRun) {
              await this.deleteScout(scout.id_scout)
              result.scoutsDeleted.push(scout.id_scout)
              console.log(`✅ Deleted orphaned scout ${scout.id_scout}`)
            }
          } else {
            console.log(`✅ Scout ${scout.id_scout} - User exists in Clerk`)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`❌ Error checking scout ${scout.id_scout}:`, errorMessage)
          result.errors.push({
            scoutId: scout.id_scout,
            error: errorMessage
          })
        }
      }

      console.log(`✨ Sync complete:`, {
        checked: result.scoutsChecked,
        toDelete: result.scoutsToDelete.length,
        deleted: result.scoutsDeleted.length,
        errors: result.errors.length
      })

      return result
    } catch (error) {
      console.error('❌ Fatal error during scout-Clerk sync:', error)
      throw error
    }
  }

  /**
   * Validación rápida: verifica solo los scouts que se van a mostrar
   * Devuelve IDs de scouts que deben ser filtrados (usuarios eliminados o admins)
   */
  static async getOrphanedScoutIds(scoutIds: string[]): Promise<string[]> {
    const orphanedIds: string[] = []

    // Obtener scouts con clerkId
    const scouts = await prisma.scout.findMany({
      where: {
        id_scout: {
          in: scoutIds
        },
        clerkId: {
          not: null
        }
      },
      select: {
        id_scout: true,
        clerkId: true
      }
    })

    // Verificar en Clerk (en paralelo para mejor performance)
    const checks = scouts
      .filter(s => s.clerkId !== null)
      .map(async (scout) => {
      const exists = await this.userExistsInClerk(scout.clerkId!)
      if (!exists) {
        orphanedIds.push(scout.id_scout)
      }
    })

    await Promise.all(checks)

    return orphanedIds
  }
}
