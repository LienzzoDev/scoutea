'use client'

import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock, Database, AlertCircle, RefreshCw, BarChart3, Activity, FlaskRound } from "lucide-react"
import { useEffect, useState, useCallback } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'

interface ScrapingJob {
  id: string
  status: string
  totalPlayers: number
  processedCount: number
  successCount: number
  errorCount: number
  currentBatch: number
  batchSize: number
  progress: number
  rateLimitCount?: number
  retryCount?: number
  errorRate?: number
  slowModeActive?: boolean
  speedMultiplier?: number
  last429At?: string
  startedAt?: string
  completedAt?: string
  lastProcessedAt?: string
  lastError?: string
}

interface BatchResult {
  playerId: string
  playerName: string
  url: string
  success: boolean
  fieldsUpdated: string[]
  error?: string
}

interface TestResult {
  entityType: 'player' | 'team'
  entityId: string
  entityName: string
  url: string
  success: boolean
  fieldsUpdated: Array<{
    field: string
    oldValue: string | null
    newValue: string | null
  }>
  error?: string
}

export default function ScrapingPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()

  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [job, setJob] = useState<ScrapingJob | null>(null)

  // 🧪 Estados para Test Scraping
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }, [])

  // 📡 CONECTAR A LOGS EN TIEMPO REAL VIA SSE
  useEffect(() => {
    if (!job?.id || !isRunning) {
      console.log('[SSE] No conectando - Job ID:', job?.id, 'isRunning:', isRunning)
      return
    }

    console.log('[SSE] Conectando a logs para job:', job.id)
    const eventSource = new EventSource(`/api/admin/scraping/logs?jobId=${job.id}`)

    eventSource.onopen = () => {
      console.log('[SSE] Conexión establecida')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.log) {
          console.log('[SSE] Nuevo log recibido:', data.log)
          // Añadir log sin timestamp (ya viene con timestamp del servidor)
          setLogs(prev => [...prev, data.log])
        }

        if (data.done) {
          console.log('[SSE] Job completado, cerrando conexión')
          // El job terminó, cerrar conexión
          eventSource.close()
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      eventSource.close()
    }

    return () => {
      console.log('[SSE] Limpiando conexión')
      eventSource.close()
    }
  }, [job?.id, isRunning])

  // 📊 OBTENER ESTADO DEL JOB
  const fetchJobStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/scraping/status')
      const data = await response.json()

      if (data.exists && data.job) {
        console.log('[fetchJobStatus] Job encontrado:', data.job.id, 'Status:', data.job.status)
        setJob(data.job)

        const status = data.job.status
        const shouldBeRunning = status === 'running' || status === 'pending'
        console.log('[fetchJobStatus] Actualizando isRunning a:', shouldBeRunning)
        setIsRunning(shouldBeRunning)
        setIsPaused(status === 'paused')

        // Job completado o fallido - no se requiere acción adicional
      } else {
        console.log('[fetchJobStatus] No hay job activo')
        setJob(null)
        setIsRunning(false)
        setIsPaused(false)
      }
    } catch (error) {
      console.error('Error fetching job status:', error)
    }
  }, [])

  // NOTA: El procesamiento de batches ahora se maneja automáticamente en el backend
  // mediante el endpoint /api/admin/scraping/process-auto. El frontend solo monitorea
  // el progreso mediante polling del estado y recibe logs vía SSE.

  // 🚀 INICIAR NUEVO JOB
  const startScraping = async () => {
    setLogs([])
    addLog('🚀 Iniciando nuevo trabajo de scraping...')
    addLog('')

    try {
      const response = await fetch('/api/admin/scraping/start', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar scraping')
      }

      // Logs para jugadores
      addLog('⚽ SCRAPING DE JUGADORES:')
      addLog(`✅ Job creado: ${data.playersJob.id}`)
      addLog(`📊 Total de jugadores: ${data.playersJob.totalPlayers}`)
      addLog(`📦 Tamaño de batch: ${data.playersJob.batchSize}`)
      addLog('')

      // Logs para equipos
      if (data.totalTeams > 0) {
        addLog('🏟️ SCRAPING DE EQUIPOS:')
        addLog(`📊 Total de equipos: ${data.totalTeams}`)
        addLog(`✅ Equipos procesados: ${data.teamsScraped}`)
        addLog('')
      }

      addLog('✅ Scraping iniciado - procesamiento automático en el backend')
      addLog('💡 Puedes cerrar esta página, el scraping continuará')
      addLog('')

      console.log('[startScraping] Job creado:', data.playersJob)
      console.log('[startScraping] Actualizando estados - isRunning: true')

      setJob(data.playersJob)
      setIsRunning(true)

      // El procesamiento automático se maneja en el backend vía /process-auto
      addLog('🔄 Procesamiento automático iniciado en el backend...')

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR: ${errorMsg}`)
      setIsRunning(false)
    }
  }

  // ⏸️ PAUSAR JOB
  const pauseScraping = async () => {
    addLog('⏸️ Pausando scraping...')

    try {
      const response = await fetch('/api/admin/scraping/pause', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al pausar scraping')
      }

      addLog('✅ Scraping pausado')
      setIsRunning(false)
      setIsPaused(true)
      await fetchJobStatus()

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR: ${errorMsg}`)
    }
  }

  // ▶️ REANUDAR JOB
  const resumeScraping = async () => {
    addLog('▶️ Reanudando scraping...')

    try {
      // Cambiar estado del job a 'running'
      const response = await fetch('/api/admin/scraping/resume', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Error al reanudar scraping')
      }

      // Reiniciar el auto-procesamiento en el backend
      const baseUrl = window.location.origin
      fetch(`${baseUrl}/api/admin/scraping/process-auto`, {
        method: 'POST',
      }).catch(err => {
        console.error('Error reiniciando auto-procesamiento:', err)
      })

      addLog('✅ Scraping reanudado - el backend continuará automáticamente')
      setIsRunning(true)
      setIsPaused(false)
      await fetchJobStatus()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR: ${errorMsg}`)
    }
  }

  // ❌ CANCELAR JOB
  const cancelScraping = async () => {
    addLog('❌ Cancelando scraping...')

    try {
      const response = await fetch('/api/admin/scraping/cancel', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar scraping')
      }

      addLog('✅ Scraping cancelado')
      setIsRunning(false)
      setIsPaused(false)
      await fetchJobStatus()

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR: ${errorMsg}`)
    }
  }

  // 🔄 RESET
  const resetStats = async () => {
    setLogs([])
    addLog('🔄 Reiniciando estado...')

    try {
      // Llamar al endpoint de reset para eliminar todos los jobs
      addLog('🗑️ Eliminando todos los jobs existentes...')

      const response = await fetch('/api/admin/scraping/reset', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al resetear jobs')
      }

      addLog(`✅ ${data.jobsDeleted} jobs eliminados exitosamente`)
      if (data.details) {
        addLog(`   - Completados: ${data.details.completed}`)
        addLog(`   - Fallidos: ${data.details.failed}`)
        addLog(`   - Cancelados: ${data.details.cancelled}`)
      }
      addLog('🧹 Logs limpiados')
      addLog('')

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR: ${errorMsg}`)
      console.error('Error resetting jobs:', error)
    }

    // Limpiar estado local
    setJob(null)
    setIsRunning(false)
    setIsPaused(false)
    addLog('✅ Estado reiniciado - listo para nuevo scraping')

    // Refrescar el estado
    await fetchJobStatus()
  }

  // 🧪 TEST SCRAPING (3 jugadores + 3 equipos)
  const runTestScraping = async () => {
    setIsTesting(true)
    setTestResults(null)
    setLogs([]) // Limpiar logs anteriores

    // Generar un testId predecible (usamos timestamp similar al servidor)
    const testId = `test-${Date.now()}`

    // Conectar a los logs ANTES de iniciar el test para no perder ningún log
    const eventSource = new EventSource(`/api/admin/scraping/logs?testId=${testId}`)

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data)

        if (eventData.log) {
          // Añadir log (ya viene con timestamp del servidor)
          setLogs(prev => [...prev, eventData.log])
        }

        if (eventData.done) {
          // El test terminó, cerrar conexión
          eventSource.close()
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      eventSource.close()
    }

    try {
      // Pequeña espera para asegurar que SSE esté conectado
      await new Promise(resolve => setTimeout(resolve, 100))

      // Iniciar el test scraping pasando el testId
      const response = await fetch('/api/admin/scraping/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al ejecutar test')
      }

      // Los logs finales ya vienen por SSE, solo guardamos los resultados
      setTestResults(data.results)
      setShowTestModal(true)

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR en test: ${errorMsg}`)
      eventSource.close()
    } finally {
      setIsTesting(false)
    }
  }

  // NOTA: El auto-procesamiento se maneja en el backend mediante /api/admin/scraping/process-auto
  // Este frontend solo monitorea el estado mediante polling cada 5 segundos (ver efecto abajo)

  // 📊 POLLING DE ESTADO CADA 5 SEGUNDOS
  useEffect(() => {
    fetchJobStatus()
    const interval = setInterval(fetchJobStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchJobStatus])

  // Si no está cargado, mostrar loading
  if (!isLoaded) {
    return <LoadingPage />
  }

  // Si no está autenticado, mostrar nada (ya se está redirigiendo)
  if (!isSignedIn) {
    return null
  }

  return (
    <main className="px-6 py-8 max-w-full mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#D6DDE6]">Scraping de Datos</h1>
        <div className="flex items-center space-x-3">
          {/* 🧪 Botón de Test Scraping */}
          <Button
            onClick={runTestScraping}
            disabled={isTesting || isRunning}
            variant="outline"
            className="border-purple-700 text-purple-400 hover:bg-purple-900/20"
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testeando...
              </>
            ) : (
              <>
                <FlaskRound className="h-4 w-4 mr-2" />
                Test Scraping
              </>
            )}
          </Button>

          {!isRunning && !isPaused && (
            <Button
              onClick={startScraping}
              disabled={isRunning || isTesting}
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Scraping
            </Button>
          )}

          {isRunning && !isPaused && (
            <Button
              onClick={pauseScraping}
              variant="outline"
              className="border-yellow-700 text-yellow-400 hover:bg-yellow-900/20"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          )}

          {isPaused && (
            <Button
              onClick={resumeScraping}
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Reanudar
            </Button>
          )}

          {(isRunning || isPaused) && (
            <Button
              onClick={cancelScraping}
              variant="outline"
              className="border-red-700 text-red-400 hover:bg-red-900/20"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}

          <Button
            onClick={resetStats}
            disabled={isRunning || isPaused}
            variant="outline"
            className="border-slate-700 bg-[#131921] text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isRunning || isPaused ? "Cancela el job activo antes de resetear" : "Eliminar todos los jobs completados/fallidos"}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {isRunning && (
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 text-blue-400 mr-3 animate-pulse" />
            <p className="text-blue-300 font-semibold">
              🔄 Scraping Automático en Ejecución
            </p>
          </div>
          <div className="ml-8 space-y-1 text-sm text-blue-200">
            <p>✅ El scraping se ejecuta <strong>automáticamente en el backend</strong></p>
            <p>✅ Procesa batches de 50 jugadores (~4 minutos por batch)</p>
            <p>🚀 <strong>Puedes cerrar esta página</strong> - el scraping continuará ejecutándose</p>
            <p>📊 Vuelve en cualquier momento para ver el progreso actualizado en tiempo real</p>
            <p>⏸️ Usa &quot;Pausar&quot; para detener temporalmente el proceso automático</p>
          </div>
        </div>
      )}

      {isPaused && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
          <p className="text-yellow-300">
            Scraping pausado. Haz clic en &quot;Reanudar&quot; para continuar desde donde se detuvo.
          </p>
        </div>
      )}

      {job?.status === 'failed' && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center mb-2">
            <XCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-red-300 font-semibold">
              Job de scraping fallido
            </p>
          </div>
          {job.lastError && (
            <p className="text-red-200 text-sm ml-8 mb-3">
              Error: {job.lastError}
            </p>
          )}
          <p className="text-slate-300 text-sm ml-8">
            💡 Haz clic en el botón &quot;Reset&quot; para limpiar este job y poder iniciar uno nuevo.
          </p>
        </div>
      )}

      {job?.status === 'completed' && !isRunning && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
          <p className="text-green-300">
            ✅ Scraping completado exitosamente. Haz clic en &quot;Reset&quot; para limpiar el estado si deseas iniciar uno nuevo.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Jugadores</p>
                <p className="text-2xl font-bold text-[#D6DDE6]">{job?.totalPlayers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Procesados</p>
                <p className="text-2xl font-bold text-[#D6DDE6]">{job?.processedCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Exitosos</p>
                <p className="text-2xl font-bold text-[#D6DDE6]">{job?.successCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Errores</p>
                <p className="text-2xl font-bold text-[#D6DDE6]">{job?.errorCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="ml-4 w-full">
                <p className="text-sm font-medium text-slate-400 mb-2">Progreso</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-[#FF5733] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job?.progress || 0}%` }}
                    />
                  </div>
                  <p className="text-xl font-bold text-[#D6DDE6]">{job?.progress || 0}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limiting Metrics */}
      {job && (job.rateLimitCount !== undefined || job.errorRate !== undefined) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Rate Limits (429)</p>
                  <p className="text-2xl font-bold text-[#D6DDE6]">{job.rateLimitCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <RefreshCw className="h-8 w-8 text-cyan-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Reintentos</p>
                  <p className="text-2xl font-bold text-[#D6DDE6]">{job.retryCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Tasa de Error</p>
                  <p className="text-2xl font-bold text-[#D6DDE6]">
                    {job.errorRate !== undefined ? `${job.errorRate.toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-slate-700 ${job.slowModeActive ? 'bg-yellow-900/20 border-yellow-700' : 'bg-[#131921]'}`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Velocidad</p>
                  <p className="text-2xl font-bold text-[#D6DDE6]">
                    {job.speedMultiplier ? `${job.speedMultiplier.toFixed(2)}x` : '1.0x'}
                  </p>
                  {job.slowModeActive && (
                    <p className="text-xs text-yellow-400 mt-1">Modo Lento Activo</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs */}
      <Card className="bg-[#131921] border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-[#D6DDE6]">Logs de Scraping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-slate-400">No hay logs disponibles. Haz clic en &quot;Iniciar Scraping&quot; para comenzar.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-slate-300 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions - Collapsible */}
      <Card className="bg-[#131921] border-slate-700">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="instructions" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <CardTitle className="text-[#D6DDE6] text-left">Instrucciones</CardTitle>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="text-slate-300 space-y-2">
                <p className="font-semibold text-[#FF5733]">🚀 Sistema optimizado Anti-DDoS para miles de jugadores:</p>
                <ul className="ml-6 space-y-1">
                  <li>✅ Procesamiento por lotes: 5 jugadores por batch (configuración conservadora)</li>
                  <li>✅ Pausas aleatorias: 5-15 segundos entre jugadores (evita patrones)</li>
                  <li>✅ Rotación de User-Agents: 20+ navegadores diferentes</li>
                  <li>✅ Headers realistas: Simula navegador real con todos los headers</li>
                  <li>✅ Manejo de rate limits (429): Retry automático con exponential backoff</li>
                  <li>✅ Throttling adaptativo: Reduce velocidad automáticamente si detecta errores</li>
                  <li>✅ Máximo 3 reintentos por jugador con delays incrementales</li>
                  <li>✅ Protección anti-bloqueo: Pausa automática si hay 5 rate limits consecutivos</li>
                </ul>

                <p className="mt-4 font-semibold text-[#FF5733]">📊 Métricas en Tiempo Real:</p>
                <ul className="ml-6 space-y-1">
                  <li>• Rate Limits (429): Cuántas veces Transfermarkt bloqueó temporalmente</li>
                  <li>• Reintentos: Total de intentos adicionales por errores</li>
                  <li>• Tasa de Error: Porcentaje de fallos (activa modo lento si &gt; 20%)</li>
                  <li>• Velocidad: Multiplicador actual (1.0x = normal, 2.0x = lento, 3.0x = muy lento)</li>
                </ul>

                <p className="mt-4 font-semibold text-[#FF5733]">🎯 Funcionamiento (Procesamiento Manual Bajo Demanda):</p>
                <ul className="ml-6 space-y-1">
                  <li>1. Haz clic en &quot;Iniciar Scraping&quot; para crear un nuevo trabajo</li>
                  <li>2. 🏟️ <strong>Se ejecutan DOS procesos en paralelo: JUGADORES + EQUIPOS</strong></li>
                  <li>3. 📊 <strong>Procesa 100 jugadores + 50 equipos por ejecución</strong></li>
                  <li>4. ✅ <strong>El scraping solo se ejecuta cuando el administrador lo solicita</strong></li>
                  <li>5. ✅ <strong>Puedes cerrar esta página - el scraping continuará en segundo plano</strong></li>
                  <li>6. El sistema usa pausas aleatorias (5-15s jugadores, 3-8s equipos)</li>
                  <li>7. Si detecta problemas, reduce velocidad automáticamente (throttling adaptativo)</li>
                  <li>8. Cada request usa un User-Agent diferente para evitar detección</li>
                  <li>9. Los errores 429 activan retry con tiempos exponenciales (5s, 15s, 45s, 120s)</li>
                  <li>10. El progreso se guarda continuamente - vuelve en cualquier momento para ver el estado</li>
                  <li>11. Auto-pausa después de 5 errores 429 consecutivos para evitar bloqueos</li>
                </ul>

                <p className="mt-4 font-semibold text-[#FF5733]">⚽ 14 campos de JUGADORES extraídos de Transfermarkt:</p>
                <ul className="ml-6 space-y-1 text-sm">
                  <li>1. advisor - Nombre del agente/asesor</li>
                  <li>2. url_trfm_advisor - URL del asesor</li>
                  <li>3. date_of_birth - Fecha de nacimiento</li>
                  <li>4. team_name - Equipo actual</li>
                  <li>5. team_loan_from - Equipo de cesión (si aplica)</li>
                  <li>6. position_player - Posición en el campo</li>
                  <li>7. foot - Pie dominante</li>
                  <li>8. height - Altura en cm</li>
                  <li>9. nationality_1 - Nacionalidad principal</li>
                  <li>10. nationality_2 - Segunda nacionalidad (si aplica)</li>
                  <li>11. national_tier - Nivel de selección nacional</li>
                  <li>12. agency - Agencia representante</li>
                  <li>13. contract_end - Fecha fin de contrato</li>
                  <li>14. player_trfm_value - Valor de mercado en €</li>
                </ul>

                <p className="mt-4 font-semibold text-[#FF5733]">🏟️ 5 campos de EQUIPOS extraídos de Transfermarkt:</p>
                <ul className="ml-6 space-y-1 text-sm">
                  <li>1. team_name - Nombre oficial del equipo</li>
                  <li>2. team_country - País del equipo</li>
                  <li>3. competition - Liga/Competición actual</li>
                  <li>4. team_trfm_value - Valor de mercado total del equipo en €</li>
                  <li>5. team_rating - Rating del equipo (si disponible)</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* 🧪 MODAL DE RESULTADOS DE TEST */}
      {showTestModal && testResults && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#131921] rounded-lg border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center">
                <FlaskRound className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-2xl font-bold text-[#D6DDE6]">Resultados del Test de Scraping</h2>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-[#1a2332] border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Database className="h-8 w-8 text-blue-400 mr-3" />
                      <div>
                        <p className="text-sm text-slate-400">Total Procesados</p>
                        <p className="text-2xl font-bold text-[#D6DDE6]">{testResults.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a2332] border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-400 mr-3" />
                      <div>
                        <p className="text-sm text-slate-400">Exitosos</p>
                        <p className="text-2xl font-bold text-green-400">
                          {testResults.filter(r => r.success).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a2332] border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <XCircle className="h-8 w-8 text-red-400 mr-3" />
                      <div>
                        <p className="text-sm text-slate-400">Errores</p>
                        <p className="text-2xl font-bold text-red-400">
                          {testResults.filter(r => !r.success).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results List */}
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <Card key={result.entityId} className="bg-[#1a2332] border-slate-600">
                    <CardContent className="p-4">
                      {/* Entity Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-[#D6DDE6]">
                              {result.entityType === 'player' ? '⚽' : '🏟️'} {index + 1}. {result.entityName}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
                                {result.entityType === 'player' ? 'Jugador' : 'Equipo'}
                              </span>
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:underline"
                              >
                                {result.url}
                              </a>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-slate-400">
                          {result.fieldsUpdated.length} campos actualizados
                        </span>
                      </div>

                      {/* Error Message */}
                      {result.error && (
                        <div className="bg-red-900/20 border border-red-700 rounded p-3 mb-3">
                          <p className="text-red-400 text-sm">❌ Error: {result.error}</p>
                        </div>
                      )}

                      {/* Fields Updated */}
                      {result.success && result.fieldsUpdated.length > 0 && (
                        <div className="bg-[#0f1419] rounded p-3">
                          <p className="text-sm font-semibold text-slate-300 mb-2">Campos actualizados:</p>
                          <div className="space-y-2">
                            {result.fieldsUpdated.map((field, fieldIndex) => (
                              <div key={fieldIndex} className="text-sm">
                                <span className="text-purple-400 font-mono">{field.field}</span>
                                <div className="ml-4 mt-1">
                                  <div className="flex items-center text-xs">
                                    <span className="text-slate-500 w-24">Anterior:</span>
                                    <span className="text-slate-400 font-mono">
                                      {field.oldValue || <span className="text-slate-600 italic">null</span>}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-xs">
                                    <span className="text-slate-500 w-24">Nuevo:</span>
                                    <span className="text-green-400 font-mono font-semibold">
                                      {field.newValue || <span className="text-slate-600 italic">null</span>}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Changes */}
                      {result.success && result.fieldsUpdated.length === 0 && (
                        <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                          <p className="text-blue-400 text-sm">ℹ️ No se encontraron cambios (datos ya estaban actualizados)</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 flex justify-end">
              <Button
                onClick={() => setShowTestModal(false)}
                className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
