'use client'

import { ChevronDown, Loader2 } from 'lucide-react'
import { DonutChart } from '../donut-chart'
import { QualitativeData, QualitativeFilters } from '@/lib/services/scout-qualitative-service'
import { useScoutQualitativeWithFilters } from '@/hooks/scout/useScoutQualitativeWithFilters'

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
    <div className='min-h-screen bg-background'>
      <div className='flex'>
        {/* Sidebar */}
        <aside className='w-64 border-r border-border p-6 space-y-4'>
          <div className='flex items-center gap-2 mb-6'>
            <h1 className='text-xl font-bold text-[#8B4513] tracking-wide'>FILTROS</h1>
            {hasActiveFilters && (
              <span className='bg-[#8B4513] text-white text-xs px-2 py-1 rounded-full'>
                {Object.values(selectedFilters).filter(v => v !== undefined && v !== '').length}
              </span>
            )}
            <ChevronDown className='w-5 h-5 text-[#8B4513]' />
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
              <div className='text-xs font-medium text-blue-800 mb-2'>Filtros Activos:</div>
              <div className='space-y-1'>
                {Object.entries(selectedFilters).map(([key, value], index) => {
                  if (value && value !== '') {
                    return (
                      <div key={`filter-${key}-${index}`} className='text-xs text-blue-700'>
                        <span className='font-medium'>{key}:</span> {value}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
              <button
                onClick={clearAllFilters}
                className='w-full mt-2 px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors'
              >
                Limpiar Todos
              </button>
            </div>
          )}
          
          {loading && !filterOptions ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-6 h-6 animate-spin text-[#8B4513]' />
            </div>
          ) : (
            <div className='space-y-4'>
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
                  <label className='block text-sm font-medium text-[#8B4513] mb-2'>
                    {filter.label}
                  </label>
                  <select
                    value={selectedFilters[filter.id as keyof QualitativeFilters] || 'todos'}
                    onChange={e => handleFilterChange(filter.id, e.target.value)}
                    className='w-full bg-white border border-[#8B4513] text-gray-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-transparent hover:border-[#7A3F12] transition-colors'
                  >
                    {getFilterOptions(filter.id).map((option, index) => (
                      <option key={`${filter.id}-${option}-${index}`} value={option.toLowerCase()}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className='flex-1 p-8 bg-gray-50'>
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
    </div>
  )
}
