import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const torneo = await prisma.torneo.findUnique({
      where: {
        id_torneo: id
      }
    })

    if (!torneo) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    return NextResponse.json(torneo)
  } catch (error) {
    console.error('Error fetching torneo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('🔍 Debug API - Actualizando torneo:', id)
    console.log('🔍 Debug API - Datos recibidos:', body)
    console.log('🔍 Debug API - PDF URL:', body.pdf_url)
    
    const torneo = await prisma.torneo.update({
      where: {
        id_torneo: id
      },
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        pais: body.pais,
        ciudad: body.ciudad,
        fecha_inicio: body.fecha_inicio,
        fecha_fin: body.fecha_fin,
        tipo_torneo: body.tipo_torneo,
        genero: body.genero,
        estado: body.estado,
        es_publico: body.es_publico,
        es_gratuito: body.es_gratuito,
        moneda: body.moneda,
        pdf_url: body.pdf_url,
        id_competition: body.id_competition || null,
        updatedAt: new Date()
      },
      include: {
        competition: {
          select: {
            id_competition: true,
            competition_name: true,
            competition_country: true,
            competition_confederation: true,
            competition_tier: true,
            competition_level: true
          }
        }
      }
    })

    return NextResponse.json(torneo)
  } catch (error) {
    console.error('Error updating torneo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar que el torneo existe antes de eliminarlo
    const existingTorneo = await prisma.torneo.findUnique({
      where: {
        id_torneo: id
      }
    })

    if (!existingTorneo) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    await prisma.torneo.delete({
      where: {
        id_torneo: id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting torneo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}