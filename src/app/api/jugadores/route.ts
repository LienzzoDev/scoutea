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

    const jugadores = await prisma.Jugador.findMany({
      orderBy: {
        createdAt: 'desc',
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
    const jugadorExistente = await prisma.Jugador.findFirst({
      where: { player_name: nombreUsuario!.trim() },
    })

    if (jugadorExistente) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 400 }
      )
    }

    // Crear el jugador usando los campos correctos del modelo Jugador
    const jugador = await prisma.Jugador.create({
      data: {
        player_name: nombre!.trim(),
        complete_player_name: nombreUsuario!.trim(),
        position_player: posicion!.trim(),
        age: parseInt(edad!.toString()),
        team_name: equipo!.trim(),
        // Mapear otros campos opcionales
        url_instagram: urlAvatar ? urlAvatar.trim() : null,
        // Nota: El modelo Jugador no tiene campos para numeroCamiseta, biografia, valoracion, atributos
        // Estos se podrían almacenar en campos existentes o crear nuevos campos
      },
    })

    return NextResponse.json(jugador, { status: 201 })
  } catch (error) {
    console.error('❌ Error al crear jugador:', {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    // Manejar errores específicos de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'El nombre de usuario ya existe' },
          { status: 400 }
        )
      }
      
      // Devolver el mensaje de error específico para debugging
      return NextResponse.json(
        { error: `Error específico: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
