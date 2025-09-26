import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Getting scout data for ID:', id)
    
    // Buscar el scout en la base de datos
    const scout = await prisma.scout.findUnique({
      where: { id_scout: id },
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        country: true,
        nationality: true,
        age: true,
        date_of_birth: true,
        join_date: true,
        favourite_club: true,
        open_to_work: true,
        professional_experience: true,
        total_reports: true,
        original_reports: true,
        nationality_expertise: true,
        competition_expertise: true,
        scout_level: true,
        scout_ranking: true,
        scout_elo: true
      }
    })

    if (!scout) {
      return NextResponse.json(
        { error: 'Scout not found', id },
        { status: 404 }
      )
    }

    // Formatear los datos del scout
    const formattedScout = {
      id: scout.id_scout,
      name: scout.scout_name || `${scout.name || ''} ${scout.surname || ''}`.trim() || 'Unknown Scout',
      country: scout.country || scout.nationality || 'Unknown',
      rating: scout.scout_level || 'N/A',
      rank: scout.scout_ranking ? `Rank ${scout.scout_ranking}` : 'N/A',
      age: scout.age?.toString() || 'N/A',
      dateOfBirth: scout.date_of_birth?.toISOString().split('T')[0] || 'N/A',
      joiningDate: scout.join_date?.toISOString().split('T')[0] || 'N/A',
      favouriteClub: scout.favourite_club || 'N/A',
      openToWork: scout.open_to_work ? 'Yes' : 'No',
      professionalExperience: scout.professional_experience || 'N/A',
      totalReports: scout.total_reports?.toString() || '0',
      originalReports: scout.original_reports?.toString() || '0',
      nationalityExpertise: scout.nationality_expertise || 'N/A',
      competitionExpertise: scout.competition_expertise || 'N/A',
      scoutElo: scout.scout_elo?.toString() || 'N/A'
    }

    console.log('✅ Scout data found:', formattedScout.name)

    return NextResponse.json({
      success: true,
      scout: formattedScout
    })
  } catch (error) {
    console.error('❌ Error getting scout data:', error)
    return NextResponse.json(
      { 
        error: 'Error getting scout data',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}