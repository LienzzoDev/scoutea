import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ScoutService } from '@/lib/db/scout-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scout = await ScoutService.getScoutById(params.id)
    
    if (!scout) {
      return NextResponse.json({ error: 'Scout not found' }, { status: 404 })
    }
    
    return NextResponse.json(scout)
  } catch (error) {
    console.error('Error getting scout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const scout = await ScoutService.updateScout(params.id, body)
    
    return NextResponse.json(scout)
  } catch (error) {
    console.error('Error updating scout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ScoutService.deleteScout(params.id)
    
    return NextResponse.json({ message: 'Scout deleted successfully' })
  } catch (error) {
    console.error('Error deleting scout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
