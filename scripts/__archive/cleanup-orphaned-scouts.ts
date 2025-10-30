/**
 * Script para limpiar scouts huérfanos de la base de datos
 * Elimina scouts cuyos usuarios ya no existen en Clerk
 *
 * Uso:
 *   npx tsx scripts/cleanup-orphaned-scouts.ts --dry-run   # Ver qué se eliminaría
 *   npx tsx scripts/cleanup-orphaned-scouts.ts             # Ejecutar limpieza
 */

import { clerkClient } from '@clerk/nextjs/server'

import { prisma } from '../src/lib/db'

interface OrphanedScout {
  id_scout: string
  clerkId: string | null
  scout_name: string | null
  email: string | null
  reportCount: number
  reason: string
}

async function checkUserExistsInClerk(clerkId: string): Promise<boolean> {
  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(clerkId)

    if (!user) return false

    // Verificar que NO sea admin (admins no deberían aparecer como scouts)
    const role = user.publicMetadata?.role as string | undefined
    if (role === 'admin') {
      console.log(`  ℹ️  User ${clerkId} is admin - should be removed from scouts`)
      return false
    }

    return true
  } catch (error) {
    console.log(`  ℹ️  User ${clerkId} not found in Clerk`)
    return false
  }
}

async function findOrphanedScouts(): Promise<OrphanedScout[]> {
  console.log('🔍 Finding orphaned scouts...\n')

  // Obtener todos los scouts
  const allScouts = await prisma.scout.findMany({
    select: {
      id_scout: true,
      clerkId: true,
      scout_name: true,
      email: true,
    }
  })

  console.log(`📊 Total scouts in database: ${allScouts.length}\n`)

  const orphanedScouts: OrphanedScout[] = []

  for (const scout of allScouts) {
    if (!scout.clerkId) {
      // Scout sin clerkId
      const reportCount = await prisma.reporte.count({
        where: { scout_id: scout.id_scout }
      })

      orphanedScouts.push({
        id_scout: scout.id_scout,
        clerkId: scout.clerkId,
        scout_name: scout.scout_name,
        email: scout.email,
        reportCount,
        reason: 'No Clerk ID'
      })
      continue
    }

    // Verificar si el usuario existe en Clerk
    const exists = await checkUserExistsInClerk(scout.clerkId)

    if (!exists) {
      const reportCount = await prisma.reporte.count({
        where: { scout_id: scout.id_scout }
      })

      orphanedScouts.push({
        id_scout: scout.id_scout,
        clerkId: scout.clerkId,
        scout_name: scout.scout_name,
        email: scout.email,
        reportCount,
        reason: 'User deleted from Clerk or is admin'
      })
    }
  }

  return orphanedScouts
}

async function deleteOrphanedScouts(scouts: OrphanedScout[]): Promise<void> {
  console.log(`\n🗑️  Deleting ${scouts.length} orphaned scouts...\n`)

  await prisma.$transaction(async (tx) => {
    for (const scout of scouts) {
      console.log(`\n🗑️  Deleting scout: ${scout.scout_name || 'Unknown'} (${scout.clerkId || 'No ID'})`)
      console.log(`   Email: ${scout.email || 'No email'}`)
      console.log(`   Reports: ${scout.reportCount}`)
      console.log(`   Reason: ${scout.reason}`)

      // 1. Desvincular reportes (soft delete - preservar histórico)
      if (scout.reportCount > 0) {
        console.log(`   📄 Setting ${scout.reportCount} reports to orphaned status`)
        await tx.reporte.updateMany({
          where: { scout_id: scout.id_scout },
          data: { scout_id: null }
        })
      }

      // 2. Eliminar el scout
      await tx.scout.delete({
        where: { id_scout: scout.id_scout }
      })

      console.log(`   ✅ Scout deleted successfully`)
    }
  })

  console.log(`\n✅ Successfully deleted ${scouts.length} orphaned scouts`)
}

async function cleanupOrphanedUsers(): Promise<void> {
  console.log('🔍 Finding orphaned users in Usuario table...\n')

  const allUsers = await prisma.usuario.findMany({
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
    }
  })

  console.log(`📊 Total users in database: ${allUsers.length}\n`)

  const orphanedUsers = []

  for (const user of allUsers) {
    try {
      const clerk = await clerkClient()
      await clerk.users.getUser(user.clerkId)
    } catch (error) {
      console.log(`  ℹ️  User ${user.clerkId} (${user.email}) not found in Clerk`)
      orphanedUsers.push(user)
    }
  }

  if (orphanedUsers.length === 0) {
    console.log('\n✅ No orphaned users found in Usuario table')
    return
  }

  console.log(`\n⚠️  Found ${orphanedUsers.length} orphaned users in Usuario table\n`)

  for (const user of orphanedUsers) {
    console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`)
  }

  if (process.argv.includes('--dry-run')) {
    console.log('\n💡 Use without --dry-run to delete these users')
    return
  }

  console.log(`\n🗑️  Deleting ${orphanedUsers.length} orphaned users...\n`)

  for (const user of orphanedUsers) {
    try {
      console.log(`🗑️  Deleting user: ${user.firstName} ${user.lastName} (${user.email})`)

      // Buscar scout asociado
      const scout = await prisma.scout.findUnique({
        where: { clerkId: user.clerkId }
      })

      if (scout) {
        console.log(`   Found associated scout: ${scout.scout_name}`)

        // Desvincular reportes
        const reportCount = await prisma.reporte.count({
          where: { scout_id: scout.id_scout }
        })

        if (reportCount > 0) {
          console.log(`   📄 Setting ${reportCount} reports to orphaned status`)
          await prisma.reporte.updateMany({
            where: { scout_id: scout.id_scout },
            data: { scout_id: null }
          })
        }

        // Eliminar scout
        await prisma.scout.delete({
          where: { clerkId: user.clerkId }
        })
        console.log(`   ✅ Scout deleted`)
      }

      // Eliminar usuario
      await prisma.usuario.delete({
        where: { clerkId: user.clerkId }
      })
      console.log(`   ✅ User deleted\n`)

    } catch (error) {
      console.error(`   ❌ Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    }
  }

  console.log(`✅ Cleanup completed`)
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')

  console.log('═══════════════════════════════════════════════════════')
  console.log('     SCOUT & USER CLEANUP - CLERK SYNCHRONIZATION     ')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '🗑️  DELETE MODE'}`)
  console.log('═══════════════════════════════════════════════════════\n')

  try {
    // 1. Limpiar scouts huérfanos
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('STEP 1: Cleaning orphaned scouts')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const orphanedScouts = await findOrphanedScouts()

    if (orphanedScouts.length === 0) {
      console.log('✅ No orphaned scouts found\n')
    } else {
      console.log(`\n⚠️  Found ${orphanedScouts.length} orphaned scouts:\n`)

      orphanedScouts.forEach((scout, index) => {
        console.log(`${index + 1}. ${scout.scout_name || 'Unknown'} (${scout.clerkId || 'No ID'})`)
        console.log(`   Email: ${scout.email || 'No email'}`)
        console.log(`   Reports: ${scout.reportCount}`)
        console.log(`   Reason: ${scout.reason}\n`)
      })

      if (isDryRun) {
        console.log('💡 Run without --dry-run to delete these scouts\n')
      } else {
        await deleteOrphanedScouts(orphanedScouts)
      }
    }

    // 2. Limpiar usuarios huérfanos
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('STEP 2: Cleaning orphaned users')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await cleanupOrphanedUsers()

    console.log('\n═══════════════════════════════════════════════════════')
    console.log('                    CLEANUP COMPLETED                  ')
    console.log('═══════════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
