'use client'

import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock, Database } from "lucide-react"

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

  const startScraping = async () => {
    setIsRunning(true)
    setLogs([])
    setStats({ total: 0, processed: 0, success: 0, errors: 0 })
    
    // Simular logs de scraping
    const mockLogs = [
      '🚀 Iniciando scraping de datos de jugadores...',
      '📊 Configuración: 5 jugadores por lote',
      '⏱️ Pausa entre lotes: 30 segundos',
      '⏱️ Pausa entre jugadores: 5 segundos',
      '',
      '📦 LOTE 1',
      '📊 Procesando 5 jugadores en este lote...',
      '',
      '[1/5] Lionel Messi',
      '✅ Actualizado: url_trfm_advisor, date_of_birth, team_name, position_player, foot, height, nationality_1, agency, contract_end, player_trfm_value',
      '',
      '[2/5] Cristiano Ronaldo',
      '✅ Actualizado: url_trfm_advisor, position_player, agency, contract_end, player_trfm_value',
      '',
      '[3/5] Kylian Mbappé',
      '✅ Actualizado: url_trfm_advisor, date_of_birth, team_name, position_player, foot, height, nationality_1, contract_end, player_trfm_value',
      '',
      '[4/5] Erling Haaland',
      '✅ Actualizado: url_trfm_advisor, date_of_birth, team_name, position_player, foot, height, nationality_1, contract_end, player_trfm_value',
      '',
      '[5/5] Luka Modrić',
      '✅ Actualizado: url_trfm_advisor, position_player, nationality_1, contract_end, player_trfm_value',
      '',
      '📊 Resumen del lote 1:',
      '✅ Exitosos: 5',
      '❌ Errores: 0',
      '',
      '⏳ Pausa entre lotes: 30 segundos...',
      '',
      '📦 LOTE 2',
      '📊 Procesando 5 jugadores en este lote...',
      '',
      '[1/5] Kevin De Bruyne',
      '✅ Actualizado: url_trfm_advisor, position_player, nationality_1, contract_end, player_trfm_value',
      '',
      '[2/5] Virgil van Dijk',
      '✅ Actualizado: url_trfm_advisor, position_player, nationality_1, contract_end, player_trfm_value',
      '',
      '[3/5] Mohamed Salah',
      '✅ Actualizado: url_trfm_advisor, position_player, nationality_1, contract_end, player_trfm_value',
      '',
      '[4/5] Neymar',
      '✅ Actualizado: url_trfm_advisor, position_player, nationality_1, contract_end, player_trfm_value',
      '',
      '[5/5] Robert Lewandowski',
      '✅ Actualizado: url_trfm_advisor, position_player, nationality_1, contract_end, player_trfm_value',
      '',
      '📊 Resumen del lote 2:',
      '✅ Exitosos: 5',
      '❌ Errores: 0',
      '',
      '🎉 Scraping completado!',
      '📊 Total procesados: 10',
      '✅ Total exitosos: 10',
      '❌ Total errores: 0'
    ]

    // Simular progreso
    for (let i = 0; i < mockLogs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setLogs(prev => [...prev, mockLogs[i]])
      
      // Actualizar estadísticas
      if (mockLogs[i].includes('[1/5]') || mockLogs[i].includes('[2/5]') || mockLogs[i].includes('[3/5]') || mockLogs[i].includes('[4/5]') || mockLogs[i].includes('[5/5]')) {
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          processed: prev.processed + 1
        }))
      }
      
      if (mockLogs[i].includes('✅ Actualizado:')) {
        setStats(prev => ({
          ...prev,
          success: prev.success + 1
        }))
      }
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
              <div className="text-slate-400">No hay logs disponibles. Haz clic en "Iniciar Scraping" para comenzar.</div>
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
            <p>• Se procesan 5 jugadores por lote con pausas de 5 segundos entre jugadores</p>
            <p>• Pausa de 30 segundos entre lotes para evitar bloqueos</p>
            <p>• Los datos se actualizan automáticamente en la base de datos</p>
            <p>• Campos extraídos: fecha de nacimiento, equipo, posición, pie, altura, nacionalidad, agencia, contrato, valor de mercado</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
