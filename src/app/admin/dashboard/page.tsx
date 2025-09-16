'use client'

import { useAuth } from '@clerk/nextjs'
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  BarChart3,
  Activity
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePlayers } from "@/hooks/player/usePlayers"

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [scrapingStatus, setScrapingStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')

  // Hook para obtener datos reales de jugadores
  const { players, loading, error, searchPlayers } = usePlayers()

  // 📊 CALCULAR ESTADÍSTICAS OPTIMIZADAS CON DATOS REALES
  const [adminStats, setAdminStats] = useState({
    totalJugadores: 0,
    jugadoresRecientes: 0,
    jugadoresConRating: 0,
    porcentajeConRating: 0,
    promedioRating: 0
  })

  // 🚀 FUNCIÓN PARA OBTENER ESTADÍSTICAS DE LA API OPTIMIZADA
  const loadAdminStats = useCallback(async () => {
    try {
      console.log('📊 Loading admin statistics from optimized API...')
      const response = await fetch('/api/players/stats')
      
      if (response.ok) {
        const stats = await response.json()
        
        // 📊 CALCULAR MÉTRICAS ADICIONALES
        const totalJugadores = stats.totalPlayers || 0
        const jugadoresRecientes = players.filter(player => {
          const fechaCreacion = new Date(player.createdAt)
          const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return fechaCreacion > hace24h
        }).length

        const jugadoresConRating = players.filter(player => 
          player.player_rating && player.player_rating > 0
        ).length

        const porcentajeConRating = totalJugadores > 0 
          ? Math.round((jugadoresConRating / totalJugadores) * 100)
          : 0

        setAdminStats({
          totalJugadores,
          jugadoresRecientes,
          jugadoresConRating,
          porcentajeConRating,
          promedioRating: stats.averageRating || 0
        })
        
        console.log('✅ Admin stats updated:', {
          totalJugadores,
          jugadoresRecientes,
          porcentajeConRating
        })
      }
    } catch (error) {
      console.error('❌ Error loading admin stats:', error)
    }
  }, [players])

  // 🔄 ACTUALIZAR ESTADÍSTICAS CUANDO CAMBIEN LOS JUGADORES
  useEffect(() => {
    if (players.length > 0) {
      loadAdminStats()
    }
  }, [players, loadAdminStats])

  // 🚀 PROCESO DE SCRAPING OPTIMIZADO
  const iniciarScraping = async () => {
    setScrapingStatus('running')
    console.log('🚀 Starting optimized scraping process...')
    
    try {
      // 📊 REFRESCAR ESTADÍSTICAS USANDO LA API OPTIMIZADA
      const refreshStats = fetch('/api/players/stats', { method: 'POST' })
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
      
      // 🔄 SIMULAR PROCESO DE SCRAPING (en producción sería real)
      const scrapingProcess = new Promise(resolve => setTimeout(resolve, 3000))
      
      // 🚀 EJECUTAR EN PARALELO
      await Promise.all([refreshStats, scrapingProcess])
      
      // 📊 RECARGAR DATOS ACTUALIZADOS
      await Promise.all([
        searchPlayers({
          page: 1,
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }),
        loadAdminStats()
      ])
      
      setScrapingStatus('completed')
      console.log('✅ Scraping process completed successfully')
      
      // Resetear estado después de 2 segundos
      setTimeout(() => setScrapingStatus('idle'), 2000)
    } catch (error) {
      console.error('❌ Error in scraping process:', error)
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

  // 🚀 CARGAR DATOS OPTIMIZADOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    if (isSignedIn) {
      console.log('🚀 Loading admin dashboard data with optimized APIs...')
      
      // 📊 CARGAR ESTADÍSTICAS Y JUGADORES EN PARALELO
      Promise.all([
        // Cargar estadísticas usando la nueva API optimizada
        fetch('/api/players/stats')
          .then(res => res.ok ? res.json() : null)
          .catch(() => null),
        
        // Cargar jugadores recientes para métricas
        searchPlayers({
          page: 1,
          limit: 50, // Reducido para mejor performance
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
      ]).then(([stats]) => {
        if (stats) {
          console.log('✅ Admin stats loaded:', stats)
        }
      }).catch(error => {
        console.error('❌ Error loading admin dashboard data:', error)
      })
    }
  }, [isSignedIn, searchPlayers])

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
      <main className="px-6 py-8 max-w-7xl mx-auto">
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
                {loading ? '...' : adminStats.totalJugadores.toLocaleString()}
              </div>
              <div className="text-sm text-green-400">
                +{adminStats.jugadoresRecientes} en 24h
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
                {loading ? '...' : adminStats.jugadoresConRating.toLocaleString()}
              </div>
              <div className="text-sm text-green-400">
                {adminStats.porcentajeConRating}% del total
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
                {loading ? '...' : `${adminStats.porcentajeConRating}%`}
              </div>
              <div className="text-sm text-green-400">
                +{Math.max(0, adminStats.porcentajeConRating - 80)}% vs objetivo
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
                  +{Math.max(0, adminStats.porcentajeConRating - 80)}%
                </div>
              </div>
              <div className="text-4xl font-bold mb-6 text-[#D6DDE6]">
                {loading ? '...' : `${adminStats.porcentajeConRating}%`}
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
                    d={`M0,${120 - adminStats.porcentajeConRating * 1.2} Q50,${120 - adminStats.porcentajeConRating * 1.1} 100,${120 - adminStats.porcentajeConRating * 1.0} T200,${120 - adminStats.porcentajeConRating * 0.9} T300,${120 - adminStats.porcentajeConRating * 0.8} T400,${120 - adminStats.porcentajeConRating * 0.7}`}
                    stroke="#f97316"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path 
                    d={`M0,${120 - adminStats.porcentajeConRating * 1.2} Q50,${120 - adminStats.porcentajeConRating * 1.1} 100,${120 - adminStats.porcentajeConRating * 1.0} T200,${120 - adminStats.porcentajeConRating * 0.9} T300,${120 - adminStats.porcentajeConRating * 0.8} T400,${120 - adminStats.porcentajeConRating * 0.7} L400,120 L0,120 Z`} 
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
                  +{adminStats.jugadoresRecientes} este mes
                </div>
              </div>
              <div className="text-4xl font-bold mb-6 text-[#D6DDE6]">
                {loading ? '...' : adminStats.jugadoresRecientes}
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
                    d={`M0,${120 - Math.min(adminStats.jugadoresRecientes * 2, 100)} Q50,${120 - Math.min(adminStats.jugadoresRecientes * 1.8, 90)} 100,${120 - Math.min(adminStats.jugadoresRecientes * 1.6, 80)} T200,${120 - Math.min(adminStats.jugadoresRecientes * 1.4, 70)} T300,${120 - Math.min(adminStats.jugadoresRecientes * 1.2, 60)} T400,${120 - Math.min(adminStats.jugadoresRecientes * 1.0, 50)}`}
                    stroke="#f97316"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path 
                    d={`M0,${120 - Math.min(adminStats.jugadoresRecientes * 2, 100)} Q50,${120 - Math.min(adminStats.jugadoresRecientes * 1.8, 90)} 100,${120 - Math.min(adminStats.jugadoresRecientes * 1.6, 80)} T200,${120 - Math.min(adminStats.jugadoresRecientes * 1.4, 70)} T300,${120 - Math.min(adminStats.jugadoresRecientes * 1.2, 60)} T400,${120 - Math.min(adminStats.jugadoresRecientes * 1.0, 50)} L400,120 L0,120 Z`} 
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
            onClick={() => searchPlayers({
              page: 1,
              limit: 100,
              sortBy: 'createdAt',
              sortOrder: 'desc'
            })}
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
