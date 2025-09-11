import { NextRequest, NextResponse } from 'next/server'
import { TournamentService, TorneoFilters } from '@/lib/db/tournament-service'

// GET /api/torneos - Obtener torneos con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: TorneoFilters = {}
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Aplicar filtros
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }
    if (searchParams.get('tipo_torneo')) {
      filters.tipo_torneo = searchParams.get('tipo_torneo')!
    }
    if (searchParams.get('categoria')) {
      filters.categoria = searchParams.get('categoria')!
    }
    if (searchParams.get('genero')) {
      filters.genero = searchParams.get('genero')!
    }
    if (searchParams.get('estado')) {
      filters.estado = searchParams.get('estado')!
    }
    if (searchParams.get('pais')) {
      filters.pais = searchParams.get('pais')!
    }
    if (searchParams.get('es_publico')) {
      filters.es_publico = searchParams.get('es_publico') === 'true'
    }
    if (searchParams.get('es_gratuito')) {
      filters.es_gratuito = searchParams.get('es_gratuito') === 'true'
    }
    if (searchParams.get('fecha_inicio_desde')) {
      filters.fecha_inicio_desde = new Date(searchParams.get('fecha_inicio_desde')!)
    }
    if (searchParams.get('fecha_inicio_hasta')) {
      filters.fecha_inicio_hasta = new Date(searchParams.get('fecha_inicio_hasta')!)
    }
    
    const result = await TournamentService.getTorneos(filters, page, limit)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/torneos - Crear nuevo torneo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validaciones básicas
    if (!body.nombre) {
      return NextResponse.json(
        { error: 'El nombre del torneo es requerido' },
        { status: 400 }
      )
    }
    
    if (!body.fecha_inicio || !body.fecha_fin) {
      return NextResponse.json(
        { error: 'Las fechas de inicio y fin son requeridas' },
        { status: 400 }
      )
    }
    
    if (new Date(body.fecha_inicio) >= new Date(body.fecha_fin)) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      )
    }
    
    if (!body.tipo_torneo) {
      return NextResponse.json(
        { error: 'El tipo de torneo es requerido' },
        { status: 400 }
      )
    }
    
    if (!body.genero) {
      return NextResponse.json(
        { error: 'El género es requerido' },
        { status: 400 }
      )
    }
    
    // Convertir fechas a objetos Date
    const fechaInicio = new Date(body.fecha_inicio)
    const fechaFin = new Date(body.fecha_fin)
    
    // Validar que las fechas son válidas
    if (isNaN(fechaInicio.getTime())) {
      return NextResponse.json(
        { error: 'La fecha de inicio no es válida' },
        { status: 400 }
      )
    }
    
    if (isNaN(fechaFin.getTime())) {
      return NextResponse.json(
        { error: 'La fecha de fin no es válida' },
        { status: 400 }
      )
    }
    
    const torneo = await TournamentService.createTorneo({
      ...body,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      fecha_limite_inscripcion: body.fecha_limite_inscripcion ? new Date(body.fecha_limite_inscripcion) : undefined,
      id_competition: body.id_competition && body.id_competition.trim() !== '' ? body.id_competition : undefined
    })
    
    return NextResponse.json(torneo, { status: 201 })
  } catch (error) {
    console.error('Error creating tournament:', error)
    
    // Proporcionar más detalles del error en desarrollo
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('Detailed error:', errorMessage)
    
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? errorMessage : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
