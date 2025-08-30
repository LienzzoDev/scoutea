'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useJugadores } from "@/hooks/usePlayers"
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  BarChart3,
  Activity
} from "lucide-react"

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [scrapingStatus, setScrapingStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')

  // Hook para obtener datos reales de jugadores
  const { jugadores, loading, error, obtenerJugadores } = useJugadores()

  // Calcular estadísticas reales
  const totalJugadores = jugadores.length
  const jugadoresRecientes = jugadores.filter(jugador => {
    const fechaCreacion = new Date(jugador.fechaCreacion)
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return fechaCreacion > hace24h
  }).length

  const jugadoresConAtributos = jugadores.filter(jugador => 
    jugador.atributos && jugador.atributos.length > 0
  ).length

  const porcentajeConAtributos = totalJugadores > 0 
    ? Math.round((jugadoresConAtributos / totalJugadores) * 100)
    : 0

  // Simular proceso de scraping
  const iniciarScraping = async () => {
    setScrapingStatus('running')
    
    try {
      // Simular proceso de scraping
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Actualizar datos
      await obtenerJugadores()
      setScrapingStatus('completed')
      
      // Resetear estado después de 2 segundos
      setTimeout(() => setScrapingStatus('idle'), 2000)
    } catch (error) {
      setScrapingStatus('error')
      setTimeout(() => setScrapingStatus('idle'), 3000)
    }
  }

  useEffect(() => {
    if (isLoaded && !isSignedIn && !hasRedirected) {
      setHasRedirected(true)
      router.replace('/login')
    }
  }, [isLoaded, isSignedIn, router, hasRedirected])

  // Si no está cargado, mostrar loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#080F17] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#D6DDE6] text-xl">Cargando...</div>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar nada (ya se está redirigiendo)
  if (!isSignedIn) {
    return null
  }

  return (
    <main className="px-6 py-8">
      <h1 className="text-3xl font-bold mb-8 text-[#D6DDE6]">Dashboard</h1>

      {/* Update Data Section */}
      <Card className="mb-8 bg-[#131921] border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2 text-[#D6DDE6]">Actualizar datos</h2>
              <p className="text-gray-400">
                {scrapingStatus === 'running' 
                  ? 'Procesando datos de jugadores...' 
                  : 'Revisar la información de todos los jugadores y actualizarla'
                }
              </p>
            </div>
            <Button 
              onClick={iniciarScraping}
              disabled={scrapingStatus === 'running'}
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white px-6"
            >
              {scrapingStatus === 'running' ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : scrapingStatus === 'completed' ? (
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-400" />
                  <span>Completado</span>
                </div>
              ) : scrapingStatus === 'error' ? (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span>Error</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Iniciar proceso</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Indicators */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#D6DDE6]">Indicadores principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm text-gray-400">Total jugadores</h3>
              </div>
              <div className="text-3xl font-bold mb-1 text-[#D6DDE6]">
                {loading ? '...' : totalJugadores}
              </div>
              <div className="text-sm text-green-400">
                +{jugadoresRecientes} en 24h
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <h3 className="text-sm text-gray-400">Último Scraping</h3>
              </div>
              <div className="text-3xl font-bold mb-1 text-[#D6DDE6]">
                {scrapingStatus === 'completed' ? 'Hace 2s' : 'N/A'}
              </div>
              <div className="text-sm text-gray-400">
                {scrapingStatus === 'running' ? 'En progreso...' : 'Sin actividad'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-5 w-5 text-green-400" />
                <h3 className="text-sm text-gray-400">Con atributos</h3>
              </div>
              <div className="text-3xl font-bold mb-1 text-[#D6DDE6]">
                {loading ? '...' : jugadoresConAtributos}
              </div>
              <div className="text-sm text-green-400">
                {porcentajeConAtributos}% del total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm text-gray-400">Tasa de éxito</h3>
              </div>
              <div className="text-3xl font-bold mb-1 text-[#D6DDE6]">
                {loading ? '...' : `${porcentajeConAtributos}%`}
              </div>
              <div className="text-sm text-green-400">
                +{Math.max(0, porcentajeConAtributos - 50)}% vs objetivo
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-[#D6DDE6]">Evolución de los datos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-[#D6DDE6]">Porcentaje de scraping válido</h3>
                <div className="text-sm text-green-400">
                  +{Math.max(0, porcentajeConAtributos - 80)}%
                </div>
              </div>
              <div className="text-4xl font-bold mb-6 text-[#D6DDE6]">
                {loading ? '...' : `${porcentajeConAtributos}%`}
              </div>
              <div className="h-32 relative">
                <svg className="w-full h-full" viewBox="0 0 400 120">
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M0,${120 - porcentajeConAtributos * 1.2} Q50,${120 - porcentajeConAtributos * 1.1} 100,${120 - porcentajeConAtributos * 1.0} T200,${120 - porcentajeConAtributos * 0.9} T300,${120 - porcentajeConAtributos * 0.8} T400,${120 - porcentajeConAtributos * 0.7}`}
                    stroke="#f97316"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path 
                    d={`M0,${120 - porcentajeConAtributos * 1.2} Q50,${120 - porcentajeConAtributos * 1.1} 100,${120 - porcentajeConAtributos * 1.0} T200,${120 - porcentajeConAtributos * 0.9} T300,${120 - porcentajeConAtributos * 0.8} T400,${120 - porcentajeConAtributos * 0.7} L400,120 L0,120 Z`} 
                    fill="url(#gradient1)" 
                  />
                </svg>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-2">
                  <span>Ene</span>
                  <span>Feb</span>
                  <span>Mar</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-[#D6DDE6]">Crecimiento de jugadores</h3>
                <div className="text-sm text-green-400">
                  +{jugadoresRecientes} este mes
                </div>
              </div>
              <div className="text-4xl font-bold mb-6 text-[#D6DDE6]">
                {loading ? '...' : jugadoresRecientes}
              </div>
              <div className="h-32 relative">
                <svg className="w-full h-full" viewBox="0 0 400 120">
                  <defs>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M0,${120 - Math.min(jugadoresRecientes * 2, 100)} Q50,${120 - Math.min(jugadoresRecientes * 1.8, 90)} 100,${120 - Math.min(jugadoresRecientes * 1.6, 80)} T200,${120 - Math.min(jugadoresRecientes * 1.4, 70)} T300,${120 - Math.min(jugadoresRecientes * 1.2, 60)} T400,${120 - Math.min(jugadoresRecientes * 1.0, 50)}`}
                    stroke="#f97316"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path 
                    d={`M0,${120 - Math.min(jugadoresRecientes * 2, 100)} Q50,${120 - Math.min(jugadoresRecientes * 1.8, 90)} 100,${120 - Math.min(jugadoresRecientes * 1.6, 80)} T200,${120 - Math.min(jugadoresRecientes * 1.4, 70)} T300,${120 - Math.min(jugadoresRecientes * 1.2, 60)} T400,${120 - Math.min(jugadoresRecientes * 1.0, 50)} L400,120 L0,120 Z`} 
                    fill="url(#gradient2)" 
                  />
                </svg>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-2">
                  <span>Ene</span>
                  <span>Feb</span>
                  <span>Mar</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-8 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
          <Button 
            onClick={obtenerJugadores}
            variant="outline" 
            className="mt-2 border-red-700 text-red-400 hover:bg-red-900/20"
          >
            Reintentar
          </Button>
        </div>
      )}
    </main>
  )
}
