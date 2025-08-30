import { useState, useEffect } from 'react'
import { Jugador, CrearJugadorData, ActualizarJugadorData } from '@/types/player'

export function useJugadores() {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Obtener todos los jugadores
  const obtenerJugadores = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/jugadores')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setJugadores(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener jugadores'
      setError(errorMessage)
      console.error('Error al obtener jugadores:', err)
    } finally {
      setLoading(false)
    }
  }

  // Crear un nuevo jugador
  const crearJugador = async (jugadorData: CrearJugadorData): Promise<Jugador | null> => {
    try {
      setError(null)
      
      const response = await fetch('/api/jugadores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jugadorData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const nuevoJugador = await response.json()
      setJugadores(prev => [nuevoJugador, ...prev])
      return nuevoJugador
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear jugador'
      setError(errorMessage)
      console.error('Error al crear jugador:', err)
      return null
    }
  }

  // Actualizar un jugador
  const actualizarJugador = async (jugadorData: ActualizarJugadorData): Promise<Jugador | null> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/jugadores/${jugadorData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jugadorData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const jugadorActualizado = await response.json()
      setJugadores(prev => 
        prev.map(jugador => 
          jugador.id === jugadorData.id ? jugadorActualizado : jugador
        )
      )
      return jugadorActualizado
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al actualizar jugador'
      setError(errorMessage)
      console.error('Error al actualizar jugador:', err)
      return null
    }
  }

  // Eliminar un jugador
  const eliminarJugador = async (jugadorId: string): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/jugadores/${jugadorId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      setJugadores(prev => prev.filter(jugador => jugador.id !== jugadorId))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al eliminar jugador'
      setError(errorMessage)
      console.error('Error al eliminar jugador:', err)
      return false
    }
  }

  // Obtener un jugador específico
  const obtenerJugador = async (jugadorId: string): Promise<Jugador | null> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/jugadores/${jugadorId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      const jugador = await response.json()
      return jugador
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener jugador'
      setError(errorMessage)
      console.error('Error al obtener jugador:', err)
      return null
    }
  }

  // Cargar jugadores al montar el hook
  useEffect(() => {
    obtenerJugadores()
  }, [])

  return {
    jugadores,
    loading,
    error,
    obtenerJugadores,
    crearJugador,
    actualizarJugador,
    eliminarJugador,
    obtenerJugador,
  }
}
