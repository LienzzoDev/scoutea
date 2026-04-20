import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.onDemandMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      messages,
      total: messages.length,
    })
  } catch (error) {
    console.error('Error fetching on-demand messages:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
