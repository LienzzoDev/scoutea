import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// Interfaz para validación de datos
interface JugadorInput {
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

// Función de validación
function validarJugador(data: JugadorInput) {
  const errores: string[] = []
  
  if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres')
  }
  
  if (!data.nombreUsuario || typeof data.nombreUsuario !== 'string' || data.nombreUsuario.trim().length < 3) {
    errores.push('El nombre de usuario debe tener al menos 3 caracteres')
  }
  
  if (!data.posicion || typeof data.posicion !== 'string' || data.posicion.trim().length < 2) {
    errores.push('La posición debe tener al menos 2 caracteres')
  }
  
  if (!data.edad || typeof data.edad !== 'number' || data.edad < 16 || data.edad > 50) {
    errores.push('La edad debe estar entre 16 y 50 años')
  }
  
  if (!data.equipo || typeof data.equipo !== 'string' || data.equipo.trim().length < 2) {
    errores.push('El equipo debe tener al menos 2 caracteres')
  }
  
  if (data.numeroCamiseta && (typeof data.numeroCamiseta !== 'number' || data.numeroCamiseta < 1 || data.numeroCamiseta > 99)) {
    errores.push('El número de camiseta debe estar entre 1 y 99')
  }
  
  if (data.biografia && typeof data.biografia === 'string' && data.biografia.length > 500) {
    errores.push('La biografía no puede exceder 500 caracteres')
  }
  
  return errores
}

// GET /api/jugadores - Listar todos los jugadores
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const jugadores = await prisma.jugador.findMany({
      include: {
        atributos: true,
        equipos: true,
        urlsScraping: true,
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    })

    return NextResponse.json(jugadores)
  } catch (error) {
    console.error('Error al obtener jugadores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/jugadores - Crear un nuevo jugador
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json() as JugadorInput
    
    // Validar datos de entrada
    const erroresValidacion = validarJugador(body)
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

    // Verificar si el nombreUsuario ya existe
    const jugadorExistente = await prisma.jugador.findUnique({
      where: { nombreUsuario: nombreUsuario!.trim() },
    })

    if (jugadorExistente) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 400 }
      )
    }

    // Crear el jugador con transacción para incluir atributos
    const jugador = await prisma.$transaction(async (tx) => {
      const nuevoJugador = await tx.jugador.create({
        data: {
          nombre: nombre!.trim(),
          nombreUsuario: nombreUsuario!.trim(),
          posicion: posicion!.trim(),
          edad: parseInt(edad!.toString()),
          equipo: equipo!.trim(),
          numeroCamiseta: numeroCamiseta ? parseInt(numeroCamiseta.toString()) : null,
          biografia: biografia ? biografia.trim() : null,
          valoracion: valoracion ? valoracion.trim() : null,
          urlAvatar: urlAvatar ? urlAvatar.trim() : null,
        },
      })

      // Crear atributos si se proporcionan
      if (atributos && Array.isArray(atributos)) {
        for (const attr of atributos) {
          if (attr.nombre && attr.valor && typeof attr.nombre === 'string' && typeof attr.valor === 'string') {
            await tx.atributoJugador.create({
              data: {
                jugadorId: nuevoJugador.id,
                nombre: attr.nombre.trim(),
                valor: attr.valor.trim(),
              },
            })
          }
        }
      }

      // Crear el equipo actual
      await tx.equipoJugador.create({
        data: {
          jugadorId: nuevoJugador.id,
          nombreEquipo: equipo!.trim(),
          fechaInicio: new Date(),
          esActual: true,
        },
      })

      return nuevoJugador
    })

    // Obtener el jugador con todas sus relaciones
    const jugadorConRelaciones = await prisma.jugador.findUnique({
      where: { id: jugador.id },
      include: {
        atributos: true,
        equipos: true,
        urlsScraping: true,
      },
    })

    return NextResponse.json(jugadorConRelaciones, { status: 201 })
  } catch (error) {
    console.error('Error al crear jugador:', error)
    
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
