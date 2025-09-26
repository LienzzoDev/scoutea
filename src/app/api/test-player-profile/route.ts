import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing player profile functionality...')
    
    // Simular datos de jugador para prueba
    const mockPlayer = {
      id_player: "1000",
      player_name: "Kylian Mbappé",
      team_name: "Paris Saint-Germain",
      position_player: "Delantero",
      nationality_1: "France",
      player_rating: 95
    }

    console.log('✅ Player profile test successful')

    return NextResponse.json({
      success: true,
      message: 'Player profile functionality working',
      mockPlayer
    })
  } catch (error) {
    console.error('❌ Error testing player profile:', error)
    return NextResponse.json(
      { 
        error: 'Error testing player profile',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}