'use client'

import { Filter, X, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useScoutQualitativeWithFilters } from '@/hooks/scout/useScoutQualitativeWithFilters'
import { QualitativeData, QualitativeFilters } from '@/lib/services/scout-qualitative-service'

import { DonutChart } from '../donut-chart'

interface QualitativeDashboardProps {
  scoutId: string
}

const chartConfigs = [
  { key: 'reportType', name: 'REPORT TYPE', title: 'TIPOS', subtitle: 'REPORTE' },
  { key: 'position', name: 'POSITION', title: 'POSICIÓN', subtitle: 'JUGADOR' },
  { key: 'nationality', name: 'NATIONALITY 1', title: 'NACIONALIDAD', subtitle: 'PRINCIPAL' },
  { key: 'potential', name: 'POTENTIAL', title: 'POTENCIAL', subtitle: 'JUGADOR' },
  { key: 'initialAge', name: 'INITIAL AGE', title: 'EDAD', subtitle: 'INICIAL' },
  { key: 'initialCountry', name: 'INITIAL COUNTRY', title: 'PAÍS', subtitle: 'INICIAL' },
  { key: 'transferTeamPts', name: 'TRANSFER TEAM PTS', title: 'PUNTOS', subtitle: 'EQUIPO' },
  { key: 'initialTRFMValue', name: 'INITIAL TRFM VALUE', title: 'VALOR', subtitle: 'INICIAL' },
]

export function QualitativeDashboard({ scoutId }: QualitativeDashboardProps) {
  const [showFilters, setShowFilters] = useState(false)

  const {
    data: qualitativeData,
    filterOptions,
    loading,
    error,
    filters: selectedFilters,
    setFilters: setSelectedFilters,
  } = useScoutQualitativeWithFilters(scoutId)

  const getChartData = (key: keyof QualitativeData) => {
    if (!qualitativeData || !qualitativeData[key]) {
      return []
    }
    
    const data = qualitativeData[key]
    
    // Verificar si data es realmente un objeto con propiedades
    if (typeof data !== 'object' || data === null || Object.keys(data).length === 0) {
      return []
    }
    
    const entries = Object.entries(data).map(([name, value]) => ({
      name,
      value: typeof value === 'number' ? value : parseInt(String(value)) || 0
    }))
    
    // Ordenar por valor descendente y tomar solo los primeros 8 para mejor visualización
    return entries.sort((a, b) => b.value - a.value).slice(0, 8)
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
      case 'initialTeam':
        return options.concat(filterOptions.teams?.slice(0, 10) || [])
      case 'initialTeamLevel':
        return options.concat(filterOptions.teamLevels || [])
      case 'initialCompetition':
        return options.concat(filterOptions.competitions?.slice(0, 10) || [])
      case 'initialCompetitionLevel':
        return options.concat(filterOptions.competitionLevels || [])
      case 'initialCountry':
        return options.concat(filterOptions.countries || [])
      case 'potential':
        return ['Todos', 'High', 'Medium', 'Low']
      case 'initialAge':
        return ['Todos', '18-21', '22-25', '26-29', '30+']
      case 'transferTeamPts':
        return ['Todos', '80+', '60-79', '40-59', '<40']
      case 'transferCompetPts':
        return ['Todos', '80+', '60-79', '40-59', '<40']
      case 'initialTRFMValue':
        return ['Todos', '50M+', '20-50M', '5-20M', '<5M']
      default:
        return options
    }
  }

  const handleFilterChange = (filterId: string, value: string) => {
    console.log('🎛️ Filter changed:', filterId, value)
    const newValue = value === 'todos' ? undefined : value
    setSelectedFilters({ ...selectedFilters, [filterId]: newValue })
  }

  const clearAllFilters = () => {
    console.log('🧹 Clearing all filters')
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
        <h2 className='text-xl font-bold text-[#8B4513]'>Dashboard Cualitativo</h2>
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
                    value={selectedFilters[filter.id as keyof QualitativeFilters] || 'todos'}
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
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8'>
              {chartConfigs.map(chart => (
                <div key={chart.key} className='flex flex-col bg-white rounded-lg p-6 shadow-sm border border-gray-100 min-h-[300px]'>
                  <h3 className='text-lg font-bold tracking-wider text-[#8B4513] text-center mb-6 min-h-[1.5rem] flex items-center justify-center'>
                    {chart.name}
                  </h3>
                  <div className='flex-1 flex items-center justify-center'>
                    <DonutChart
                      data={getChartData(chart.key as keyof QualitativeData)}
                      title={chart.title}
                      subtitle={chart.subtitle}
                      showLegend={false}
                      showPercentages={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
    </div>
  )
}
