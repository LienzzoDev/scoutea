import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { CompetitionService } from '@/lib/services/competition-service'

export async function GET(
  __request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const competition = await CompetitionService.getCompetitionById(id)
    
    if (!competition) {
      return NextResponse.json({ __error: 'Competition not found' }, { status: 404 })
    }
    
    return NextResponse.json(competition)
  } catch (error) {
    console.error('Error getting competition:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const competition = await CompetitionService.updateCompetition(id, body)
    
    return NextResponse.json(competition)
  } catch (error) {
    console.error('Error updating competition:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  __request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await CompetitionService.deleteCompetition(id)
    
    return NextResponse.json({ message: 'Competition deleted successfully' })
  } catch (error) {
    console.error('Error deleting competition:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
