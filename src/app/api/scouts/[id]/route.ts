import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { ScoutService } from '@/lib/services/scout-service'

export async function GET(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const scout = await ScoutService.getScoutById(params.id)
    
    if (!scout) {
      return NextResponse.json({ __error: 'Scout not found' }, { status: 404 })
    }
    
    return NextResponse.json(scout)
  } catch (_error) {
    console.error('Error getting scout:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const _body = await request.json()
    const scout = await ScoutService.updateScout(params.id, body)
    
    return NextResponse.json(scout)
  } catch (_error) {
    console.error('Error updating scout:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    await ScoutService.deleteScout(params.id)
    
    return NextResponse.json({ message: 'Scout deleted successfully' })
  } catch (_error) {
    console.error('Error deleting scout:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
