import { useState, useMemo, useCallback, useEffect } from 'react';

import { useInfiniteDashboardScroll } from './member/useInfiniteDashboardScroll';
import { usePlayerList } from './player/usePlayerList';
import { useUserPreferences } from './useUserPreferences';

import { DASHBOARD_CATEGORY_GROUPS } from '@/constants/dashboard-categories';
import type { PlayerFilters, Category } from '@/types/dashboard';

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

  // Estados para opciones de filtros del servidor
  const [serverFilterOptions, setServerFilterOptions] = useState<{
    nationalities: string[];
    teams: string[];
    competitions: string[];
    positions: string[];
    stats: {
      age: { min: number; max: number };
      rating: { min: number; max: number };
      value: { min: number; max: number };
    };
  } | null>(null);

  // Cargar opciones del servidor al montar
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/players/filter-options');
        if (response.ok) {
          const data = await response.json();
          setServerFilterOptions(data);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    fetchOptions();
  }, []);

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
    // Si alguno de los dos está definido, devolvemos el objeto
    if (activeFilters.min_age !== undefined || activeFilters.max_age !== undefined) {
      return { 
        min: activeFilters.min_age, 
        max: activeFilters.max_age 
      }
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
    nationality: selectedNationalities[0] || '',
    position: selectedPositions[0] || '',
    team: selectedTeams[0] || '',
    competition: selectedCompetitions[0] || '',
    // @ts-expect-error - Ignoring strict type check for optional properties
    minAge: getAgeRange().min,
    // @ts-expect-error - Ignoring strict type check for optional properties
    maxAge: getAgeRange().max,
    // @ts-expect-error - Ignoring strict type check for optional properties
    minRating: activeFilters.min_rating,
    // @ts-expect-error - Ignoring strict type check for optional properties
    maxRating: activeFilters.max_rating,
    // @ts-expect-error - Ignoring strict type check for optional properties
    minValue: activeFilters.min_value,
    // @ts-expect-error - Ignoring strict type check for optional properties
    maxValue: activeFilters.max_value,
    limit: 50
  });

  // Helper to flatten categories from groups (moved up for use in sorting)
  const flattenCategories = useCallback((groups: typeof DASHBOARD_CATEGORY_GROUPS): Category[] => {
    const flattened: Category[] = []
    const processGroup = (group: typeof DASHBOARD_CATEGORY_GROUPS[0]) => {
      // @ts-expect-error - Ignoring strict type check for now to fix build
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
        // @ts-expect-error - Ignoring strict type check for now
        valueA = category.getValue(a)
        // @ts-expect-error - Ignoring strict type check for now
        valueB = category.getValue(b)
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

  // Opciones de filtros (usar las del servidor si están disponibles, sino fallback a las locales)
  const filterOptions = useMemo(() => {
    if (serverFilterOptions) {
      return {
        nationalities: serverFilterOptions.nationalities,
        positions: serverFilterOptions.positions,
        teams: serverFilterOptions.teams,
        competitions: serverFilterOptions.competitions,
        ages: ['16-20', '21-25', '26-30', '31-35', '36+'],
        stats: serverFilterOptions.stats // Exponer stats para placeholders
      }
    }

    // Fallback: extraer de los jugadores cargados (comportamiento anterior)
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
      ages: ['16-20', '21-25', '26-30', '31-35', '36+'],
      stats: undefined
    }
  }, [allPlayers, serverFilterOptions])

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
