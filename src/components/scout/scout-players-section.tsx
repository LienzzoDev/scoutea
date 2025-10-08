'use client'

import { Search, Plus, X } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CategorySelector from '@/components/filters/category-selector'
import MultiSelectFilter from '@/components/filters/multi-select-filter'
import RangeFilter from '@/components/filters/range-filter'
import ScoutPlayerFilters from './ScoutPlayerFilters'
import ScoutPlayersTable from './scout-players-table'

interface PlayerData {
  player: {
    id_player: string
    player_name: string
    position_player: string | null
    nationality_1: string | null
    team_name: string | null
    player_rating: number | null
    age: number | null
  }
  latestReport: {
    id_report: string
    report_date: Date | null
    report_type: string | null
    roi: number | null
    profit: number | null
    potential: number | null
  }
  totalReports: number
}

interface ScoutPlayersSectionProps {
  players: PlayerData[]
  isLoading: boolean
  error: string | null
}

export default function ScoutPlayersSection({
  players,
  isLoading,
  error
}: ScoutPlayersSectionProps) {
  // Estados básicos
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Estados para filtros y categorías
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['nationality', 'team', 'report_type', 'roi'])
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({})
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([])

  // Categorías disponibles para el selector
  const AVAILABLE_CATEGORIES = useMemo(() => [
    {
      key: "nationality",
      label: "Nationality",
      getValue: (playerData: any) => playerData.player.nationality_1,
    },
    {
      key: "team",
      label: "Team",
      getValue: (playerData: any) => playerData.player.team_name,
    },
    {
      key: "report_type",
      label: "Report Type",
      getValue: (playerData: any) => playerData.latestReport.report_type,
      format: (value: any) => {
        if (!value) return 'N/A'
        const str = String(value)
        return str.charAt(0).toUpperCase() + str.slice(1)
      }
    },
    {
      key: "roi",
      label: "ROI",
      getValue: (playerData: any) => playerData.latestReport.roi,
      format: (value: any) => value ? `${Number(value).toFixed(1)}%` : 'N/A'
    },
    {
      key: "profit",
      label: "Net Profit",
      getValue: (playerData: any) => playerData.latestReport.profit,
      format: (value: any) => {
        if (!value) return 'N/A'
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
        }).format(Number(value))
      }
    },
    {
      key: "total_reports",
      label: "Reports",
      getValue: (playerData: any) => playerData.totalReports,
      format: (value: any) => `${value} ${Number(value) === 1 ? 'report' : 'reports'}`
    },
    {
      key: "potential",
      label: "Potential",
      getValue: (playerData: any) => playerData.latestReport.potential,
      format: (value: any) => value ? `${Number(value).toFixed(1)}%` : 'N/A'
    },
    {
      key: "age",
      label: "Age",
      getValue: (playerData: any) => playerData.player.age,
      format: (value: any) => value ? `${value} años` : 'N/A'
    },
    {
      key: "position",
      label: "Position",
      getValue: (playerData: any) => playerData.player.position_player,
    },
    {
      key: "rating",
      label: "Rating",
      getValue: (playerData: any) => playerData.player.player_rating,
      format: (value: any) => value ? Number(value).toFixed(1) : 'N/A'
    }
  ], [])

  // Datos de categorías seleccionadas
  const selectedCategoriesData = useMemo(() => 
    selectedCategories
      .map(categoryKey => AVAILABLE_CATEGORIES.find(cat => cat.key === categoryKey))
      .filter(Boolean) as typeof AVAILABLE_CATEGORIES,
    [AVAILABLE_CATEGORIES, selectedCategories]
  )

  // Opciones de filtros dinámicas
  const filterOptions = useMemo(() => {
    const nationalities = new Set<string>()
    const teams = new Set<string>()
    const reportTypes = new Set<string>()

    if (Array.isArray(players) && players.length > 0) {
      players.forEach((playerData) => {
        if (playerData?.player?.nationality_1) {
          nationalities.add(playerData.player.nationality_1)
        }
        if (playerData?.player?.team_name) {
          teams.add(playerData.player.team_name)
        }
        if (playerData?.latestReport?.report_type) {
          reportTypes.add(playerData.latestReport.report_type)
        }
      })
    }

    return {
      nationalities: Array.from(nationalities).sort(),
      teams: Array.from(teams).sort(),
      reportTypes: Array.from(reportTypes).sort(),
    }
  }, [players])

  // Funciones de manejo
  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [categoryId, ...prev]
    )
  }, [])

  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    setActiveFilters(filters)
  }, [])

  const clearFilters = useCallback(() => {
    setActiveFilters({})
    setSelectedNationalities([])
    setSelectedTeams([])
    setSelectedReportTypes([])
  }, [])

  // Filtrar y ordenar jugadores
  const filteredPlayers = useMemo(() => {
    let filtered = [...players]

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(({ player }) =>
        player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.position_player?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (player.nationality_1?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (player.team_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Aplicar filtros de nacionalidad
    if (selectedNationalities.length > 0) {
      filtered = filtered.filter(({ player }) => {
        const nationality = player.nationality_1 || ''
        return selectedNationalities.includes(nationality)
      })
    }

    // Aplicar filtros de equipo
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(({ player }) => {
        const team = player.team_name || ''
        return selectedTeams.includes(team)
      })
    }

    // Aplicar filtros de tipo de reporte
    if (selectedReportTypes.length > 0) {
      filtered = filtered.filter(({ latestReport }) => {
        const reportType = latestReport.report_type || ''
        return selectedReportTypes.includes(reportType)
      })
    }

    // Aplicar filtros de rango
    if (activeFilters.min_roi !== undefined || activeFilters.max_roi !== undefined) {
      filtered = filtered.filter(({ latestReport }) => {
        const roi = latestReport.roi || 0
        const minRoi = activeFilters.min_roi as number || -Infinity
        const maxRoi = activeFilters.max_roi as number || Infinity
        return roi >= minRoi && roi <= maxRoi
      })
    }

    if (activeFilters.min_profit !== undefined || activeFilters.max_profit !== undefined) {
      filtered = filtered.filter(({ latestReport }) => {
        const profit = latestReport.profit || 0
        const minProfit = activeFilters.min_profit as number || -Infinity
        const maxProfit = activeFilters.max_profit as number || Infinity
        return profit >= minProfit && profit <= maxProfit
      })
    }

    if (activeFilters.min_potential !== undefined || activeFilters.max_potential !== undefined) {
      filtered = filtered.filter(({ latestReport }) => {
        const potential = latestReport.potential || 0
        const minPotential = activeFilters.min_potential as number || -Infinity
        const maxPotential = activeFilters.max_potential as number || Infinity
        return potential >= minPotential && potential <= maxPotential
      })
    }

    // Aplicar ordenamiento
    if (sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any

        const categoryConfig = AVAILABLE_CATEGORIES.find(cat => cat.key === sortBy)
        if (categoryConfig) {
          aValue = categoryConfig.getValue(a)
          bValue = categoryConfig.getValue(b)
        } else {
          // Fallback para compatibilidad
          switch (sortBy) {
            case 'nationality':
              aValue = a.player.nationality_1 || ''
              bValue = b.player.nationality_1 || ''
              break
            case 'team':
              aValue = a.player.team_name || ''
              bValue = b.player.team_name || ''
              break
            case 'report_type':
              aValue = a.latestReport.report_type || ''
              bValue = b.latestReport.report_type || ''
              break
            case 'roi':
              aValue = a.latestReport.roi || 0
              bValue = b.latestReport.roi || 0
              break
            case 'profit':
              aValue = a.latestReport.profit || 0
              bValue = b.latestReport.profit || 0
              break
            case 'total_reports':
              aValue = a.totalReports || 0
              bValue = b.totalReports || 0
              break
            default:
              aValue = a.player.player_name
              bValue = b.player.player_name
          }
        }

        // Manejar valores nulos/undefined
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return sortOrder === 'asc' ? 1 : -1
        if (bValue == null) return sortOrder === 'asc' ? -1 : 1

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        } else {
          return sortOrder === 'asc' 
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue)
        }
      })
    }

    return filtered
  }, [
    players, 
    searchTerm, 
    selectedNationalities, 
    selectedTeams, 
    selectedReportTypes, 
    activeFilters, 
    sortBy, 
    sortOrder,
    AVAILABLE_CATEGORIES
  ])

  const handleSort = (categoryKey: string) => {
    if (sortBy === categoryKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(categoryKey)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector de Categorías */}
      <CategorySelector
        title="Display Categories"
        categories={AVAILABLE_CATEGORIES}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        minCategories={1}
        storageKey="scout-dashboard-selected-categories"
      />

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, nacionalidad, equipo, posición..."
              className="pl-10 w-80 bg-[#ffffff] border-[#e7e7e7]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ScoutPlayerFilters
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            filterOptions={filterOptions}
            selectedNationalities={selectedNationalities}
            selectedTeams={selectedTeams}
            selectedReportTypes={selectedReportTypes}
            activeFilters={activeFilters}
            onNationalitiesChange={setSelectedNationalities}
            onTeamsChange={setSelectedTeams}
            onReportTypesChange={setSelectedReportTypes}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
          />
        </div>

        <Link href="/scout/players/new">
          <Button className="bg-[#8B0000] hover:bg-[#660000] text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Player
          </Button>
        </Link>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg p-6 border border-[#e7e7e7]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-[#000000]">Filtros</h3>
              {(Object.keys(activeFilters).length > 0 || selectedNationalities.length > 0 || selectedTeams.length > 0 || selectedReportTypes.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <span className="text-red-600 text-sm">Limpiar Filtros</span>
                  <X className="w-3 h-3 text-red-600" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nacionalidades */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nacionalidad
              </label>
              <MultiSelectFilter
                label="Nacionalidad"
                options={filterOptions.nationalities}
                selectedValues={selectedNationalities}
                onSelectionChange={setSelectedNationalities}
                placeholder="Seleccionar nacionalidades..."
                searchPlaceholder="Buscar nacionalidades..."
                maxDisplayTags={2}
              />
            </div>

            {/* Equipos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipo
              </label>
              <MultiSelectFilter
                label="Equipo"
                options={filterOptions.teams}
                selectedValues={selectedTeams}
                onSelectionChange={setSelectedTeams}
                placeholder="Seleccionar equipos..."
                searchPlaceholder="Buscar equipos..."
                maxDisplayTags={1}
              />
            </div>

            {/* Tipos de Reporte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <MultiSelectFilter
                label="Tipo de Reporte"
                options={filterOptions.reportTypes}
                selectedValues={selectedReportTypes}
                onSelectionChange={setSelectedReportTypes}
                placeholder="Seleccionar tipos..."
                searchPlaceholder="Buscar tipos..."
                maxDisplayTags={1}
              />
            </div>
          </div>

          {/* Filtros de rango */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            {/* Rango de ROI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de ROI (%)
              </label>
              <RangeFilter
                label="ROI"
                minValue={activeFilters.min_roi}
                maxValue={activeFilters.max_roi}
                onRangeChange={(min, max) => {
                  const newFilters = { ...activeFilters }
                  if (min === undefined) {
                    delete newFilters.min_roi
                  } else {
                    newFilters.min_roi = min
                  }
                  if (max === undefined) {
                    delete newFilters.max_roi
                  } else {
                    newFilters.max_roi = max
                  }
                  applyFilters(newFilters)
                }}
                placeholder="Seleccionar rango de ROI..." 
                step="0.1" 
                suffix="%" 
              />
            </div>

            {/* Rango de Profit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Beneficio (€)
              </label>
              <RangeFilter
                label="Beneficio"
                minValue={activeFilters.min_profit}
                maxValue={activeFilters.max_profit}
                onRangeChange={(min, max) => {
                  const newFilters = { ...activeFilters }
                  if (min === undefined) {
                    delete newFilters.min_profit
                  } else {
                    newFilters.min_profit = min
                  }
                  if (max === undefined) {
                    delete newFilters.max_profit
                  } else {
                    newFilters.max_profit = max
                  }
                  applyFilters(newFilters)
                }}
                placeholder="Seleccionar rango de beneficio..." 
                step="1000" 
                suffix="€" 
              />
            </div>

            {/* Rango de Potential */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Potencial (%)
              </label>
              <RangeFilter
                label="Potencial"
                minValue={activeFilters.min_potential}
                maxValue={activeFilters.max_potential}
                onRangeChange={(min, max) => {
                  const newFilters = { ...activeFilters }
                  if (min === undefined) {
                    delete newFilters.min_potential
                  } else {
                    newFilters.min_potential = min
                  }
                  if (max === undefined) {
                    delete newFilters.max_potential
                  } else {
                    newFilters.max_potential = max
                  }
                  applyFilters(newFilters)
                }}
                placeholder="Seleccionar rango de potencial..." 
                step="0.1" 
                suffix="%" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000]"></div>
          <span className="ml-3 text-[#6d6d6d] mt-2">
            {searchTerm
              ? `Buscando "${searchTerm}"...`
              : "Cargando jugadores..."}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            Error al cargar los jugadores: {error}
          </p>
        </div>
      )}

      {/* Players Table */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6d6d6d] text-lg">
                {searchTerm
                  ? `No se encontraron jugadores para "${searchTerm}"`
                  : "No tienes jugadores reportados aún"}
              </p>
              <p className="text-[#6d6d6d] text-sm mt-2">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : "Comienza creando tu primer reporte de jugador"}
              </p>
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-[#8B0000] text-white rounded-lg hover:bg-[#660000] transition-colors"
                >
                  Ver todos los jugadores
                </button>
              ) : (
                <Link href="/scout/players/new">
                  <Button className="mt-4 bg-[#8B0000] hover:bg-[#660000] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primer reporte
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <ScoutPlayersTable
              players={filteredPlayers}
              selectedCategories={selectedCategoriesData}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </div>
      )}
    </div>
  )
}