'use client'

import { useState, useEffect } from 'react'
import { Loader2, Globe } from 'lucide-react'
import { ScoutMetricsCards } from './scout-metrics-cards'

interface ScoutSummaryStatsProps {
  scoutId: string
}

interface ScoutSummaryData {
  scout: {
    scout_name: string | null
    name: string | null
    nationality: string | null
    total_reports: number | null
    original_reports: number | null
    avg_potential: number | null
    avg_initial_age: number | null
    roi: number | null
    net_profits: number | null
    scout_level: string | null
    scout_ranking: number | null
    nationality_expertise: string | null
    competition_expertise: string | null
  } | null
  recentReports: Array<{
    id_report: string
    report_date: Date | null
    report_type: string | null
    player_name: string | null
    position_player: string | null
    nationality_1: string | null
    roi: number | null
    profit: number | null
  }>
}

export function ScoutSummaryStats({ scoutId }: ScoutSummaryStatsProps) {
  const [data, setData] = useState<ScoutSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [scoutId])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/scout/${scoutId}/summary`)
      if (!response.ok) {
        throw new Error('Error al cargar datos del scout')
      }
      
      const summaryData = await response.json()
      setData(summaryData)
      setError(null)
    } catch (err) {
      console.error('Error loading scout summary:', err)
      setError('Error al cargar el resumen del scout')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '€0'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number | null) => {
    if (!value) return '0%'
    return `${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='w-6 h-6 animate-spin text-[#8B4513]' />
      </div>
    )
  }

  if (error || !data?.scout) {
    return (
      <div className='text-center p-8'>
        <div className='text-red-600 mb-2'>Error</div>
        <div className='text-gray-600'>{error || 'No se encontraron datos del scout'}</div>
      </div>
    )
  }

  const { scout, recentReports } = data

  return (
    <div className='space-y-6'>
      {/* Métricas principales */}
      <ScoutMetricsCards scout={scout} />

      {/* Información adicional */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Perfil del Scout */}
        <div className='bg-white rounded-lg p-6 border border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Perfil del Scout</h3>
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <Globe className='w-4 h-4 text-gray-500' />
              <div>
                <span className='text-sm text-gray-600'>Nacionalidad: </span>
                <span className='font-medium'>{scout.nationality || 'No especificada'}</span>
              </div>
            </div>
            <div>
              <span className='text-sm text-gray-600'>Nivel: </span>
              <span className='font-medium'>{scout.scout_level || 'No especificado'}</span>
            </div>
            <div>
              <span className='text-sm text-gray-600'>Ranking: </span>
              <span className='font-medium'>#{scout.scout_ranking || 'N/A'}</span>
            </div>
            <div>
              <span className='text-sm text-gray-600'>Edad promedio inicial: </span>
              <span className='font-medium'>{scout.avg_initial_age?.toFixed(1) || 'N/A'} años</span>
            </div>
            <div>
              <span className='text-sm text-gray-600'>Potencial promedio: </span>
              <span className='font-medium'>{scout.avg_potential?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Especialización */}
        <div className='bg-white rounded-lg p-6 border border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Especialización</h3>
          <div className='space-y-3'>
            <div>
              <span className='text-sm text-gray-600'>Nacionalidad de especialización: </span>
              <span className='font-medium'>{scout.nationality_expertise || 'No especificada'}</span>
            </div>
            <div>
              <span className='text-sm text-gray-600'>Competición de especialización: </span>
              <span className='font-medium'>{scout.competition_expertise || 'No especificada'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reportes recientes */}
      {recentReports.length > 0 && (
        <div className='bg-white rounded-lg p-6 border border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Reportes Recientes</h3>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-2 text-gray-600'>Fecha</th>
                  <th className='text-left py-2 text-gray-600'>Jugador</th>
                  <th className='text-left py-2 text-gray-600'>Posición</th>
                  <th className='text-left py-2 text-gray-600'>Nacionalidad</th>
                  <th className='text-left py-2 text-gray-600'>ROI</th>
                  <th className='text-left py-2 text-gray-600'>Beneficio</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id_report} className='border-b border-gray-100'>
                    <td className='py-2'>
                      {report.report_date 
                        ? new Date(report.report_date).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </td>
                    <td className='py-2 font-medium'>{report.player_name || 'N/A'}</td>
                    <td className='py-2'>{report.position_player || 'N/A'}</td>
                    <td className='py-2'>{report.nationality_1 || 'N/A'}</td>
                    <td className='py-2'>
                      <span className={`${(report.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(report.roi)}
                      </span>
                    </td>
                    <td className='py-2'>
                      <span className={`${(report.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(report.profit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}