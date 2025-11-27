import { useState, useMemo, useCallback } from 'react';

import { DASHBOARD_CATEGORY_GROUPS } from '@/constants/dashboard-categories';
import type { PlayerFilters, Category } from '@/types/dashboard';

import { useInfiniteDashboardScroll } from './member/useInfiniteDashboardScroll';
import { usePlayerList } from './player/usePlayerList';
import { useUserPreferences } from './useUserPreferences';

export const useDashboardStateInfinite = () => {
  // Hook para preferencias del usuario (guardadas en DB)
  const {
    selectedCategories,
    setSelectedCategories,
    resetToDefaults: resetCategories,
    loading: preferencesLoading
  } = useUserPreferences();

  // Estados básicos
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeFilters, setActiveFilters] = useState<PlayerFilters>({});
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);

  // Estados de ordenamiento
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Hook para manejar la lista de jugadores favoritos
  const {
    playerList,
    addToList,
    removeFromList,
    isInList,
    error: playerListError
  } = usePlayerList();

  // Convertir rangos de edad a min/max
  const getAgeRange = useCallback(() => {
    if (activeFilters.min_age !== undefined && activeFilters.max_age !== undefined) {
      return { min: activeFilters.min_age, max: activeFilters.max_age }
    }
    return { min: undefined, max: undefined }
  }, [activeFilters.min_age, activeFilters.max_age])

  // Hook de infinite scroll con filtros
  const {
    players: allPlayers,
    loading,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfiniteDashboardScroll({
    search: searchTerm,
    nationality: selectedNationalities[0], // Solo primer valor por ahora
    position: selectedPositions[0],
    team: selectedTeams[0],
    competition: selectedCompetitions[0],
    minAge: getAgeRange().min,
    maxAge: getAgeRange().max,
    minRating: activeFilters.min_rating,
    maxRating: activeFilters.max_rating,
    minValue: activeFilters.min_value,
    maxValue: activeFilters.max_value,
    limit: 50
  });

  // Helper to flatten categories from groups (moved up for use in sorting)
  const flattenCategories = useCallback((groups: typeof DASHBOARD_CATEGORY_GROUPS): Category[] => {
    const flattened: Category[] = []
    const processGroup = (group: typeof DASHBOARD_CATEGORY_GROUPS[0]) => {
      flattened.push(...group.categories)
      if (group.subgroups) {
        group.subgroups.forEach(processGroup)
      }
    }
    groups.forEach(processGroup)
    return flattened
  }, [])

  // Get all categories for sorting lookup
  const allCategories = useMemo(() => flattenCategories(DASHBOARD_CATEGORY_GROUPS), [flattenCategories])

  // Filtrar jugadores según tab (client-side para favourites)
  const baseFilteredPlayers = useMemo(() => {
    if (activeTab === 'favourites') {
      return allPlayers.filter(player =>
        playerList.includes(player.id_player || player.id)
      )
    }
    if (activeTab === 'news') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return allPlayers.filter(player => {
        const createdAt = player.createdAt ? new Date(player.createdAt) : null
        return createdAt && createdAt >= sevenDaysAgo
      })
    }
    return allPlayers
  }, [allPlayers, activeTab, playerList])

  // Apply sorting to filtered players
  const filteredPlayers = useMemo(() => {
    if (!sortBy || sortBy === 'name') {
      // Sort by name (player_name)
      const sorted = [...baseFilteredPlayers].sort((a, b) => {
        const nameA = (a.player_name || '').toLowerCase()
        const nameB = (b.player_name || '').toLowerCase()
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA)
      })
      return sorted
    }

    // Find the category to get its getValue function
    const category = allCategories.find(cat => cat.key === sortBy)

    const sorted = [...baseFilteredPlayers].sort((a, b) => {
      let valueA: unknown
      let valueB: unknown

      if (category?.getValue) {
        valueA = category.getValue(a as unknown as Record<string, unknown>)
        valueB = category.getValue(b as unknown as Record<string, unknown>)
      } else {
        // Fallback: direct property access
        valueA = (a as unknown as Record<string, unknown>)[sortBy]
        valueB = (b as unknown as Record<string, unknown>)[sortBy]
      }

      // Handle N/A values - push them to the end
      const isNaA = valueA === 'N/A' || valueA === null || valueA === undefined
      const isNaB = valueB === 'N/A' || valueB === null || valueB === undefined

      if (isNaA && isNaB) return 0
      if (isNaA) return 1 // A goes to end
      if (isNaB) return -1 // B goes to end

      // Compare based on type
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA
      }

      // String comparison (including formatted values like "€10.00M", "180 cm")
      const strA = String(valueA).toLowerCase()
      const strB = String(valueB).toLowerCase()

      // Try to extract numbers from formatted strings
      const numA = parseFloat(strA.replace(/[^0-9.-]/g, ''))
      const numB = parseFloat(strB.replace(/[^0-9.-]/g, ''))

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA
      }

      // Fallback to string comparison
      return sortOrder === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA)
    })

    return sorted
  }, [baseFilteredPlayers, sortBy, sortOrder, allCategories])

  // Opciones de filtros (extraídas de los jugadores cargados)
  const filterOptions = useMemo(() => {
    const nationalities = new Set<string>()
    const positions = new Set<string>()
    const teams = new Set<string>()
    const competitions = new Set<string>()

    allPlayers.forEach(player => {
      if (player.nationality_1) nationalities.add(player.nationality_1)
      if (player.position_player) positions.add(player.position_player)
      if (player.team_name) teams.add(player.team_name)
      if (player.team_competition) competitions.add(player.team_competition)
    })

    return {
      nationalities: Array.from(nationalities).sort(),
      positions: Array.from(positions).sort(),
      teams: Array.from(teams).sort(),
      competitions: Array.from(competitions).sort(),
      ages: ['16-20', '21-25', '26-30', '31-35', '36+']
    }
  }, [allPlayers])

  // Contadores de tabs
  const tabCounts = useMemo(() => ({
    all: totalCount || allPlayers.length,
    favourites: playerList.length,
    news: 0
  }), [totalCount, allPlayers.length, playerList.length])

  // Categorías disponibles
  const AVAILABLE_CATEGORIES = useMemo(() => DASHBOARD_CATEGORY_GROUPS, [])

  // Datos de categorías seleccionadas
  const selectedCategoriesData = useMemo(() => {
    return selectedCategories
      .map(categoryKey => allCategories.find(cat => cat.key === categoryKey))
      .filter(Boolean) as Category[]
  }, [selectedCategories, allCategories])

  // Funciones
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  const handleCategoryToggle = useCallback((categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [categoryId, ...selectedCategories]
    setSelectedCategories(newCategories)
  }, [selectedCategories, setSelectedCategories])

  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    setActiveFilters(filters)
  }, [])

  const clearFilters = useCallback(() => {
    setActiveFilters({})
    setSelectedNationalities([])
    setSelectedPositions([])
    setSelectedTeams([])
    setSelectedCompetitions([])
    refresh() // Refrescar la lista
  }, [refresh])

  const handleSort = useCallback((categoryKey: string) => {
    if (sortBy === categoryKey) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(categoryKey)
      setSortOrder('asc')
    }
  }, [sortBy])

  return {
    // Estados
    showFilters,
    setShowFilters,
    searchTerm,
    activeTab,
    paymentSuccess: false,
    selectedCategories,
    activeFilters,
    selectedNationalities,
    selectedPositions,
    selectedTeams,
    selectedCompetitions,
    selectedAges: [], // No usado en esta versión
    filterOptions,
    sortBy,
    sortOrder,

    // Datos derivados
    loading: loading || preferencesLoading,
    error: playerListError,
    filteredPlayers,
    tabCounts,
    selectedCategoriesData,

    // Infinite scroll
    hasMore,
    observerTarget,

    // Funciones
    handleSearch,
    handleTabChange,
    handleCategoryToggle,
    resetCategories,
    applyFilters,
    clearFilters,
    handleSort,
    setSelectedNationalities,
    setSelectedPositions,
    setSelectedTeams,
    setSelectedCompetitions,
    setSelectedAges: () => {}, // No-op por ahora

    // Player list functions
    addToList,
    removeFromList,
    isInList,

    // Constants
    AVAILABLE_CATEGORIES,
  }
}
