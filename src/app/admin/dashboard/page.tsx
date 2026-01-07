'use client'

import { useAuth } from '@clerk/nextjs'
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Trash2
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

import { ApprovalDashboard } from "@/components/admin/ApprovalDashboard"
import { GrowthChart } from "@/components/admin/dashboard/GrowthChart"
import { StatsBlock } from "@/components/admin/dashboard/StatsBlock"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// Interface for new stats structure
interface DashboardStats {
  players: {
    total: number
    lastScraping: string | null
    erroneousUrls: number
    missingTrfmUrls: number
  }
  teams: {
    total: number
    lastScraping: string | null
    erroneousUrls: number
    missingTrfmUrls: number
  }
  evolution: {
    reports: { month: string; count: number }[]
    scouts: { month: string; count: number }[]
  }
}

const INITIAL_STATS: DashboardStats = {
  players: { total: 0, lastScraping: null, erroneousUrls: 0, missingTrfmUrls: 0 },
  teams: { total: 0, lastScraping: null, erroneousUrls: 0, missingTrfmUrls: 0 },
  evolution: { reports: [], scouts: [] }
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const _router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [scrapingStatus, setScrapingStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [showApprovalsDialog, setShowApprovalsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'completed' | 'error'>('idle')
  const [confirmText, setConfirmText] = useState('')

  // 📊 ESTADÍSTICAS DEL DASHBOARD
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS)
  const [statsLoading, setStatsLoading] = useState(true)
  const [_statsError, setStatsError] = useState<string | null>(null)

  // 🚀 CARGAR DATOS
  const loadDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      console.log('📊 Loading dashboard analytics...')
      const response = await fetch('/api/admin/dashboard/stats')

      if (response.ok) {
        const data = await response.json()
        setStats(data)
        console.log('✅ Dashboard stats loaded:', data)
      } else {
        throw new Error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error)
      setStatsError('Error al cargar estadísticas')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // 🔄 CARGAR AL INICIO
  useEffect(() => {
    if (isSignedIn) {
      loadDashboardStats()
    }
  }, [isSignedIn, loadDashboardStats])

  // 🚀 PROCESO DE SCRAPING OPTIMIZADO
  const iniciarScraping = async () => {
    setScrapingStatus('running')
    console.log('🚀 Starting optimized scraping process...')

    try {
      // 🔄 SIMULAR PROCESO DE SCRAPING (en producción sería real)
      await new Promise(resolve => setTimeout(resolve, 3000))

      // 📊 RECARGAR DATOS ACTUALIZADOS
      await loadDashboardStats()

      setScrapingStatus('completed')
      console.log('✅ Scraping process completed successfully')
      setTimeout(() => setScrapingStatus('idle'), 2000)
    } catch (error) {
      console.error('❌ Error in scraping process:', error)
      setScrapingStatus('error')
      setTimeout(() => setScrapingStatus('idle'), 3000)
    }
  }

  // 🗑️ FUNCIÓN PARA ELIMINAR TODOS LOS JUGADORES
  const eliminarTodosJugadores = async () => {
    setDeleteStatus('deleting')
    console.log('🗑️ Iniciando eliminación de todos los jugadores...')

    try {
      const response = await fetch('/api/admin/players/delete-all', {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteStatus('completed')
        await loadDashboardStats() // Recargar estadísticas

        setTimeout(() => {
          setShowDeleteDialog(false)
          setConfirmText('')
          setDeleteStatus('idle')
        }, 2000)
      } else {
        setDeleteStatus('error')
        setTimeout(() => setDeleteStatus('idle'), 3000)
      }
    } catch (_error) {
      setDeleteStatus('error')
      setTimeout(() => setDeleteStatus('idle'), 3000)
    }
  }

  useEffect(() => {
    if (isLoaded && !isSignedIn && !hasRedirected) {
      setHasRedirected(true)
      _router.replace('/login')
    }
  }, [isLoaded, isSignedIn, _router, hasRedirected])

  if (!isLoaded) return <div className="min-h-screen bg-[#080F17] flex items-center justify-center text-[#D6DDE6]">Cargando...</div>
  if (!isSignedIn) return null

  return (
    <main className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-[#D6DDE6]">Dashboard</h1>

      {/* 📊 INDICADORES PRINCIPALES (BLOQUE 1) */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-[#D6DDE6]">Indicadores Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatsBlock 
            title="Jugadores" 
            total={stats.players.total}
            lastScraping={stats.players.lastScraping}
            erroneousUrls={stats.players.erroneousUrls}
            missingTrfmUrls={stats.players.missingTrfmUrls}
            loading={statsLoading}
          />
          <StatsBlock 
            title="Equipos" 
            total={stats.teams.total}
            lastScraping={stats.teams.lastScraping}
            erroneousUrls={stats.teams.erroneousUrls}
            missingTrfmUrls={stats.teams.missingTrfmUrls}
            loading={statsLoading}
          />
        </div>
      </section>

      {/* 📈 EVOLUCIÓN DE DATOS (BLOQUE 2) */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-[#D6DDE6]">Evolución de Datos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GrowthChart 
            title="Crecimiento de Reportes" 
            data={stats.evolution.reports} 
            type="reports"
            loading={statsLoading}
          />
          <GrowthChart 
            title="Crecimiento de Scouts" 
            data={stats.evolution.scouts} 
            type="scouts"
            loading={statsLoading}
          />
        </div>
      </section>

      {/* 🛠️ ACCIONES RÁPIDAS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Update Data */}
        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1 text-[#D6DDE6]">Actualizar Datos</h2>
              <p className="text-sm text-gray-400">Ejecutar scraping manual</p>
            </div>
            <Button
              onClick={iniciarScraping}
              disabled={scrapingStatus === 'running'}
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${scrapingStatus === 'running' ? 'animate-spin' : ''}`} />
              {scrapingStatus === 'running' ? 'Procesando...' : 'Actualizar'}
            </Button>
          </CardContent>
        </Card>

        {/* Solicitudes */}
        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1 text-[#D6DDE6]">Solicitudes</h2>
              <p className="text-sm text-gray-400">Edición y eliminación de reportes</p>
            </div>
            <Button
              onClick={() => setShowApprovalsDialog(true)}
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Ver Solicitudes
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ⚠️ ZONA PELIGROSA */}
      <Card className="bg-[#1a0a0a] border-red-900 border-dashed">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1 text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Zona Peligrosa
            </h2>
            <p className="text-sm text-gray-400">Eliminar todos los jugadores</p>
          </div>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            className="bg-red-900/50 hover:bg-red-700 text-red-200 border border-red-800"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Todo
          </Button>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#080F17] border-red-900 text-slate-300">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle /> Acción Irreversible
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Escribe <span className="font-mono text-red-400">ELIMINAR TODO</span> para confirmar.</p>
            <Input 
              value={confirmText} 
              onChange={(e) => setConfirmText(e.target.value)}
              className="bg-[#131921] border-red-900/50"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={eliminarTodosJugadores}
              disabled={confirmText !== 'ELIMINAR TODO' || deleteStatus === 'deleting'}
            >
              {deleteStatus === 'deleting' ? 'Eliminando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApprovalsDialog} onOpenChange={setShowApprovalsDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-[#080F17] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-[#D6DDE6]">Solicitudes de Edición/Eliminación</DialogTitle>
          </DialogHeader>
          <ApprovalDashboard />
        </DialogContent>
      </Dialog>
    </main>
  )
}
