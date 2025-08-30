import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// Interfaz para validación de actualización
interface ActualizacionJugadorInput {
  nombre?: string
  nombreUsuario?: string
  posicion?: string
  edad?: number | string
  equipo?: string
  numeroCamiseta?: number | string | null
  biografia?: string | null
  valoracion?: string | null
  urlAvatar?: string | null
  atributos?: Array<{ nombre: string; valor: string }>
}

// Función de validación para actualización
function validarActualizacionJugador(data: ActualizacionJugadorInput) {
  const errores: string[] = []
  
  if (data.nombre !== undefined && (typeof data.nombre !== 'string' || data.nombre.trim().length < 2)) {
    errores.push('El nombre debe tener al menos 2 caracteres')
  }
  
  if (data.nombreUsuario !== undefined && (typeof data.nombreUsuario !== 'string' || data.nombreUsuario.trim().length < 3)) {
    errores.push('El nombre de usuario debe tener al menos 3 caracteres')
  }
  
  if (data.posicion !== undefined && (typeof data.posicion !== 'string' || data.posicion.trim().length < 2)) {
    errores.push('La posición debe tener al menos 2 caracteres')
  }
  
  if (data.edad !== undefined && (typeof data.edad !== 'number' || data.edad < 16 || data.edad > 50)) {
    errores.push('La edad debe estar entre 16 y 50 años')
  }
  
  if (data.equipo !== undefined && (typeof data.equipo !== 'string' || data.equipo.trim().length < 2)) {
    errores.push('El equipo debe tener al menos 2 caracteres')
  }
  
  if (data.numeroCamiseta !== undefined && data.numeroCamiseta !== null && 
      (typeof data.numeroCamiseta !== 'number' || data.numeroCamiseta < 1 || data.numeroCamiseta > 99)) {
    errores.push('El número de camiseta debe estar entre 1 y 99')
  }
  
  if (data.biografia !== undefined && data.biografia !== null && 
      (typeof data.biografia !== 'string' || data.biografia.length > 500)) {
    errores.push('La biografía no puede exceder 500 caracteres')
  }
  
  return errores
}

// GET /api/jugadores/[id] - Obtener un jugador específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    
    // Validar formato del ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json(
        { error: 'ID de jugador inválido' },
        { status: 400 }
      )
    }

    const jugador = await prisma.jugador.findUnique({
      where: { id: id.trim() },
      include: {
        atributos: true,
        equipos: true,
        urlsScraping: true,
      },
    })

    if (!jugador) {
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(jugador)
  } catch (error) {
    console.error('Error al obtener jugador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/jugadores/[id] - Actualizar un jugador
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json() as ActualizacionJugadorInput
    const { id } = await params
    
    // Validar formato del ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json(
        { error: 'ID de jugador inválido' },
        { status: 400 }
      )
    }

    // Validar datos de entrada
    const erroresValidacion = validarActualizacionJugador(body)
    if (erroresValidacion.length > 0) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: erroresValidacion },
        { status: 400 }
      )
    }

    const {
      nombre,
      nombreUsuario,
      posicion,
      edad,
      equipo,
      numeroCamiseta,
      biografia,
      valoracion,
      urlAvatar,
      atributos,
    } = body

    // Verificar si el jugador existe
    const jugadorExistente = await prisma.jugador.findUnique({
      where: { id: id.trim() },
    })

    if (!jugadorExistente) {
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el nombreUsuario ya existe en otro jugador
    if (nombreUsuario && nombreUsuario.trim() !== jugadorExistente.nombreUsuario) {
      const jugadorConUsuario = await prisma.jugador.findUnique({
        where: { nombreUsuario: nombreUsuario.trim() },
      })

      if (jugadorConUsuario) {
        return NextResponse.json(
          { error: 'El nombre de usuario ya existe' },
          { status: 400 }
        )
      }
    }

    // Actualizar el jugador con transacción
    await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos
      await tx.jugador.update({
        where: { id: id.trim() },
        data: {
          nombre: nombre !== undefined ? nombre.trim() : undefined,
          nombreUsuario: nombreUsuario !== undefined ? nombreUsuario.trim() : undefined,
          posicion: posicion !== undefined ? posicion.trim() : undefined,
          edad: edad !== undefined ? parseInt(edad.toString()) : undefined,
          equipo: equipo !== undefined ? equipo.trim() : undefined,
          numeroCamiseta: numeroCamiseta !== undefined ? 
            (numeroCamiseta ? parseInt(numeroCamiseta.toString()) : null) : undefined,
          biografia: biografia !== undefined ? 
            (biografia ? biografia.trim() : null) : undefined,
          valoracion: valoracion !== undefined ? 
            (valoracion ? valoracion.trim() : null) : undefined,
          urlAvatar: urlAvatar !== undefined ? 
            (urlAvatar ? urlAvatar.trim() : null) : undefined,
        },
      })

      // Actualizar atributos si se proporcionan
      if (atributos && Array.isArray(atributos)) {
        // Eliminar atributos existentes
        await tx.atributoJugador.deleteMany({
          where: { jugadorId: id.trim() },
        })

        // Crear nuevos atributos
        for (const attr of atributos) {
          if (attr.nombre && attr.valor && typeof attr.nombre === 'string' && typeof attr.valor === 'string') {
            await tx.atributoJugador.create({
              data: {
                jugadorId: id.trim(),
                nombre: attr.nombre.trim(),
                valor: attr.valor.trim(),
              },
            })
          }
        }
      }
    })

    // Obtener el jugador actualizado con todas sus relaciones
    const jugadorConRelaciones = await prisma.jugador.findUnique({
      where: { id: id.trim() },
      include: {
        atributos: true,
        equipos: true,
        urlsScraping: true,
      },
    })

    return NextResponse.json(jugadorConRelaciones)
  } catch (error) {
    console.error('Error al actualizar jugador:', error)
    
    // Manejar errores específicos de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'El nombre de usuario ya existe' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/jugadores/[id] - Eliminar un jugador
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    
    // Validar formato del ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json(
        { error: 'ID de jugador inválido' },
        { status: 400 }
      )
    }

    // Verificar si el jugador existe
    const jugadorExistente = await prisma.jugador.findUnique({
      where: { id: id.trim() },
    })

    if (!jugadorExistente) {
      return NextResponse.json(
        { error: 'Jugador no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar el jugador (las relaciones se eliminan en cascada)
    await prisma.jugador.delete({
      where: { id: id.trim() },
    })

    return NextResponse.json({ message: 'Jugador eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar jugador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
