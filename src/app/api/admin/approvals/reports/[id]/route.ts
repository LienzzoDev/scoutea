import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserRoleInfo } from '@/lib/auth/role-utils'
import { prisma } from '@/lib/db'

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ __error: 'User not found' }, { status: 404 })
    }

    const roleInfo = getUserRoleInfo({ publicMetadata: { role: 'admin' } })

    if (roleInfo.role !== 'admin') {
      return NextResponse.json(
        { __error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = approvalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { __error: 'Invalid request data', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const { action, rejectionReason } = validation.data
    const reportId = params.id

    // Check if report exists and is pending
    const report = await prisma.reporte.findUnique({
      where: { id_report: reportId },
    })

    if (!report) {
      return NextResponse.json(
        { __error: 'Report not found' },
        { status: 404 }
      )
    }

    if (report.approval_status !== 'pending') {
      return NextResponse.json(
        { __error: 'Report is not pending approval' },
        { status: 400 }
      )
    }

    // Update report approval status
    const updatedReport = await prisma.reporte.update({
      where: { id_report: reportId },
      data: {
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        approved_by_admin_id: user.id_usuario,
        approval_date: new Date(),
        rejection_reason: action === 'reject' ? rejectionReason || null : null,
      },
    })

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message:
        action === 'approve'
          ? 'Report approved successfully'
          : 'Report rejected',
    })
  } catch (error) {
    console.error('Error updating report approval:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
    }
    return NextResponse.json(
      { __error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
