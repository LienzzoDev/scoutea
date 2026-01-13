import { ChevronDown, ChevronUp, Filter, RotateCcw, X } from 'lucide-react'
import { useEffect, useState, useCallback, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { PLAYER_POSITIONS } from '@/constants/player-positions'

// Tipos para los filtros
export interface PlayerFilters {
  // Filtros de texto/selección
  nationality: string
  position: string
  team: string
  competition: string
  foot: string
  onLoan: string // 'all' | 'yes' | 'no'
  isVisible: string // 'all' | 'yes' | 'no'

  // Filtros de rango numérico
  ageMin: string
  ageMax: string
  valueMin: string
  valueMax: string
  ratingMin: string
  ratingMax: string
  eloMin: string
  eloMax: string
  heightMin: string
  heightMax: string

  // Filtros de datos vacíos/llenos (N/A)
  playerColor: string // 'all' | 'has' | 'empty' - Color
  playerName: string // 'all' | 'has' | 'empty' - Player Name
  teamName: string // 'all' | 'has' | 'empty' - Team Name
  wyscoutName1: string // 'all' | 'has' | 'empty' - Wyscout Name 1
  wyscoutId1: string // 'all' | 'has' | 'empty' - Wyscout ID 1
  wyscoutId2: string // 'all' | 'has' | 'empty' - Wyscout ID 2
  idFmi: string // 'all' | 'has' | 'empty' - FM (ID FMI)
  photoCoverage: string // 'all' | 'has' | 'empty' - Photo Coverage
  urlTrfmAdvisor: string // 'all' | 'has' | 'empty' - URL Advisor
  urlTrfm: string // 'all' | 'has' | 'empty' - URL TRFM
  urlInstagram: string // 'all' | 'has' | 'empty' - URL IG
}

export const DEFAULT_FILTERS: PlayerFilters = {
  nationality: '',
  position: '',
  team: '',
  competition: '',
  foot: '',
  onLoan: 'all',
  isVisible: 'all',
  ageMin: '',
  ageMax: '',
  valueMin: '',
  valueMax: '',
  ratingMin: '',
  ratingMax: '',
  eloMin: '',
  eloMax: '',
  heightMin: '',
  heightMax: '',
  // Filtros de datos vacíos/llenos
  playerColor: 'all',
  playerName: 'all',
  teamName: 'all',
  wyscoutName1: 'all',
  wyscoutId1: 'all',
  wyscoutId2: 'all',
  idFmi: 'all',
  photoCoverage: 'all',
  urlTrfmAdvisor: 'all',
  urlTrfm: 'all',
  urlInstagram: 'all',
}

interface AdminPlayerFiltersProps {
  filters: PlayerFilters
  onFiltersChange: (filters: PlayerFilters) => void
  onReset: () => void
}


// Opciones estáticas de posiciones
const POSITION_OPTIONS = PLAYER_POSITIONS.map(pos => ({
  value: pos,
  label: pos
}))

const FOOT_OPTIONS = [
  { value: 'right', label: 'Diestro' },
  { value: 'left', label: 'Zurdo' },
  { value: 'both', label: 'Ambidiestro' },
]

export default function AdminPlayerFilters({
  filters,
  onFiltersChange,
  onReset,
}: AdminPlayerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filterOptions, setFilterOptions] = useState<{
    nationalities: string[]
    teams: string[]
    competitions: string[]
  }>({
    nationalities: [],
    teams: [],
    competitions: [],
  })
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Cargar opciones de filtro desde la API
  const loadFilterOptions = useCallback(async () => {
    if (filterOptions.nationalities.length > 0) return // Ya cargado

    setLoadingOptions(true)
    try {
      const response = await fetch('/api/admin/players/filter-options')
      if (response.ok) {
        const data = await response.json()
        setFilterOptions({
          nationalities: data.nationalities || [],
          teams: data.teams || [],
          competitions: data.competitions || [],
        })
      }
    } catch (error) {
      console.error('Error loading filter options:', error)
    } finally {
      setLoadingOptions(false)
    }
  }, [filterOptions.nationalities.length])

  // Cargar opciones cuando se expande
  useEffect(() => {
    if (isExpanded) {
      loadFilterOptions()
    }
  }, [isExpanded, loadFilterOptions])

  // Optimización de listas largas para evitar crashes del navegador (Renderizar miles de items en Select es costoso)
  const visibleNationalities = useMemo(() => {
    let list = (filterOptions.nationalities || []).slice(0, 200)
    if (filters.nationality && filters.nationality !== 'all' && !list.includes(filters.nationality)) {
      list = [filters.nationality, ...list]
    }
    return list
  }, [filterOptions.nationalities, filters.nationality])

  const visibleTeams = useMemo(() => {
    let list = (filterOptions.teams || []).slice(0, 200)
    if (filters.team && filters.team !== 'all' && !list.includes(filters.team)) {
      list = [filters.team, ...list]
    }
    return list
  }, [filterOptions.teams, filters.team])

  const visibleCompetitions = useMemo(() => {
    let list = (filterOptions.competitions || []).slice(0, 200)
    if (filters.competition && filters.competition !== 'all' && !list.includes(filters.competition)) {
      list = [filters.competition, ...list]
    }
    return list
  }, [filterOptions.competitions, filters.competition])

  const handleFilterChange = (key: keyof PlayerFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  // Lista de filtros que usan 'all' como valor por defecto
  const allDefaultFilters = [
    'onLoan', 'isVisible', 'playerColor', 'playerName', 'teamName',
    'wyscoutName1', 'wyscoutId1', 'wyscoutId2', 'idFmi',
    'photoCoverage', 'urlTrfmAdvisor', 'urlTrfm', 'urlInstagram'
  ]

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (allDefaultFilters.includes(key)) {
      return value !== 'all'
    }
    return value !== ''
  })

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (allDefaultFilters.includes(key)) {
      return value !== 'all'
    }
    return value !== ''
  }).length

  return (
    <div className="mb-6 bg-[#131921] border border-slate-700 rounded-lg overflow-hidden">
      {/* Header del panel de filtros */}
      <button
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-slate-200 font-medium">Filtros avanzados</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#FF5733] text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onReset()
              }}
              className="text-slate-400 hover:text-white"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Panel expandible de filtros */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700">
          {loadingOptions && (
            <div className="py-2 text-sm text-slate-400">
              Cargando opciones de filtro...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {/* Nacionalidad */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                Nacionalidad
              </span>
              <Select
                value={filters.nationality || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('nationality', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" aria-label="Filtrar por nacionalidad">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Todas
                  </SelectItem>
                  {visibleNationalities.map((nat) => (
                    <SelectItem
                      key={nat}
                      value={nat}
                      className="text-white hover:bg-slate-700"
                    >
                      {nat}
                    </SelectItem>
                  ))}
                  {filterOptions.nationalities.length > visibleNationalities.length && (
                    <div className="px-2 py-2 text-xs text-slate-500 text-center border-t border-slate-700">
                      Mostrando primeros 200. Usa búsqueda para más.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Posición */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                Posición
              </span>
              <Select
                value={filters.position || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('position', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" aria-label="Filtrar por posición">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Todas
                  </SelectItem>
                  {POSITION_OPTIONS.map((pos) => (
                    <SelectItem
                      key={pos.value}
                      value={pos.value}
                      className="text-white hover:bg-slate-700"
                    >
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipo */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                Equipo
              </span>
              <Select
                value={filters.team || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('team', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Todos
                  </SelectItem>
                  {visibleTeams.map((team) => (
                    <SelectItem
                      key={team}
                      value={team}
                      className="text-white hover:bg-slate-700"
                    >
                      {team}
                    </SelectItem>
                  ))}
                  {filterOptions.teams.length > visibleTeams.length && (
                    <div className="px-2 py-2 text-xs text-slate-500 text-center border-t border-slate-700">
                      Mostrando primeros 200. Usa búsqueda para más.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Competición */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                Competición
              </span>
              <Select
                value={filters.competition || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('competition', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Todas
                  </SelectItem>
                  {visibleCompetitions.map((comp) => (
                    <SelectItem
                      key={comp}
                      value={comp}
                      className="text-white hover:bg-slate-700"
                    >
                      {comp}
                    </SelectItem>
                  ))}
                  {filterOptions.competitions.length > visibleCompetitions.length && (
                    <div className="px-2 py-2 text-xs text-slate-500 text-center border-t border-slate-700">
                      Mostrando primeros 200. Usa búsqueda para más.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Pie */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                Pie dominante
              </span>
              <Select
                value={filters.foot || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('foot', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Todos
                  </SelectItem>
                  {FOOT_OPTIONS.map((foot) => (
                    <SelectItem
                      key={foot.value}
                      value={foot.value}
                      className="text-white hover:bg-slate-700"
                    >
                      {foot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* On Loan */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                En préstamo
              </span>
              <Select
                value={filters.onLoan}
                onValueChange={(value) => handleFilterChange('onLoan', value)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Todos
                  </SelectItem>
                  <SelectItem value="yes" className="text-white hover:bg-slate-700">
                    Sí
                  </SelectItem>
                  <SelectItem value="no" className="text-white hover:bg-slate-700">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visible */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                Visible para members
              </span>
              <Select
                value={filters.isVisible}
                onValueChange={(value) => handleFilterChange('isVisible', value)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Todos
                  </SelectItem>
                  <SelectItem value="yes" className="text-white hover:bg-slate-700">
                    Sí
                  </SelectItem>
                  <SelectItem value="no" className="text-white hover:bg-slate-700">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros de rango */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm text-slate-300 font-medium mb-3">
              Filtros de rango
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Edad */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">
                  Edad
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.ageMin}
                    onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-full"
                    min={15}
                    max={50}
                  />
                  <span className="text-slate-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.ageMax}
                    onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-full"
                    min={15}
                    max={50}
                  />
                </div>
              </div>

              {/* Valor de mercado */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">
                  Valor de mercado (€)
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueMin}
                    onChange={(e) => handleFilterChange('valueMin', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-full"
                    min={0}
                  />
                  <span className="text-slate-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueMax}
                    onChange={(e) => handleFilterChange('valueMax', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-full"
                    min={0}
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">
                  Player Rating
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.ratingMin}
                    onChange={(e) => handleFilterChange('ratingMin', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-full"
                    min={0}
                    max={100}
                  />
                  <span className="text-slate-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.ratingMax}
                    onChange={(e) => handleFilterChange('ratingMax', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-full"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              {/* Altura */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">
                  Altura (cm)
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.heightMin}
                    onChange={(e) => handleFilterChange('heightMin', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-full"
                    min={150}
                    max={220}
                  />
                  <span className="text-slate-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.heightMax}
                    onChange={(e) => handleFilterChange('heightMax', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-full"
                    min={150}
                    max={220}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros de datos vacíos/llenos (N/A) */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm text-slate-300 font-medium mb-3">
              Filtros por datos vacíos / con valor
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {/* Color */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">Color</span>
                <Select
                  value={filters.playerColor}
                  onValueChange={(value) => handleFilterChange('playerColor', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Player Name */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">Player Name</span>
                <Select
                  value={filters.playerName}
                  onValueChange={(value) => handleFilterChange('playerName', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Team Name */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">Team Name</span>
                <Select
                  value={filters.teamName}
                  onValueChange={(value) => handleFilterChange('teamName', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Wyscout Name 1 */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">Wyscout</span>
                <Select
                  value={filters.wyscoutName1}
                  onValueChange={(value) => handleFilterChange('wyscoutName1', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Wyscout ID 1 */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">Wyscout ID 1</span>
                <Select
                  value={filters.wyscoutId1}
                  onValueChange={(value) => handleFilterChange('wyscoutId1', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Wyscout ID 2 */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">Wyscout ID 2</span>
                <Select
                  value={filters.wyscoutId2}
                  onValueChange={(value) => handleFilterChange('wyscoutId2', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ID FMI (FM) */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">FM (ID FMI)</span>
                <Select
                  value={filters.idFmi}
                  onValueChange={(value) => handleFilterChange('idFmi', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Photo Coverage */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">Photo Cover</span>
                <Select
                  value={filters.photoCoverage}
                  onValueChange={(value) => handleFilterChange('photoCoverage', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* URL Advisor */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">URL Advisor</span>
                <Select
                  value={filters.urlTrfmAdvisor}
                  onValueChange={(value) => handleFilterChange('urlTrfmAdvisor', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* URL TRFM */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">URL TRFM</span>
                <Select
                  value={filters.urlTrfm}
                  onValueChange={(value) => handleFilterChange('urlTrfm', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* URL Instagram */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">URL IG</span>
                <Select
                  value={filters.urlInstagram}
                  onValueChange={(value) => handleFilterChange('urlInstagram', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">Todos</SelectItem>
                    <SelectItem value="has" className="text-white hover:bg-slate-700">Con valor</SelectItem>
                    <SelectItem value="empty" className="text-white hover:bg-slate-700">Vacío (N/A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Chips de filtros activos */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex flex-wrap gap-2">
                {filters.nationality && (
                  <FilterChip
                    label={`Nacionalidad: ${filters.nationality}`}
                    onRemove={() => handleFilterChange('nationality', '')}
                  />
                )}
                {filters.position && (
                  <FilterChip
                    label={`Posición: ${filters.position}`}
                    onRemove={() => handleFilterChange('position', '')}
                  />
                )}
                {filters.team && (
                  <FilterChip
                    label={`Equipo: ${filters.team}`}
                    onRemove={() => handleFilterChange('team', '')}
                  />
                )}
                {filters.competition && (
                  <FilterChip
                    label={`Competición: ${filters.competition}`}
                    onRemove={() => handleFilterChange('competition', '')}
                  />
                )}
                {filters.foot && (
                  <FilterChip
                    label={`Pie: ${FOOT_OPTIONS.find(f => f.value === filters.foot)?.label || filters.foot}`}
                    onRemove={() => handleFilterChange('foot', '')}
                  />
                )}
                {filters.onLoan !== 'all' && (
                  <FilterChip
                    label={`En préstamo: ${filters.onLoan === 'yes' ? 'Sí' : 'No'}`}
                    onRemove={() => handleFilterChange('onLoan', 'all')}
                  />
                )}
                {filters.isVisible !== 'all' && (
                  <FilterChip
                    label={`Visible: ${filters.isVisible === 'yes' ? 'Sí' : 'No'}`}
                    onRemove={() => handleFilterChange('isVisible', 'all')}
                  />
                )}
                {(filters.ageMin || filters.ageMax) && (
                  <FilterChip
                    label={`Edad: ${filters.ageMin || '0'} - ${filters.ageMax || '∞'}`}
                    onRemove={() => {
                      handleFilterChange('ageMin', '')
                      handleFilterChange('ageMax', '')
                    }}
                  />
                )}
                {(filters.valueMin || filters.valueMax) && (
                  <FilterChip
                    label={`Valor: ${filters.valueMin ? `€${Number(filters.valueMin).toLocaleString()}` : '€0'} - ${filters.valueMax ? `€${Number(filters.valueMax).toLocaleString()}` : '∞'}`}
                    onRemove={() => {
                      handleFilterChange('valueMin', '')
                      handleFilterChange('valueMax', '')
                    }}
                  />
                )}
                {(filters.ratingMin || filters.ratingMax) && (
                  <FilterChip
                    label={`Rating: ${filters.ratingMin || '0'} - ${filters.ratingMax || '100'}`}
                    onRemove={() => {
                      handleFilterChange('ratingMin', '')
                      handleFilterChange('ratingMax', '')
                    }}
                  />
                )}
                {(filters.heightMin || filters.heightMax) && (
                  <FilterChip
                    label={`Altura: ${filters.heightMin || '150'}cm - ${filters.heightMax || '220'}cm`}
                    onRemove={() => {
                      handleFilterChange('heightMin', '')
                      handleFilterChange('heightMax', '')
                    }}
                  />
                )}
                {filters.playerColor !== 'all' && (
                  <FilterChip
                    label={`Color: ${filters.playerColor === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('playerColor', 'all')}
                  />
                )}
                {filters.playerName !== 'all' && (
                  <FilterChip
                    label={`Player Name: ${filters.playerName === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('playerName', 'all')}
                  />
                )}
                {filters.teamName !== 'all' && (
                  <FilterChip
                    label={`Team Name: ${filters.teamName === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('teamName', 'all')}
                  />
                )}
                {filters.wyscoutName1 !== 'all' && (
                  <FilterChip
                    label={`Wyscout: ${filters.wyscoutName1 === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('wyscoutName1', 'all')}
                  />
                )}
                {filters.wyscoutId1 !== 'all' && (
                  <FilterChip
                    label={`Wyscout ID 1: ${filters.wyscoutId1 === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('wyscoutId1', 'all')}
                  />
                )}
                {filters.wyscoutId2 !== 'all' && (
                  <FilterChip
                    label={`Wyscout ID 2: ${filters.wyscoutId2 === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('wyscoutId2', 'all')}
                  />
                )}
                {filters.idFmi !== 'all' && (
                  <FilterChip
                    label={`FM: ${filters.idFmi === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('idFmi', 'all')}
                  />
                )}
                {filters.photoCoverage !== 'all' && (
                  <FilterChip
                    label={`Photo Cover: ${filters.photoCoverage === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('photoCoverage', 'all')}
                  />
                )}
                {filters.urlTrfmAdvisor !== 'all' && (
                  <FilterChip
                    label={`URL Advisor: ${filters.urlTrfmAdvisor === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('urlTrfmAdvisor', 'all')}
                  />
                )}
                {filters.urlTrfm !== 'all' && (
                  <FilterChip
                    label={`URL TRFM: ${filters.urlTrfm === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('urlTrfm', 'all')}
                  />
                )}
                {filters.urlInstagram !== 'all' && (
                  <FilterChip
                    label={`URL IG: ${filters.urlInstagram === 'has' ? 'Con valor' : 'Vacío'}`}
                    onRemove={() => handleFilterChange('urlInstagram', 'all')}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Componente para chips de filtros activos
function FilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-white transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
