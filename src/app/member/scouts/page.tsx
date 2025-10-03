'use client'

import { Search, Filter, ArrowRight, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'

import CategorySelector from "@/components/filters/category-selector"
import MultiSelectFilter from "@/components/filters/multi-select-filter"
import RangeFilter from "@/components/filters/range-filter"
import ToggleFilter from "@/components/filters/toggle-filter"
import MemberNavbar from "@/components/layout/member-navbar"
import BookmarkButton from "@/components/ui/bookmark-button"
import { Button } from "@/components/ui/button"
import EntityTabs from "@/components/ui/entity-tabs"
import { Input } from "@/components/ui/input"
import ScoutAvatar from "@/components/ui/scout-avatar"
import { useScoutList } from "@/hooks/scout/useScoutList"
import { useScouts, Scout } from "@/hooks/scout/useScouts"


// 📊 DEFINIR CATEGORÍAS DISPONIBLES PARA MOSTRAR
interface DisplayCategory {
  key: string
  label: string
  getValue: (scout: Scout) => string | number | null
  format?: (value: unknown) => string
}

const AVAILABLE_CATEGORIES: DisplayCategory[] = [
  {
    key: 'scout_level',
    label: 'Scout Level',
    getValue: (scout) => scout?.scout_level || null,
    format: (value) => String(value || 'N/A')
  },
  {
    key: 'scout_elo',
    label: 'Scout ELO',
    getValue: (scout) => scout?.scout_elo || null,
    format: (value) => value ? String(Number(value).toFixed(0)) : 'N/A'
  },
  {
    key: 'total_reports',
    label: 'Total Reports',
    getValue: (scout) => scout?.total_reports || null,
    format: (value) => value ? String(value) : '0'
  },
  {
    key: 'roi',
    label: 'ROI',
    getValue: (scout) => scout?.roi || null,
    format: (value) => value ? `${Number(value).toFixed(1)}%` : 'N/A'
  },
  {
    key: 'max_profit',
    label: 'Max Profit',
    getValue: (scout) => scout?.max_profit_report || null,
    format: (value) => {
      if (!value || typeof value !== 'number') return 'N/A'
      if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`
      return `€${value}`
    }
  },
  {
    key: 'nationality',
    label: 'Nationality',
    getValue: (scout) => scout?.nationality || null,
    format: (value) => String(value || 'N/A')
  },
  {
    key: 'country',
    label: 'Country',
    getValue: (scout) => scout?.country || null,
    format: (value) => String(value || 'N/A')
  },
  {
    key: 'expertise',
    label: 'Expertise',
    getValue: (scout) => scout?.nationality_expertise || null,
    format: (value) => String(value || 'N/A')
  },
  {
    key: 'competition',
    label: 'Competition',
    getValue: (scout) => scout?.competition_expertise || null,
    format: (value) => String(value || 'N/A')
  },
  {
    key: 'age',
    label: 'Age',
    getValue: (scout) => scout?.age || null,
    format: (value) => value ? `${value} años` : 'N/A'
  },
  {
    key: 'ranking',
    label: 'Ranking',
    getValue: (scout) => scout?.scout_ranking || null,
    format: (value) => value ? `#${value}` : 'N/A'
  },
  {
    key: 'availability',
    label: 'Availability',
    getValue: (scout) => scout?.open_to_work,
    format: (value) => {
      if (value === true) return 'Available'
      if (value === false) return 'Not Available'
      return 'N/A'
    }
  }
]

export default function ScoutsPage() {
  const _router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 🎛️ ESTADO PARA GESTIÓN DE CATEGORÍAS MOSTRADAS
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // 🔍 ESTADO PARA FILTROS AVANZADOS
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({})
  const [showFilterDropdowns, setShowFilterDropdowns] = useState<Record<string, boolean>>({})
  
  // 📊 ESTADO PARA ORDENAMIENTO
  const [sortBy, setSortBy] = useState<string>('scout_elo')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 🏷️ ESTADO PARA FILTROS MULTI-SELECT
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([])
  
  // 📊 OPCIONES DE FILTROS (se cargarán dinámicamente)
  const [filterOptions, setFilterOptions] = useState<{
    nationalities: string[]
    levels: string[]
    countries: string[]
    expertise: string[]
  }>({
    nationalities: [],
    levels: [],
    countries: [],
    expertise: []
  })

  // 🔄 REFS PARA SINCRONIZACIÓN DE SCROLL
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const rowScrollRefs = useRef<HTMLDivElement[]>([])

  // 🔄 FUNCIÓN PARA SINCRONIZAR SCROLL
  const handleScroll = useCallback((scrollLeft: number) => {
    // Sincronizar header
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft
    }
    // Sincronizar todas las filas
    rowScrollRefs.current.forEach(ref => {
      if (ref) {
        ref.scrollLeft = scrollLeft
      }
    })
  }, [])
  
  // Usar el hook de scouts real
  const { scouts = [], loading, error, searchScouts } = useScouts()
  
  // Hook para manejar la lista de scouts del usuario
  const { 
    scoutList, 
    addToList, 
    removeFromList, 
    isInList,
    error: scoutListError 
  } = useScoutList()
  


  // 💾 CARGAR CATEGORÍAS GUARDADAS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const savedCategories = localStorage.getItem('scouts-selected-categories')
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedCategories(parsed)

        } else {
          // Si no hay categorías válidas guardadas, usar las por defecto
          const defaultCategories = ['scout_level', 'scout_elo', 'total_reports']
          setSelectedCategories(defaultCategories)
          localStorage.setItem('scouts-selected-categories', JSON.stringify(defaultCategories))

        }
      } catch (_error) {
        console.error('❌ Error parsing saved scout categories:', error)
        const defaultCategories = ['scout_level', 'scout_elo', 'total_reports']
        setSelectedCategories(defaultCategories)
        localStorage.setItem('scouts-selected-categories', JSON.stringify(defaultCategories))
      }
    } else {
      // Primera vez, usar categorías por defecto y guardarlas
      const defaultCategories = ['scout_level', 'scout_elo', 'total_reports']
      setSelectedCategories(defaultCategories)
      localStorage.setItem('scouts-selected-categories', JSON.stringify(defaultCategories))

    }
  }, [])

  // 🎛️ FUNCIÓN PARA MANEJAR SELECCIÓN DE CATEGORÍAS
  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(categoryKey)
      let newCategories: string[]
      
      if (isSelected) {
        // Remover categoría (mínimo 1 categoría)
        newCategories = prev.length > 1 ? prev.filter(key => key !== categoryKey) : prev
      } else {
        // Añadir categoría al principio (izquierda)
        newCategories = [categoryKey, ...prev]
      }
      
      // 💾 GUARDAR EN LOCALSTORAGE
      try {
        localStorage.setItem('scouts-selected-categories', JSON.stringify(newCategories))
        console.log('✅ Scout categories saved to localStorage:', newCategories)
      } catch (_error) {
        console.error('❌ Error saving scout categories to localStorage:', error)
      }
      
      return newCategories
    })
  }

  // 🎯 OBTENER CATEGORÍAS SELECCIONADAS PARA MOSTRAR
  const getSelectedCategoriesData = () => {
    // Asegurar que siempre haya categorías seleccionadas
    const categoriesToUse = selectedCategories.length > 0 
      ? selectedCategories 
      : ['scout_level', 'scout_elo', 'total_reports']
    
    return categoriesToUse
      .map(key => AVAILABLE_CATEGORIES.find(cat => cat.key === key))
      .filter(Boolean) as DisplayCategory[]
  }



  // Cargar scouts al montar el componente
  useEffect(() => {
    searchScouts().catch(err => {
      console.error('Error loading scouts:', err)
      // Si hay error, usar datos mock temporalmente
    })
    loadFilterOptions()
  }, []) // Remove searchScouts from dependencies

  // 📊 CARGAR OPCIONES DE FILTROS DINÁMICAMENTE
  const loadFilterOptions = useCallback(async () => {
    try {
      // Intentar cargar desde API (si existe en el futuro)
      // const response = await fetch('/api/scouts/filter-options')
      // if (response.ok) {
      //   const options = await response.json()
      //   setFilterOptions(options)
      // } else {
        // Por ahora usamos opciones estáticas mejoradas
        const options = {
          nationalities: ['Spain', 'France', 'Germany', 'Italy', 'England', 'Brazil', 'Argentina', 'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Poland', 'Denmark', 'Sweden', 'Norway'],
          levels: ['Elite', 'World Class', 'Excellent', 'Very Good', 'Good', 'Average', 'Below Average'],
          countries: ['Spain', 'France', 'Germany', 'Italy', 'England', 'Brazil', 'Argentina', 'Portugal', 'Netherlands', 'Belgium', 'United States', 'Mexico'],
          expertise: ['La Liga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1', 'Champions League', 'Europa League', 'MLS', 'Liga MX', 'Eredivisie']
        }
        setFilterOptions(options)
        console.log('✅ Scout filter options loaded:', options)
      // }
    } catch (_error) {
      console.error('❌ Error loading scout filter options:', error)
      // Fallback básico
      const fallbackOptions = {
        nationalities: ['Spain', 'France', 'Germany', 'Italy', 'England'],
        levels: ['Elite', 'Excellent', 'Very Good', 'Good', 'Average'],
        countries: ['Spain', 'France', 'Germany', 'Italy', 'England'],
        expertise: ['La Liga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1']
      }
      setFilterOptions(fallbackOptions)
    }
  }, [])

  // 🔍 APLICAR FILTROS (INTELIGENTE: LOCAL + API)
  const applyFilters = useCallback((newFilters: unknown) => {
    setActiveFilters(newFilters)
    console.log('🔍 Applying scout __filters: ', newFilters)
    
    // Si hay filtros activos y pocos scouts cargados, hacer llamada a API
    const hasActiveFilters = Object.keys(newFilters).length > 0 || 
                            selectedNationalities.length > 0 || 
                            selectedLevels.length > 0 || 
                            selectedCountries.length > 0 || 
                            selectedExpertise.length > 0
    
    if (hasActiveFilters && (!scouts || scouts.length < 50)) {
      // Hacer llamada a API para obtener más datos
      const searchOptions = {
        page: 1,
        limit: 100, // Cargar más datos para filtrado local
        sortBy: 'scout_elo' as const,
        sortOrder: 'desc' as const,
        _filters: {
          ...newFilters,
          ...(searchTerm ? { search: searchTerm } : {})
        }
      }
      
      console.log('🔍 Making API call with scout filters: ', searchOptions)
      searchScouts() // Use mock data for now
    }
    
    // Los filtros se aplicarán en el useEffect que maneja getFilteredScouts
  }, [searchTerm, selectedNationalities, selectedLevels, selectedCountries, selectedExpertise, scouts]) // Remove searchScouts from dependencies

  // 🧹 LIMPIAR FILTROS (LOCAL)
  const clearFilters = useCallback(() => {
    setActiveFilters({})
    setShowFilterDropdowns({})
    setSelectedNationalities([])
    setSelectedLevels([])
    setSelectedCountries([])
    setSelectedExpertise([])
    console.log('🧹 Clearing all scout filters locally')
  }, [])

  // 🎛️ TOGGLE DROPDOWN DE FILTRO
  const toggleFilterDropdown = useCallback((filterKey: string) => {
    setShowFilterDropdowns(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }))
  }, [])

  // 🔒 CERRAR DROPDOWNS AL HACER CLIC FUERA
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.filter-dropdown')) {
        setShowFilterDropdowns({})
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 📊 FUNCIÓN PARA MANEJAR ORDENAMIENTO
  const handleSort = useCallback((categoryKey: string) => {
    if (sortBy === categoryKey) {
      // Si ya está ordenado por esta columna, cambiar dirección
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      // Si es una nueva columna, ordenar descendente por defecto (mejor para métricas)
      setSortBy(categoryKey)
      setSortOrder('desc')
    }
  }, [sortBy])

  // Filtrar scouts según la pestaña activa y filtros aplicados
  const getFilteredScouts = () => {
    if (!scouts || scouts.length === 0) return []

    let filtered: Scout[] = []

    // Primero filtrar por pestaña
    switch (activeTab) {
      case 'news':
        // Scouts añadidos en los últimos 7 días
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        filtered = scouts.filter(scout => {
          if (!scout.createdAt) return false
          const scoutDate = new Date(scout.createdAt)
          return scoutDate >= sevenDaysAgo
        })
        break
      
      case 'your-list':
        // Solo scouts que están en la lista del usuario
        filtered = scouts.filter(scout => scoutList.includes(scout.id_scout))
        break
      
      default:
        filtered = scouts
    }

    // Aplicar filtro de búsqueda por texto (multi-campo mejorado)
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(scout => {
        return (
          // Nombre del scout
          scout.scout_name?.toLowerCase().includes(searchLower) ||
          scout.name?.toLowerCase().includes(searchLower) ||
          // ID del scout
          scout.id_scout?.toLowerCase().includes(searchLower) ||
          // Nacionalidad
          scout.nationality?.toLowerCase().includes(searchLower) ||
          // País donde trabaja
          scout.country?.toLowerCase().includes(searchLower) ||
          // Nivel del scout
          scout.scout_level?.toLowerCase().includes(searchLower) ||
          // Área de expertise
          scout.expertise?.toLowerCase().includes(searchLower) ||
          // Agencia
          scout.agency?.toLowerCase().includes(searchLower) ||
          // Búsqueda por números (ELO, reportes, etc.)
          scout.scout_elo?.toString().includes(searchTerm.trim()) ||
          scout.total_reports?.toString().includes(searchTerm.trim()) ||
          scout.roi?.toString().includes(searchTerm.trim())
        )
      })
    }

    // Luego aplicar filtros activos
    if (Object.keys(activeFilters).length > 0 || selectedNationalities.length > 0 || selectedLevels.length > 0 || selectedCountries.length > 0 || selectedExpertise.length > 0) {
      filtered = filtered.filter(scout => {
        // Filtro por nacionalidades (multi-select)
        if (selectedNationalities.length > 0 && !selectedNationalities.includes(scout.nationality || '')) {
          return false
        }
        
        // Filtro por niveles (multi-select)
        if (selectedLevels.length > 0 && !selectedLevels.includes(scout.scout_level || '')) {
          return false
        }
        
        // Filtro por países (multi-select)
        if (selectedCountries.length > 0 && !selectedCountries.includes(scout.country || '')) {
          return false
        }
        
        // Filtro por expertise (multi-select)
        if (selectedExpertise.length > 0 && !selectedExpertise.includes(scout.nationality_expertise || '')) {
          return false
        }
        
        // Filtro por ELO
        if (activeFilters.min_elo && (!scout.scout_elo || scout.scout_elo < activeFilters.min_elo)) {
          return false
        }
        if (activeFilters.max_elo && (!scout.scout_elo || scout.scout_elo > activeFilters.max_elo)) {
          return false
        }
        
        // Filtro por edad
        if (activeFilters.min_age && (!scout.age || scout.age < activeFilters.min_age)) {
          return false
        }
        if (activeFilters.max_age && (!scout.age || scout.age > activeFilters.max_age)) {
          return false
        }
        
        // Filtro por disponibilidad
        if (activeFilters.open_to_work !== undefined && scout.open_to_work !== activeFilters.open_to_work) {
          return false
        }
        
        return true
      })
    }

    // Aplicar ordenamiento
    const sortedFiltered = [...filtered].sort((a: Scout, b: Scout) => {
      const categoryConfig = AVAILABLE_CATEGORIES.find(cat => cat.key === sortBy)
      if (!categoryConfig) return 0

      const aValue = categoryConfig.getValue(a)
      const bValue = categoryConfig.getValue(b)

      // Manejar valores nulos/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortOrder === 'asc' ? 1 : -1
      if (bValue == null) return sortOrder === 'asc' ? -1 : 1

      // Determinar tipo de ordenamiento
      const isNumeric = typeof aValue === 'number' && typeof bValue === 'number'
      
      let comparison = 0
      if (isNumeric) {
        comparison = (aValue as number) - (bValue as number)
      } else {
        // Ordenamiento alfabético
        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        comparison = aStr.localeCompare(bStr)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    console.log('🔍 Filtered and sorted scouts:', sortedFiltered.length, 'from', scouts.length, 'with filters and sort:', {
      activeFilters,
      selectedNationalities,
      selectedLevels,
      selectedCountries,
      selectedExpertise,
      sortBy,
      sortOrder
    })
    
    return sortedFiltered
  }

  const filteredScouts = getFilteredScouts()

  // Manejar búsqueda
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    
    // Si tenemos pocos scouts cargados y hay un término de búsqueda, hacer llamada a API
    if (term.trim() && (!scouts || scouts.length < 50)) {
      searchScouts(term.trim()).catch(err => {
        console.error('Search error: ', err)
      })
      console.log('🔍 Making API search call for scouts term:', term)
    } else if (!term.trim()) {
      // Si se limpia la búsqueda y tenemos pocos datos, recargar
      if (!scouts || scouts.length < 50) {
        searchScouts().catch(err => {
          console.error('Search error: ', err)
        })
      }
      console.log('🔍 Search cleared for scouts')
    } else {
      console.log('🔍 Using local search for scouts term:', term)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Wonderkids</span>
          <span>›</span>
          <span className="text-[#000000]">Scouts</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">Scouts</h1>

        {/* 🎛️ SELECTOR DE CATEGORÍAS PARA MOSTRAR */}
        <CategorySelector
          title="Display Categories"
          categories={AVAILABLE_CATEGORIES}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          minCategories={1}
          storageKey="scouts-selected-categories"
        />

        {/* Tabs and Search */}
        <div className="flex items-center justify-between mb-8">
          <EntityTabs
            tabs={[
              { key: 'all', label: 'All' },
              { key: 'news', label: 'New scouts' },
              { key: 'your-list', label: 'Your list', count: scoutList.length }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
              <Input 
                placeholder="Buscar por nombre, nacionalidad, país, nivel..." 
                className="pl-10 w-80 bg-[#ffffff] border-[#e7e7e7]"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className={`flex items-center gap-2 border-[#e7e7e7] transition-all duration-200 ${
                showFilters 
                  ? 'bg-[#8c1a10]/10 text-[#8c1a10] border-[#8c1a10]/30' 
                  : 'text-[#6d6d6d] bg-transparent'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 text-[#8c1a10]" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-[#000000]">Filtros</h3>
                {(Object.keys(activeFilters).length > 0 || selectedNationalities.length > 0 || selectedLevels.length > 0 || selectedCountries.length > 0 || selectedExpertise.length > 0) && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Niveles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Scout
                </label>
                <MultiSelectFilter
                  label="Nivel"
                  options={filterOptions.levels}
                  selectedValues={selectedLevels}
                  onSelectionChange={setSelectedLevels}
                  placeholder="Seleccionar niveles..."
                  searchPlaceholder="Buscar niveles..."
                  maxDisplayTags={2}
                />
              </div>

              {/* Países */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <MultiSelectFilter
                  label="País"
                  options={filterOptions.countries}
                  selectedValues={selectedCountries}
                  onSelectionChange={setSelectedCountries}
                  placeholder="Seleccionar países..."
                  searchPlaceholder="Buscar países..."
                  maxDisplayTags={1}
                />
              </div>

              {/* Expertise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialización
                </label>
                <MultiSelectFilter
                  label="Especialización"
                  options={filterOptions.expertise}
                  selectedValues={selectedExpertise}
                  onSelectionChange={setSelectedExpertise}
                  placeholder="Seleccionar especialización..."
                  searchPlaceholder="Buscar especialización..."
                  maxDisplayTags={1}
                />
              </div>
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              {/* Disponibilidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disponibilidad
                </label>
                <ToggleFilter
                  label="Disponibilidad"
                  options={[
                    { value: true, label: 'Disponible' },
                    { value: false, label: 'No Disponible' }
                  ]}
                  selectedValue={activeFilters.open_to_work}
                  onSelectionChange={(value) =>{
                    const newFilters = { ...activeFilters }
                    if (value === undefined) {
                      delete newFilters.open_to_work
                    } else {
                      newFilters.open_to_work = value
                    }
                    applyFilters(newFilters)
                  }}
                  placeholder="Seleccionar disponibilidad..."/>
              </div>

              {/* Rango de ELO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rango de ELO
                </label>
                <RangeFilter
                  label="ELO"
                  minValue={activeFilters.min_elo}
                  maxValue={activeFilters.max_elo}
                  onRangeChange={(min, max) =>{
                    const newFilters = { ...activeFilters }
                    if (min === undefined) {
                      delete newFilters.min_elo
                    } else {
                      newFilters.min_elo = min
                    }
                    if (max === undefined) {
                      delete newFilters.max_elo
                    } else {
                      newFilters.max_elo = max
                    }
                    applyFilters(newFilters)
                  }}
                  placeholder="Seleccionar rango de ELO..." step="1" />
              </div>

              {/* Rango de Edad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rango de Edad
                </label>
                <RangeFilter
                  label="Edad"
                  minValue={activeFilters.min_age}
                  maxValue={activeFilters.max_age}
                  onRangeChange={(min, max) =>{
                    const newFilters = { ...activeFilters }
                    if (min === undefined) {
                      delete newFilters.min_age
                    } else {
                      newFilters.min_age = min
                    }
                    if (max === undefined) {
                      delete newFilters.max_age
                    } else {
                      newFilters.max_age = max
                    }
                    applyFilters(newFilters)
                  }}
                  placeholder="Seleccionar rango de edad..." step="1" suffix=" años" />
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
            <span className="ml-3 text-[#6d6d6d]">Loading scouts...</span>
          </div>
        )}

        {/* Error State */}
        {(error || scoutListError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-600">
              {error && `Error loading scouts: ${typeof error === 'string' ? error : error?.message || 'Unknown error'}`}
              {error && scoutListError && ' | '}
              {scoutListError && `Error with scout list: ${scoutListError}`}
            </p>
          </div>
        )}

        {/* Scouts List */}
        {!loading && !error && (
          <div className="space-y-4">
            {/* Results count */}
            <div className="text-[#6d6d6d] text-sm mb-4">Showing {filteredScouts.length} scout{filteredScouts.length !== 1 ? 's' : ''}
              {activeTab === 'news' && ' (New scouts - last 7 days)'}
              {activeTab === 'your-list' && ` (Your saved scouts - ${scoutList.length} total)`}
              {searchTerm && ` for "${searchTerm}"`}
            </div>
            
            {filteredScouts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#6d6d6d] text-lg">{searchTerm 
                    ? `No scouts found for "${searchTerm}"` 
                    : activeTab === 'news'
                    ? 'No new scouts in the last 7 days'
                    : activeTab === 'your-list'
                    ? 'No scouts in your list yet. Start adding scouts by clicking the bookmark icon!'
                    : 'No scouts available'
                  }
                </p>
                {searchTerm && (
                  <button 
                    onClick={() =>handleSearch('')}
                    className="mt-4 px-4 py-2 bg-[#8c1a10] text-white rounded-lg hover:bg-[#6d1410] transition-colors">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#e7e7e7] overflow-hidden">
                {/* HEADER */}
                <div className="bg-[#f8f9fa] border-b border-[#e7e7e7] flex">
                  {/* Columna fija - Scout Info */}
                  <div className="w-80 p-4 border-r border-[#e7e7e7] flex-shrink-0">
                    <h4 className="font-semibold text-[#6d6d6d] text-sm">Scout Info</h4>
                  </div>
                  
                  {/* Headers scrolleables */}
                  <div 
                    ref={headerScrollRef}
                    className="flex-1 overflow-x-auto scrollbar-hide"
                    onScroll={(e) => handleScroll(e.currentTarget.scrollLeft)}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <div className="flex" style={{ minWidth: `${Math.max(getSelectedCategoriesData().length * 140, 100)}px` }}>
                      {getSelectedCategoriesData().map((category, index, array) => {
                        const isActive = sortBy === category.key
                        const getSortIcon = () => {
                          if (!isActive) return <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          return sortOrder === 'asc' 
                            ? <ArrowUp className="w-3 h-3 text-[#8c1a10]" />
                            : <ArrowDown className="w-3 h-3 text-[#8c1a10]" />
                        }

                        return (
                          <div 
                            key={category.key} 
                            className={`p-4 text-center border-r border-[#e7e7e7] last:border-r-0 flex-shrink-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                              isActive ? 'bg-gray-50' : ''
                            }`}
                            style={{ 
                              minWidth: '140px',
                              width: array.length <= 4 ? `${100 / array.length}%` : '140px'
                            }}
                            onClick={() => handleSort(category.key)}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <h4 className={`font-semibold text-sm ${
                                isActive ? 'text-[#8c1a10]' : 'text-[#6d6d6d]'
                              }`}>
                                {String(category.label)}
                              </h4>
                              {getSortIcon()}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Columna fija - Actions */}
                  <div className="w-24 p-4 text-center border-l border-[#e7e7e7] flex-shrink-0">
                    <h4 className="font-semibold text-[#6d6d6d] text-sm">Actions</h4>
                  </div>
                </div>

                {/* FILAS DE SCOUTS */}
                <div className="divide-y divide-[#e7e7e7]">
                  {filteredScouts.map((scout, index) => (
                    <div
                      key={scout.id_scout}
                      className="flex cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => _router.push(`/member/scout/${scout.id_scout}`)}
                    >
                      {/* Columna fija - Scout Info */}
                      <div className="w-80 p-4 border-r border-[#e7e7e7] flex-shrink-0">
                        <div className="flex items-center gap-4">
                          <ScoutAvatar scout={scout} size="md" />
                          <div>
                            <h3 className="font-semibold text-[#000000]">
                              {scout.scout_name || scout.name || 'Unknown Scout'}
                            </h3>
                            <p className="text-[#6d6d6d] text-sm">
                              {scout.age ? `${scout.age} años` : 'Age N/A'} • {scout.nationality || 'Unknown nationality'}
                            </p>
                            {scout.scout_level && (
                              <p className="text-[#8c1a10] text-xs font-medium mt-1">
                                {scout.scout_level}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Valores scrolleables */}
                      <div 
                        ref={(el) =>{
                          if (el) rowScrollRefs.current[index] = el
                        }}
                        className="flex-1 overflow-x-auto scrollbar-hide" onScroll={(e) => handleScroll(e.currentTarget.scrollLeft)}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        <div className="flex" style={{ minWidth: `${Math.max(getSelectedCategoriesData().length * 140, 100)}px` }}>
                          {getSelectedCategoriesData().map((category, catIndex, array) => {
                            try {
                              const value = category.getValue(scout)
                              let formattedValue: string
                              
                              // Apply format function if exists
                              if (category.format) {
                                const formatted = category.format(value)
                                formattedValue = String(formatted || 'N/A')
                              } else {
                                formattedValue = String(value || 'N/A')
                              }
                              
                              // Final safety check - ensure it's a string
                              if (typeof formattedValue !== 'string') {
                                console.warn('Non-string value detected:', formattedValue, 'for category:', category.key)
                                formattedValue = 'N/A'
                              }
                              
                              return (
                                <div 
                                  key={category.key} 
                                  className="p-4 text-center border-r border-[#e7e7e7] last:border-r-0 flex items-center justify-center flex-shrink-0"
                                  style={{ 
                                    minWidth: '140px',
                                    width: array.length <= 4 ? `${100 / array.length}%` : '140px'
                                  }}
                                >
                                  <span className="text-[#000000] font-medium text-sm">
                                    {formattedValue}
                                  </span>
                                </div>
                              )
                            } catch (error) {
                              console.error('Error rendering category:', category.key, error)
                              return (
                                <div 
                                  key={category.key} 
                                  className="p-4 text-center border-r border-[#e7e7e7] last:border-r-0 flex items-center justify-center flex-shrink-0"
                                  style={{ 
                                    minWidth: '140px',
                                    width: array.length <= 4 ? `${100 / array.length}%` : '140px'
                                  }}
                                >
                                  <span className="text-[#000000] font-medium text-sm">
                                    Error
                                  </span>
                                </div>
                              )
                            }
                          })}
                        </div>
                      </div>

                      {/* Columna fija - Actions */}
                      <div className="w-24 p-4 border-l border-[#e7e7e7] flex-shrink-0">
                        <div className="flex items-center justify-center gap-2">
                          <BookmarkButton
                            entityId={scout.id_scout}
                            isBookmarked={isInList(scout.id_scout)}
                            onToggle={async (scoutId) => {
                              if (isInList(scoutId)) {
                                return await removeFromList(scoutId)
                              } else {
                                return await addToList(scoutId)
                              }
                            }}

                          />
                          
                          <ArrowRight 
                            className="w-4 h-4 text-[#8c1a10] cursor-pointer hover:text-[#8c1a10]/80" 
                            onClick={(e) => {
                              e.stopPropagation()
                              _router.push(`/member/scout/${scout.id_scout}`)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
