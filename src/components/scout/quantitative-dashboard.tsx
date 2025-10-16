'use client'

import { Filter, X, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useScoutQuantitative } from '@/hooks/scout/useScoutQuantitative'
import { QuantitativeData, QuantitativeFilters } from '@/lib/services/scout-quantitative-service'

import { BarChart } from '../bar-chart'

interface QuantitativeDashboardProps {
  scoutId: string
}

const chartConfigs = [
  { 
    key: 'totalReports', 
    name: 'TOTAL REPORTS', 
    title: 'TOTAL REPORTES',
    formatValue: (value: number) => value.toString()
  },
  { 
    key: 'totalInvestment', 
    name: 'TOTAL INVESTMENT', 
    title: 'INVERSIÓN TOTAL',
    formatValue: (value: number) => `€${(value / 1000000).toFixed(1)}M`
  },
  { 
    key: 'netProfit', 
    name: 'NET PROFIT', 
    title: 'BENEFICIO NETO',
    formatValue: (value: number) => `€${(value / 1000000).toFixed(1)}M`
  },
  { 
    key: 'roi', 
    name: 'ROI', 
    title: 'ROI (%)',
    formatValue: (value: number) => `${value.toFixed(1)}%`
  },
  { 
    key: 'transferTeamPts', 
    name: 'TRANSFER TEAM PTS', 
    title: 'PUNTOS EQUIPO',
    formatValue: (value: number) => value.toFixed(1)
  },
  { 
    key: 'transferCompetitionPts', 
    name: 'TRANSFER COMPET PTS', 
    title: 'PUNTOS COMPETICIÓN',
    formatValue: (value: number) => value.toFixed(1)
  },
  { 
    key: 'initialTRFMValue', 
    name: 'INITIAL TRFM VALUE', 
    title: 'VALOR INICIAL',
    formatValue: (value: number) => `€${(value / 1000000).toFixed(1)}M`
  },
  { 
    key: 'profitPerReport', 
    name: 'PROFIT/REPORT', 
    title: 'BENEFICIO/REPORTE',
    formatValue: (value: number) => `€${(value / 1000).toFixed(0)}K`
  },
]

export function QuantitativeDashboard({ scoutId }: QuantitativeDashboardProps) {
  const [showFilters, setShowFilters] = useState(false)

  const {
    data: quantitativeData,
    filterOptions,
    loading,
    error,
    filters: selectedFilters,
    setFilters: setSelectedFilters,
  } = useScoutQuantitative(scoutId)

  const getChartData = (key: keyof QuantitativeData) => {
    if (!quantitativeData || !quantitativeData[key]) {
      return []
    }
    
    const data = quantitativeData[key]
    
    // Función para asegurar valores numéricos válidos
    const safeValue = (value: any) => {
      if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
        return 0
      }
      return Number(value)
    }
    
    return [
      { 
        label: 'SCOUT', 
        value: safeValue(data.scoutValue),
        color: '#8B4513'
      },
      { 
        label: 'MAX', 
        value: safeValue(data.maxValue),
        color: '#06b6d4'
      },
      { 
        label: 'AVG', 
        value: safeValue(data.avgValue),
        color: '#0891b2'
      },
      { 
        label: 'MIN', 
        value: safeValue(data.minValue),
        color: '#0e7490'
      }
    ].filter(item => item.value >= 0) // Filtrar valores negativos si es necesario
  }

  const getFilterOptions = (filterType: string) => {
    if (!filterOptions) return ['Todos']
    
    const options = ['Todos']
    switch (filterType) {
      case 'reportType':
        return options.concat(filterOptions.reportTypes || [])
      case 'position':
        return options.concat(filterOptions.positions || [])
      case 'nationality1':
        return options.concat(filterOptions.nationalities || [])
      case 'potential':
        return ['Todos', 'High', 'Medium', 'Low']
      case 'initialAge':
        return ['Todos', '18-21', '22-25', '26-29', '30+']
      case 'initialCountry':
        return options.concat(filterOptions.countries || [])
      case 'transferTeamPts':
        return ['Todos', '80+', '60-79', '40-59', '<40']
      case 'initialTRFMValue':
        return ['Todos', '50M+', '20-50M', '5-20M', '<5M']
      default:
        return options
    }
  }

  const handleFilterChange = (filterId: string, value: string) => {
    console.log('🎛️ Quantitative filter changed:', filterId, value)
    const newValue = value === 'todos' ? undefined : value
    setSelectedFilters({ ...selectedFilters, [filterId]: newValue })
  }

  const clearAllFilters = () => {
    console.log('🧹 Clearing all quantitative filters')
    setSelectedFilters({})
  }

  const hasActiveFilters = Object.values(selectedFilters).some(value => value !== undefined && value !== '')
  const totalActiveFilters = Object.values(selectedFilters).filter(v => v !== undefined && v !== '').length

  if (error) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-600 mb-2'>Error</div>
          <div className='text-gray-600'>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-background'>
      {/* Filter Button */}
      <div className='mb-6 flex justify-between items-center'>
        <h2 className='text-xl font-bold text-[#8B4513]'>Dashboard Cuantitativo</h2>
        <Button
          variant="outline"
          className={`flex items-center gap-2 border-[#e7e7e7] transition-all duration-200 ${
            showFilters
              ? "bg-[#8c1a10]/10 text-[#8c1a10] border-[#8c1a10]/30"
              : "text-[#6d6d6d] bg-transparent"
          }`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 text-[#8c1a10]" />
          {totalActiveFilters > 0 ? `Filtros (${totalActiveFilters})` : 'Filtros'}
        </Button>
      </div>

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <div className='bg-white rounded-lg p-6 border border-[#e7e7e7] mb-6'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <h3 className='font-semibold text-[#000000]'>Filtros</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className='flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors cursor-pointer'
                >
                  <span className='text-red-600 text-sm'>Limpiar Filtros</span>
                  <X className='w-3 h-3 text-red-600' />
                </button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {loading && !filterOptions ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-6 h-6 animate-spin text-[#8B4513]' />
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {[
                { id: 'reportType', label: 'Tipo de Reporte' },
                { id: 'position', label: 'Posición' },
                { id: 'nationality1', label: 'Nacionalidad' },
                { id: 'potential', label: 'Potencial' },
                { id: 'initialAge', label: 'Edad Inicial' },
                { id: 'initialCountry', label: 'País Inicial' },
                { id: 'transferTeamPts', label: 'Puntos Equipo' },
                { id: 'initialTRFMValue', label: 'Valor Inicial' },
              ].map(filter => (
                <div key={filter.id}>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    {filter.label}
                  </label>
                  <Select
                    value={selectedFilters[filter.id as keyof QuantitativeFilters] || 'todos'}
                    onValueChange={value => handleFilterChange(filter.id, value)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilterOptions(filter.id).map((option, index) => (
                        <SelectItem key={`${filter.id}-${option}-${index}`} value={option.toLowerCase()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className='bg-gray-50 p-6 rounded-lg'>
          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <Loader2 className='w-8 h-8 animate-spin text-[#8B4513]' />
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
              {chartConfigs.map(chart => (
                <div key={chart.key} className='flex flex-col space-y-6'>
                  <div className='text-center'>
                    <h3 className='text-lg font-bold tracking-wider text-[#8B4513] mb-2'>
                      {chart.name}
                    </h3>
                    {quantitativeData && quantitativeData[chart.key as keyof QuantitativeData] && (
                      <div className='text-sm text-gray-600 mb-4'>
                        Ranking: #{quantitativeData[chart.key as keyof QuantitativeData].rank}
                      </div>
                    )}
                  </div>
                  <BarChart 
                    data={getChartData(chart.key as keyof QuantitativeData)}
                    showRanking={true}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
    </div>
  )
}