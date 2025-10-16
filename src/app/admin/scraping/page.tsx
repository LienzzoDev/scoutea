'use client'

import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock, Database } from "lucide-react"
import { useState } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'


export default function ScrapingPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0
  })

  // Si no está cargado, mostrar loading
  if (!isLoaded) {
    return <LoadingPage />
  }

  // Si no está autenticado, mostrar nada (ya se está redirigiendo)
  if (!isSignedIn) {
    return null
  }

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message])
  }

  const startScraping = async () => {
    setIsRunning(true)
    setLogs([])
    setStats({ total: 0, processed: 0, success: 0, errors: 0 })

    addLog('🚀 Iniciando scraping de datos de jugadores...')
    addLog('📊 Configuración: 5 jugadores por lote')
    addLog('⏱️ Pausa entre lotes: 30 segundos')
    addLog('⏱️ Pausa entre jugadores: 5 segundos')
    addLog('')

    try {
      // 🌐 LLAMAR AL ENDPOINT DE SCRAPING
      const response = await fetch('/api/admin/scraping-transfermarkt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al ejecutar scraping')
      }

      // 📊 MOSTRAR RESULTADOS
      addLog('🎉 Scraping completado!')
      addLog(`📊 Total procesados: ${data.results.total}`)
      addLog(`✅ Total exitosos: ${data.results.success}`)
      addLog(`❌ Total errores: ${data.results.errors}`)

      // Actualizar estadísticas finales
      setStats({
        total: data.results.total,
        processed: data.results.processed,
        success: data.results.success,
        errors: data.results.errors
      })

      // Mostrar detalles de cada jugador procesado
      if (data.results.details && data.results.details.length > 0) {
        addLog('')
        addLog('📋 Detalle de jugadores procesados:')
        addLog('')

        data.results.details.forEach((result: any, index: number) => {
          addLog(`[${index + 1}/${data.results.total}] ${result.playerName}`)

          if (result.success) {
            if (result.fieldsUpdated.length > 0) {
              addLog(`✅ Actualizado: ${result.fieldsUpdated.join(', ')}`)
            } else {
              addLog('⚠️ Sin cambios (datos ya actualizados)')
            }
          } else {
            addLog(`❌ Error: ${result.error}`)
          }

          addLog('')
        })
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      addLog(`❌ ERROR: ${errorMsg}`)

      setStats(prev => ({
        ...prev,
        errors: prev.errors + 1
      }))
    }

    setIsRunning(false)
  }

  const stopScraping = () => {
    setIsRunning(false)
    setLogs(prev => [...prev, '⏹️ Scraping detenido por el usuario'])
  }

  const resetStats = () => {
    setStats({ total: 0, processed: 0, success: 0, errors: 0 })
    setLogs([])
  }

  return (
    <main className="px-6 py-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#D6DDE6]">Scraping de Datos</h1>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={startScraping}
            disabled={isRunning}
            className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Ejecutando...' : 'Iniciar Scraping'}
          </Button>
          <Button 
            onClick={stopScraping}
            disabled={!isRunning}
            variant="outline"
            className="border-red-700 text-red-400 hover:bg-red-900/20"
          >
            <Pause className="h-4 w-4 mr-2" />
            Detener
          </Button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Jugadores</p>
                <p className="text-2xl font-bold text-[#D6DDE6]">{stats.total}</p>
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
                <p className="text-2xl font-bold text-[#D6DDE6]">{stats.processed}</p>
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
                <p className="text-2xl font-bold text-[#D6DDE6]">{stats.success}</p>
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
                <p className="text-2xl font-bold text-[#D6DDE6]">{stats.errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card className="bg-[#131921] border-slate-700">
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
      <Card className="bg-[#131921] border-slate-700 mt-6">
        <CardHeader>
          <CardTitle className="text-[#D6DDE6]">Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-300 space-y-2">
            <p>• El scraping extrae datos de jugadores desde Transfermarkt.es</p>
            <p>• Solo procesa jugadores que tengan URL de Transfermarkt completada en la BD</p>
            <p>• Se procesan 5 jugadores por lote con pausas de 5 segundos entre jugadores</p>
            <p>• Pausa de 30 segundos entre lotes para evitar bloqueos</p>
            <p>• Los datos se actualizan automáticamente en la base de datos</p>
            <p className="font-semibold text-[#FF5733]">• 13 campos extraídos:</p>
            <ul className="ml-6 space-y-1 text-sm">
              <li>1. advisor - Nombre del agente/asesor</li>
              <li>2. date_of_birth - Fecha de nacimiento</li>
              <li>3. team_name - Equipo actual</li>
              <li>4. team_loan_from - Equipo de cesión (si aplica)</li>
              <li>5. position_player - Posición en el campo</li>
              <li>6. foot - Pie dominante</li>
              <li>7. height - Altura en cm</li>
              <li>8. nationality_1 - Nacionalidad principal</li>
              <li>9. nationality_2 - Segunda nacionalidad (si aplica)</li>
              <li>10. national_tier - Nivel de selección nacional</li>
              <li>11. agency - Agencia representante</li>
              <li>12. contract_end - Fecha fin de contrato</li>
              <li>13. player_trfm_value - Valor de mercado en €</li>
            </ul>
            <p className="mt-4">• También se extrae url_trfm_advisor (URL del advisor)</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
