// Tipos unificados para jugadores - Sin duplicados

export interface Jugador {
  id: string
  nombre: string
  nombreUsuario: string
  posicion: string
  edad: number
  equipo: string
  numeroCamiseta?: number | null
  biografia?: string | null
  valoracion?: string | null
  urlAvatar?: string | null
  fechaCreacion: Date
  fechaActualizacion: Date
  
  // Relaciones
  atributos?: AtributoJugador[]
  equipos?: EquipoJugador[]
  urlsScraping?: UrlScraping[]
}

export interface AtributoJugador {
  id: string
  jugadorId: string
  nombre: string
  valor: string
}

export interface EquipoJugador {
  id: string
  jugadorId: string
  nombreEquipo: string
  fechaInicio: Date
  fechaFin?: Date | null
  esActual: boolean
}

export interface UrlScraping {
  id: string
  jugadorId: string
  url: string
  ultimoScraping?: Date | null
  estado: string
}

export interface CrearJugadorData {
  nombre: string
  nombreUsuario: string
  posicion: string
  edad: number
  equipo: string
  numeroCamiseta?: number
  biografia?: string
  valoracion?: string
  urlAvatar?: string
  atributos?: Array<{ nombre: string; valor: string }>
}

export interface ActualizarJugadorData extends Partial<CrearJugadorData> {
  id: string
}
