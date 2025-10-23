'use client'

import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock, Database, AlertCircle, RefreshCw, BarChart3, Activity, FlaskRound } from "lucide-react"
import { useEffect, useState, useCallback } from 'react'

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
  const [autoProcess, setAutoProcess] = useState(false)

  // 🧪 Estados para Test Scraping
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }, [])

  // 📡 CONECTAR A LOGS EN TIEMPO REAL VIA SSE
  useEffect(() => {
    if (!job?.id || !isRunning) return

    const eventSource = new EventSource(`/api/admin/scraping/logs?jobId=${job.id}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.log) {
          // Añadir log sin timestamp (ya viene con timestamp del servidor)
          setLogs(prev => [...prev, data.log])
        }

        if (data.done) {
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
      eventSource.close()
    }
  }, [job?.id, isRunning])

  // 📊 OBTENER ESTADO DEL JOB
  const fetchJobStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/scraping/status')
      const data = await response.json()

      if (data.exists && data.job) {
        setJob(data.job)

        const status = data.job.status
        setIsRunning(status === 'running' || status === 'pending')
        setIsPaused(status === 'paused')

        // Si está completo, detener auto-procesamiento
        if (status === 'completed' || status === 'failed') {
          setAutoProcess(false)
        }
      } else {
        setJob(null)
        setIsRunning(false)
        setIsPaused(false)
      }
    } catch (error) {
      console.error('Error fetching job status:', error)
    }
  }, [])

  // 🔄 PROCESAR SIGUIENTE BATCH
  const processBatch = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/scraping/process', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar batch')
      }

      // Actualizar estado del job
      if (data.job) {
        setJob(data.job)
      }

      // Los logs ahora vienen automáticamente vía SSE, no es necesario añadirlos aquí

      // Si está completo, detener
      if (data.completed) {
        setAutoProcess(false)
        setIsRunning(false)
      }

      return data
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR: ${errorMsg}`)
      setAutoProcess(false)
      setIsRunning(false)
      throw error
    }
  }, [addLog])

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

      addLog('✅ Ambos procesos iniciados correctamente')
      addLog('')

      setJob(data.playersJob)
      setIsRunning(true)
      setAutoProcess(true)

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
      setAutoProcess(false)
      setIsRunning(false)
      setIsPaused(true)
      await fetchJobStatus()

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR: ${errorMsg}`)
    }
  }

  // ▶️ REANUDAR JOB
  const resumeScraping = () => {
    addLog('▶️ Reanudando scraping...')
    setAutoProcess(true)
    setIsRunning(true)
    setIsPaused(false)
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
      setAutoProcess(false)
      setIsRunning(false)
      setIsPaused(false)
      await fetchJobStatus()

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR: ${errorMsg}`)
    }
  }

  // 🔄 RESET
  const resetStats = () => {
    setLogs([])
    setJob(null)
    setIsRunning(false)
    setIsPaused(false)
    setAutoProcess(false)
    addLog('🔄 Estado reiniciado')
  }

  // 🧪 TEST SCRAPING (5 jugadores)
  const runTestScraping = async () => {
    addLog('🧪 Iniciando test de scraping (3 jugadores + 3 equipos)...')
    addLog('⏳ Procesando... esto puede tardar 30-60 segundos')
    addLog('')
    setIsTesting(true)
    setTestResults(null)

    // Mostrar mensaje de progreso cada 5 segundos
    const progressInterval = setInterval(() => {
      addLog('⏳ Scraping en progreso...')
    }, 5000)

    try {
      const response = await fetch('/api/admin/scraping/test', {
        method: 'POST'
      })

      clearInterval(progressInterval)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al ejecutar test')
      }

      addLog('')
      addLog(`✅ Test completado exitosamente!`)
      addLog(`📊 Jugadores procesados: ${data.summary.players}`)
      addLog(`🏟️ Equipos procesados: ${data.summary.teams}`)
      addLog(`✅ Éxitos: ${data.summary.success}`)
      addLog(`❌ Errores: ${data.summary.errors}`)
      addLog(`📈 Total: ${data.summary.total} entidades`)
      addLog('')

      setTestResults(data.results)
      setShowTestModal(true)

    } catch (error) {
      clearInterval(progressInterval)
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR en test: ${errorMsg}`)
    } finally {
      setIsTesting(false)
    }
  }

  // 🔄 AUTO-PROCESAMIENTO
  useEffect(() => {
    if (!autoProcess || !isRunning) return

    const interval = setInterval(async () => {
      try {
        const data = await processBatch()

        // Si se completó, detener el intervalo
        if (data.completed) {
          setAutoProcess(false)
          setIsRunning(false)
        }
      } catch (error) {
        console.error('Error en auto-procesamiento:', error)
        setAutoProcess(false)
        setIsRunning(false)
      }
    }, 2000) // Cada 2 segundos

    return () => clearInterval(interval)
  }, [autoProcess, isRunning, processBatch])

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
            variant="outline"
            className="border-slate-700 bg-[#131921] text-white hover:bg-slate-700"
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
              Scraping en proceso
            </p>
          </div>
          <div className="ml-8 space-y-1 text-sm text-blue-200">
            <p>✅ El scraping se ejecuta bajo demanda cuando el administrador lo inicia</p>
            <p>✅ Procesa 100 jugadores + 50 equipos por ejecución (~10-20 minutos)</p>
            <p>✅ Puedes cerrar esta página - el scraping continuará en segundo plano</p>
            <p>✅ Vuelve en cualquier momento para ver el progreso actualizado</p>
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

      {/* Instructions */}
      <Card className="bg-[#131921] border-slate-700">
        <CardHeader>
          <CardTitle className="text-[#D6DDE6]">Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
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
