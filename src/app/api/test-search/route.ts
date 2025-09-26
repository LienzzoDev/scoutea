import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const term = searchParams.get('term') || 'test'
    
    console.log('🧪 Testing search functionality for term:', term)
    
    // Probar búsqueda de jugadores
    const playersUrl = `/api/players?page=1&limit=5&filters[player_name]=${encodeURIComponent(term)}`
    console.log('🔍 Testing players search URL:', playersUrl)
    
    // Probar búsqueda de scouts
    const scoutsUrl = `/api/scouts?page=1&limit=5&search=${encodeURIComponent(term)}`
    console.log('🔍 Testing scouts search URL:', scoutsUrl)
    
    // Simular las llamadas que hace la navbar
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const [playersResponse, scoutsResponse] = await Promise.all([
      fetch(`${baseUrl}${playersUrl}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        console.error('❌ Players fetch error:', error)
        return { ok: false, error: error.message }
      }),
      fetch(`${baseUrl}${scoutsUrl}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        console.error('❌ Scouts fetch error:', error)
        return { ok: false, error: error.message }
      })
    ])

    const playersData = playersResponse.ok ? await playersResponse.json() : { players: [], error: 'Failed to fetch players' }
    const scoutsData = scoutsResponse.ok ? await scoutsResponse.json() : { scouts: [], error: 'Failed to fetch scouts' }

    console.log('✅ Search test completed')

    return NextResponse.json({
      success: true,
      searchTerm: term,
      results: {
        players: {
          count: playersData.players?.length || 0,
          data: playersData.players || [],
          error: playersData.error || null,
          status: playersResponse.ok ? 'success' : 'error'
        },
        scouts: {
          count: scoutsData.scouts?.length || 0,
          data: scoutsData.scouts || [],
          error: scoutsData.error || null,
          status: scoutsResponse.ok ? 'success' : 'error'
        }
      },
      urls: {
        players: playersUrl,
        scouts: scoutsUrl
      }
    })
  } catch (error) {
    console.error('❌ Error testing search:', error)
    return NextResponse.json(
      { 
        error: 'Error testing search',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}