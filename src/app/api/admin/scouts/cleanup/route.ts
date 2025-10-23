import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { ScoutClerkSyncService } from '@/lib/services/scout-clerk-sync'

/**
 * Admin endpoint para eliminar scouts huérfanos
 * Elimina scouts cuyo usuario de Clerk ya no existe o es admin
 *
 * GET: Ver scouts que serían eliminados (dry run)
 * DELETE: Eliminar scouts huérfanos de la base de datos
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const { currentUser } = await import('@clerk/nextjs/server')
    const user = await currentUser()
    const role = user?.publicMetadata?.role as string | undefined

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    console.log('🔍 [Admin Cleanup] Finding orphaned scouts...')

    // Obtener todos los scouts
    const allScouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        clerkId: true,
        scout_name: true,
        email: true,
        total_reports: true
      }
    })

    console.log(`📊 [Admin Cleanup] Total scouts in database: ${allScouts.length}`)

    // Identificar scouts huérfanos
    const scoutIds = allScouts.map(s => s.id_scout)
    const orphanedIds = await ScoutClerkSyncService.getOrphanedScoutIds(scoutIds)

    // Obtener datos detallados de scouts huérfanos
    const orphanedScouts = allScouts.filter(s => orphanedIds.includes(s.id_scout))

    const orphanedWithDetails = await Promise.all(
      orphanedScouts.map(async (scout) => {
        const reportCount = await prisma.reporte.count({
          where: { scout_id: scout.id_scout }
        })

        return {
          id_scout: scout.id_scout,
          clerkId: scout.clerkId,
          scout_name: scout.scout_name,
          email: scout.email,
          reportCount,
          reason: await getOrphanReason(scout.clerkId)
        }
      })
    )

    console.log(`⚠️  [Admin Cleanup] Found ${orphanedWithDetails.length} orphaned scouts`)

    return NextResponse.json({
      success: true,
      total: allScouts.length,
      orphaned: orphanedWithDetails.length,
      scouts: orphanedWithDetails,
      message: `Found ${orphanedWithDetails.length} scouts to delete (dry run)`
    })

  } catch (error) {
    console.error('❌ [Admin Cleanup] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const { currentUser } = await import('@clerk/nextjs/server')
    const user = await currentUser()
    const role = user?.publicMetadata?.role as string | undefined

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    console.log('🗑️  [Admin Cleanup] Starting deletion of orphaned scouts...')

    // Obtener todos los scouts
    const allScouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        clerkId: true,
        scout_name: true,
        email: true
      }
    })

    console.log(`📊 [Admin Cleanup] Total scouts in database: ${allScouts.length}`)

    // Identificar scouts huérfanos
    const scoutIds = allScouts.map(s => s.id_scout)
    const orphanedIds = await ScoutClerkSyncService.getOrphanedScoutIds(scoutIds)

    console.log(`⚠️  [Admin Cleanup] Found ${orphanedIds.length} orphaned scouts to delete`)

    if (orphanedIds.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'No orphaned scouts found'
      })
    }

    // Usar transacción para eliminar todo de forma atómica
    const result = await prisma.$transaction(async (tx) => {
      const deletedScouts = []

      for (const scoutId of orphanedIds) {
        const scout = allScouts.find(s => s.id_scout === scoutId)
        if (!scout) continue

        console.log(`🗑️  Deleting scout: ${scout.scout_name} (${scout.clerkId})`)

        // 1. Desvincular reportes (soft delete - preservar histórico)
        const reportCount = await tx.reporte.count({
          where: { scout_id: scoutId }
        })

        if (reportCount > 0) {
          console.log(`  📄 Setting ${reportCount} reports to orphaned status`)
          await tx.reporte.updateMany({
            where: { scout_id: scoutId },
            data: { scout_id: null }
          })
        }

        // 2. Eliminar el scout (ScoutList y ScoutContactMessage se eliminan automáticamente)
        await tx.scout.delete({
          where: { id_scout: scoutId }
        })

        deletedScouts.push({
          id_scout: scoutId,
          clerkId: scout.clerkId,
          scout_name: scout.scout_name,
          email: scout.email,
          reportCount
        })

        console.log(`✅ Scout deleted: ${scout.scout_name}`)
      }

      return deletedScouts
    })

    console.log(`✅ [Admin Cleanup] Successfully deleted ${result.length} orphaned scouts`)

    return NextResponse.json({
      success: true,
      deleted: result.length,
      scouts: result,
      message: `Successfully deleted ${result.length} orphaned scouts`
    })

  } catch (error) {
    console.error('❌ [Admin Cleanup] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Helper para determinar por qué un scout está huérfano
 */
async function getOrphanReason(clerkId: string | null): Promise<string> {
  if (!clerkId) {
    return 'No Clerk ID'
  }

  const exists = await ScoutClerkSyncService.userExistsInClerk(clerkId)
  if (!exists) {
    return 'User deleted from Clerk or is admin'
  }

  return 'Unknown'
}
