import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { getUserRoleInfo } from '@/lib/auth/role-utils'
import { ScoutClerkSyncService } from '@/lib/services/scout-clerk-sync'

/**
 * POST /api/admin/scouts/sync
 *
 * Sincroniza scouts con Clerk - elimina scouts de usuarios que ya no existen
 *
 * Solo accesible por administradores
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const roleInfo = getUserRoleInfo({ publicMetadata: { role: 'admin' } } as any)
    if (roleInfo.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { dryRun = false } = body

    console.log(`🔄 Admin sync request - ${dryRun ? 'DRY RUN' : 'LIVE MODE'}`)

    // Ejecutar sincronización
    const result = await ScoutClerkSyncService.syncScoutsWithClerk(dryRun)

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Dry run complete - ${result.scoutsToDelete.length} scouts would be deleted`
        : `Sync complete - ${result.scoutsDeleted.length} scouts deleted`,
      data: result
    })
  } catch (error) {
    console.error('❌ Error in scout sync:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/scouts/sync
 *
 * Obtiene el estado de la sincronización (DRY RUN)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const roleInfo = getUserRoleInfo({ publicMetadata: { role: 'admin' } } as any)
    if (roleInfo.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Ejecutar en modo dry run
    const result = await ScoutClerkSyncService.syncScoutsWithClerk(true)

    return NextResponse.json({
      success: true,
      message: `Found ${result.scoutsToDelete.length} orphaned scouts`,
      data: result
    })
  } catch (error) {
    console.error('❌ Error checking scout sync:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
