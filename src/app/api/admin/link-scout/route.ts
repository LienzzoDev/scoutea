import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { scoutEmail } = await request.json()

    if (!scoutEmail) {
      return NextResponse.json({ error: 'Email de scout requerido' }, { status: 400 })
    }

    // Buscar el scout por email
    const scout = await prisma.scout.findFirst({
      where: { email: scoutEmail }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    // Verificar si el scout ya está vinculado
    if (scout.clerkId && scout.clerkId !== userId) {
      return NextResponse.json({ 
        error: 'Este scout ya está vinculado a otro usuario' 
      }, { status: 400 })
    }

    // Vincular el scout con el usuario actual
    const updatedScout = await prisma.scout.update({
      where: { id_scout: scout.id_scout },
      data: { clerkId: userId },
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        email: true,
        nationality: true,
        country: true,
        total_reports: true,
        roi: true,
        net_profits: true,
        scout_level: true,
        scout_ranking: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Scout ${scout.scout_name} vinculado exitosamente`,
      scout: updatedScout
    })

  } catch (error) {
    console.error('Error vinculando scout:', error)
    return NextResponse.json(
      { 
        error: 'Error vinculando scout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}