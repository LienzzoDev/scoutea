import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: Iniciando proceso ===')
    
    const { userId } = await auth()
    console.log('DEBUG: userId:', userId)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { message } = await request.json()
    console.log('DEBUG: message:', message)

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      )
    }

    // Obtener información del usuario desde la base de datos
    console.log('DEBUG: Buscando usuario en BD...')
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })
    console.log('DEBUG: Usuario encontrado:', user)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Guardar el mensaje en la base de datos
    console.log('DEBUG: Guardando mensaje en BD...')
    const savedMessage = await prisma.onDemandMessage.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        message: message.trim(),
      },
    })
    console.log('DEBUG: Mensaje guardado:', savedMessage.id)

    return NextResponse.json({
      success: true,
      message: 'Mensaje guardado correctamente (modo debug)',
      messageId: savedMessage.id,
      debug: {
        userId,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
      }
    })

  } catch (error) {
    console.error('DEBUG ERROR:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}