import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

import { DASHBOARD_CATEGORY_GROUPS, getDashboardCategoryGroups } from '@/constants/dashboard-categories';
import type { StatsPeriod } from '@/lib/utils/stats-period-utils';
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

  // Stats periods (empty = no stats columns, max 2 allowed)
  const [statsPeriods, setStatsPeriods] = useState<StatsPeriod[]>([]);

  // Natural order used to keep statsPeriods stable
  const PERIOD_ORDER: StatsPeriod[] = ['3m', '6m', '1y', '2y'];

  // One-shot migration: strip legacy period suffixes from persisted category keys
  useEffect(() => {
    if (preferencesLoading) return;
    const legacySuffixes = ['_3m', '_6m', '_1y', '_2y'];
    const migrated = selectedCategories.map(key => {
      const match = legacySuffixes.find(s => key.endsWith(s));
      return match ? key.slice(0, -match.length) : key;
    });
    // Deduplicate after stripping
    const deduped = Array.from(new Set(migrated));
    const changed =
      deduped.length !== selectedCategories.length ||
      deduped.some((k, i) => k !== selectedCategories[i]);
    if (changed) setSelectedCategories(deduped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesLoading]);

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

  // Snapshot de favoritos usado como filtro del servidor. Se toma UNA vez por
  // entrada a la pestaña 'favourites' y se mantiene estable ante mutaciones de
  // `playerList`, para que (des)marcar un favorito no dispare el reset + refetch
  // de infinite-scroll. El filtro cliente-side en `baseFilteredPlayers` ajusta
  // las filas visibles al vuelo.
  const [favouritesQueryIds, setFavouritesQueryIds] = useState<string[] | undefined>(undefined);
  const favSnapshotTakenRef = useRef(false);
  useEffect(() => {
    if (activeTab === 'favourites') {
      // Toma la foto la primera vez que entramos con datos disponibles.
      // Si playerList aún no cargó, esperamos a que lo haga (el efecto re-corre
      // cuando cambia playerList) y snapshot una sola vez.
      if (!favSnapshotTakenRef.current && playerList.length > 0) {
        setFavouritesQueryIds([...playerList]);
        favSnapshotTakenRef.current = true;
      }
    } else {
      // Al salir del tab, permitimos que la próxima entrada vuelva a snapshot.
      favSnapshotTakenRef.current = false;
      setFavouritesQueryIds(undefined);
    }
  }, [activeTab, playerList]);

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
    period: statsPeriods[0] ?? undefined,
    hasMarketValue: activeFilters.has_market_value,
    hasAttributes: activeFilters.has_attributes,
    hasStats: activeFilters.has_stats,
    hasTextReport: activeFilters.has_text_report,
    hasVideoReport: activeFilters.has_video_report,
    isYouthDiscovery: activeFilters.is_youth_discovery,
    isEmergingTalent: activeFilters.is_emerging_talent,
    isProfessional: activeFilters.is_professional,
    isTopLeagues: activeFilters.is_top_leagues,
    isBigFive: activeFilters.is_big_five,
    // Al estar en la pestaña 'favourites' usamos un snapshot congelado de playerList
    // (favouritesQueryIds). Toggle de favoritos actualiza playerList pero no este
    // snapshot, así evitamos el reset + refetch del infinite-scroll. El filtro local
    // en `baseFilteredPlayers` se encarga de ocultar/mostrar filas en tiempo real.
    playerIds: activeTab === 'favourites' ? favouritesQueryIds : undefined,
    limit: 50
  });

  // Cache the "All" tab total count so switching to favourites doesn't overwrite it
  const allTabTotalRef = useRef<number | null>(null);
  useEffect(() => {
    if (activeTab !== 'favourites' && typeof totalCount === 'number') {
      allTabTotalRef.current = totalCount;
    }
  }, [activeTab, totalCount]);

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

  // Filtrar jugadores según tab. Para 'favourites', el servidor devuelve el snapshot
  // (favouritesQueryIds) que se congeló al entrar al tab. Cuando el usuario
  // (des)marca un favorito, `playerList` cambia pero no re-consultamos: filtramos
  // `allPlayers` cliente-side contra la `playerList` actual. Quitar un favorito
  // elimina la fila al instante; añadir uno nuevo desde otra pestaña/pantalla se
  // verá al volver a entrar al tab (el snapshot se refresca por el useEffect de
  // activeTab).
  const playerListSet = useMemo(() => new Set(playerList), [playerList])
  const baseFilteredPlayers = useMemo(() => {
    if (activeTab === 'favourites') {
      if (playerList.length === 0) return []
      return allPlayers.filter(p => playerListSet.has(String(p.id_player)))
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
  }, [allPlayers, activeTab, playerList, playerListSet])

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

  // Contadores de tabs.
  // En la pestaña 'favourites' el `totalCount` del servidor corresponde a los
  // favoritos, así que usamos el snapshot cacheado del total de 'All' para no
  // perder el número al cambiar de pestaña.
  const tabCounts = useMemo(() => {
    const allTotal =
      activeTab === 'favourites'
        ? allTabTotalRef.current ?? allPlayers.length
        : totalCount ?? allPlayers.length
    return {
      all: allTotal,
      favourites: playerList.length,
      news: 0,
    }
  }, [activeTab, totalCount, allPlayers.length, playerList.length])

  // Categorías disponibles (dynamic based on stats periods)
  const AVAILABLE_CATEGORIES = useMemo(
    () => getDashboardCategoryGroups(statsPeriods),
    [statsPeriods]
  )

  // Get all categories for sorting lookup (must update with period)
  const allCategories = useMemo(() => flattenCategories(AVAILABLE_CATEGORIES), [flattenCategories, AVAILABLE_CATEGORIES])

  // Apply sorting to filtered players
  const filteredPlayers = useMemo(() => {
    if (!sortBy || sortBy === 'name') {
      const sorted = [...baseFilteredPlayers].sort((a, b) => {
        const nameA = (a.player_name || '').toLowerCase()
        const nameB = (b.player_name || '').toLowerCase()
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA)
      })
      return sorted
    }

    const category = allCategories.find(cat => cat.key === sortBy)

    const sorted = [...baseFilteredPlayers].sort((a, b) => {
      let valueA: unknown
      let valueB: unknown

      if (category?.getSortValue) {
        // @ts-expect-error - Ignoring strict type check for now
        valueA = category.getSortValue(a)
        // @ts-expect-error - Ignoring strict type check for now
        valueB = category.getSortValue(b)
      } else if (category?.getValue) {
        // @ts-expect-error - Ignoring strict type check for now
        valueA = category.getValue(a)
        // @ts-expect-error - Ignoring strict type check for now
        valueB = category.getValue(b)
      } else {
        valueA = (a as unknown as Record<string, unknown>)[sortBy]
        valueB = (b as unknown as Record<string, unknown>)[sortBy]
      }

      const isNaA = valueA === 'N/A' || valueA === null || valueA === undefined
      const isNaB = valueB === 'N/A' || valueB === null || valueB === undefined

      if (isNaA && isNaB) return 0
      if (isNaA) return 1
      if (isNaB) return -1

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA
      }

      const strA = String(valueA).toLowerCase()
      const strB = String(valueB).toLowerCase()

      const numA = parseFloat(strA.replace(/[^0-9.-]/g, ''))
      const numB = parseFloat(strB.replace(/[^0-9.-]/g, ''))

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA
      }

      return sortOrder === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA)
    })

    return sorted
  }, [baseFilteredPlayers, sortBy, sortOrder, allCategories])

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

  // Toggle a period in the statsPeriods array. Max 2 simultaneous, order fixed by PERIOD_ORDER.
  // Category keys are stable (no period suffix), so no selection migration is needed.
  const handleStatsPeriodToggle = useCallback((period: StatsPeriod) => {
    setStatsPeriods(prev => {
      if (prev.includes(period)) {
        return prev.filter(p => p !== period)
      }
      if (prev.length >= 2) {
        return prev // cap reached, no-op
      }
      const next = [...prev, period]
      next.sort((a, b) => PERIOD_ORDER.indexOf(a) - PERIOD_ORDER.indexOf(b))
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    // Estados
    showFilters,
    setShowFilters,
    searchTerm,
    activeTab,
    paymentSuccess: false,
    selectedCategories,
    statsPeriods,
    handleStatsPeriodToggle,
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
