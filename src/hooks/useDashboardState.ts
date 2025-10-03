import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlayerList } from './player/usePlayerList';

export interface DashboardState {
  activeTab: string;
  selectedFilters: Record<string, unknown>;
  searchQuery: string;
}

export const useDashboardState = () => {
  // Estados básicos
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [_paymentSuccess, _setPaymentSuccess] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['name', 'position', 'age', 'team']);
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({});
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  
  // Estados de ordenamiento
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estados de datos
  const [loading, setLoading] = useState(false);
  const [_error, _setError] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<unknown[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<unknown[]>([]);
  
  // Hook para manejar la lista de jugadores
  const { 
    playerList, 
    addToList, 
    removeFromList, 
    isInList,
    error: playerListError 
  } = usePlayerList();

  // Opciones de filtros dinámicas
  const [filterOptions, setFilterOptions] = useState({
    nationalities: [] as string[],
    positions: [] as string[],
    teams: [] as string[],
    competitions: [] as string[],
    ages: ['16-20', '21-25', '26-30', '31-35', '36+'] as string[]
  });

  // Efecto para generar opciones de filtros dinámicas
  useEffect(() => {
    if (allPlayers.length > 0) {
      const nationalities = new Set<string>();
      const positions = new Set<string>();
      const teams = new Set<string>();
      const competitions = new Set<string>();

      allPlayers.forEach((player: any) => {
        if (player.nationality_1 || player.nationality) {
          nationalities.add(player.nationality_1 || player.nationality);
        }
        if (player.position_player || player.position) {
          positions.add(player.position_player || player.position);
        }
        if (player.team_name || player.team) {
          teams.add(player.team_name || player.team);
        }
        if (player.team_competition || player.competition) {
          competitions.add(player.team_competition || player.competition);
        }
      });

      setFilterOptions({
        nationalities: Array.from(nationalities).sort(),
        positions: Array.from(positions).sort(),
        teams: Array.from(teams).sort(),
        competitions: Array.from(competitions).sort(),
        ages: ['16-20', '21-25', '26-30', '31-35', '36+']
      });

      console.log('✅ useDashboardState: Filter options generated:', {
        nationalities: nationalities.size,
        positions: positions.size,
        teams: teams.size,
        competitions: competitions.size
      });
    }
  }, [allPlayers]);

  // Contadores de tabs (memoizado para evitar re-renders)
  const tabCounts = useMemo(() => ({
    all: filteredPlayers.length,
    list: playerList.length,
    news: 0
  }), [filteredPlayers.length, playerList.length]);

  // Categorías disponibles (memoizado para evitar re-creación)
  const AVAILABLE_CATEGORIES = useMemo(() => [
    { 
      key: 'name', 
      label: 'Nombre', 
      enabled: true,
      getValue: (player: Record<string, unknown>) => player.player_name || player.name
    },
    { 
      key: 'position', 
      label: 'Posición', 
      enabled: true,
      getValue: (player: Record<string, unknown>) => player.position_player || player.position
    },
    { 
      key: 'age', 
      label: 'Edad', 
      enabled: true,
      getValue: (player: Record<string, unknown>) => player.age
    },
    { 
      key: 'team', 
      label: 'Equipo', 
      enabled: true,
      getValue: (player: Record<string, unknown>) => player.team_name || player.team
    },
    { 
      key: 'nationality', 
      label: 'Nacionalidad', 
      enabled: true,
      getValue: (player: Record<string, unknown>) => player.nationality_1 || player.nationality
    },
    { 
      key: 'rating', 
      label: 'Rating', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.player_rating || player.rating
    },
    { 
      key: 'height', 
      label: 'Altura', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.height ? `${player.height} cm` : player.height
    },
    { 
      key: 'foot', 
      label: 'Pie Hábil', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.correct_foot || player.foot
    },
    { 
      key: 'market_value', 
      label: 'Valor de Mercado', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => {
        const value = player.player_trfm_value || player.market_value;
        if (!value) return value;
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return `€${numValue.toFixed(2)}M`;
      }
    },
    { 
      key: 'birth_date', 
      label: 'Fecha de Nacimiento', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => {
        const date = player.correct_date_of_birth || player.date_of_birth || player.birth_date;
        return date ? new Date(date as string).toLocaleDateString('es-ES') : date;
      }
    },
    { 
      key: 'team_country', 
      label: 'País del Equipo', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.team_country || player.country
    },
    { 
      key: 'competition', 
      label: 'Competición', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.team_competition || player.competition
    },
    { 
      key: 'contract_expires', 
      label: 'Fin de Contrato', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => {
        const date = player.contract_expires;
        return date ? new Date(date as string).toLocaleDateString('es-ES') : 'N/A';
      }
    },
    { 
      key: 'on_loan', 
      label: 'Cedido', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.on_loan ? 'Sí' : 'No'
    },
    { 
      key: 'goals', 
      label: 'Goles', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.goals || 0
    },
    { 
      key: 'assists', 
      label: 'Asistencias', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.assists || 0
    },
    { 
      key: 'matches_played', 
      label: 'Partidos Jugados', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.matches_played || player.games || 0
    },
    { 
      key: 'minutes_played', 
      label: 'Minutos Jugados', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => {
        const minutes = player.minutes_played || player.minutes;
        return minutes ? `${minutes}'` : 0;
      }
    }
  ], []);

  // Datos de categorías seleccionadas (memoizado) - ordenadas según selección
  const selectedCategoriesData = useMemo(() => 
    selectedCategories
      .map(categoryKey => AVAILABLE_CATEGORIES.find(cat => cat.key === categoryKey))
      .filter(Boolean) as typeof AVAILABLE_CATEGORIES,
    [AVAILABLE_CATEGORIES, selectedCategories]
  );

  // Funciones (memoizadas con useCallback)
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [categoryId, ...prev]
    );
  }, []);

  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    setActiveFilters(filters);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setSelectedNationalities([]);
    setSelectedPositions([]);
    setSelectedTeams([]);
    setSelectedCompetitions([]);
    setSelectedAges([]);
  }, []);

  // Función para manejar ordenamiento
  const handleSort = useCallback((categoryKey: string) => {
    if (sortBy === categoryKey) {
      // Si ya está ordenado por esta columna, cambiar dirección
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es una nueva columna, ordenar ascendente
      setSortBy(categoryKey);
      setSortOrder('asc');
    }
  }, [sortBy]);

  // Las funciones de lista de jugadores ahora vienen del hook usePlayerList

  // Efecto para cargar datos iniciales
  useEffect(() => {
    let isMounted = true;
    
    const loadRealPlayers = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        console.log('🔍 useDashboardState: Loading real players...');
        const response = await fetch('/api/players-simple?page=1&limit=100');
        
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            console.log('✅ useDashboardState: Loaded players:', data.players?.length || 0);
            setAllPlayers(data.players || []);
          }
        } else {
          if (isMounted) {
            console.error('❌ useDashboardState: Failed to load players');
            setAllPlayers([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ useDashboardState: Error loading players:', error);
          setAllPlayers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Usar setTimeout para evitar problemas con promesas no cacheadas
    const timeoutId = setTimeout(() => {
      loadRealPlayers();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Solo cargar una vez al inicio

  // Efecto para aplicar filtros
  useEffect(() => {
    console.log('🔍 useDashboardState: Applying filters...', {
      searchTerm,
      activeTab,
      activeFilters,
      selectedNationalities: selectedNationalities.length,
      selectedPositions: selectedPositions.length,
      selectedTeams: selectedTeams.length,
      selectedCompetitions: selectedCompetitions.length,
      selectedAges: selectedAges.length,
      playerListCount: playerList.length
    });

    let filtered = [...allPlayers];

    // Aplicar filtro por tab
    if (activeTab === 'list') {
      // Solo mostrar jugadores que están en la lista del usuario
      filtered = filtered.filter((player: any) => 
        playerList.includes(player.id_player || player.id)
      );
    } else if (activeTab === 'news') {
      // Filtrar jugadores nuevos (últimos 7 días)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      filtered = filtered.filter((player: any) => {
        const createdAt = player.createdAt ? new Date(player.createdAt) : null;
        return createdAt && createdAt >= sevenDaysAgo;
      });
    }

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter((player: any) => {
        const name = player.player_name || player.name || '';
        const team = player.team_name || player.team || '';
        const position = player.position_player || player.position || '';
        
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               team.toLowerCase().includes(searchTerm.toLowerCase()) ||
               position.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Aplicar filtros de nacionalidad
    if (selectedNationalities.length > 0) {
      filtered = filtered.filter((player: any) => {
        const nationality = player.nationality_1 || player.nationality || '';
        return selectedNationalities.includes(nationality);
      });
    }

    // Aplicar filtros de posición
    if (selectedPositions.length > 0) {
      filtered = filtered.filter((player: any) => {
        const position = player.position_player || player.position || '';
        return selectedPositions.includes(position);
      });
    }

    // Aplicar filtros de equipo
    if (selectedTeams.length > 0) {
      filtered = filtered.filter((player: any) => {
        const team = player.team_name || player.team || '';
        return selectedTeams.includes(team);
      });
    }

    // Aplicar filtros de competición
    if (selectedCompetitions.length > 0) {
      filtered = filtered.filter((player: any) => {
        const competition = player.team_competition || player.competition || '';
        return selectedCompetitions.includes(competition);
      });
    }

    // Aplicar filtros de edad
    if (selectedAges.length > 0) {
      filtered = filtered.filter((player: any) => {
        const age = player.age;
        if (!age) return false;
        
        return selectedAges.some(ageRange => {
          switch (ageRange) {
            case '16-20':
              return age >= 16 && age <= 20;
            case '21-25':
              return age >= 21 && age <= 25;
            case '26-30':
              return age >= 26 && age <= 30;
            case '31-35':
              return age >= 31 && age <= 35;
            case '36+':
              return age >= 36;
            default:
              return false;
          }
        });
      });
    }

    // Aplicar ordenamiento
    const sortedFiltered = [...filtered].sort((a: any, b: any) => {
      const categoryConfig = AVAILABLE_CATEGORIES.find(cat => cat.key === sortBy);
      if (!categoryConfig) return 0;

      const aValue = categoryConfig.getValue(a);
      const bValue = categoryConfig.getValue(b);

      // Manejar valores nulos/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortOrder === 'asc' ? 1 : -1;
      if (bValue == null) return sortOrder === 'asc' ? -1 : 1;

      // Determinar tipo de ordenamiento
      const isNumeric = typeof aValue === 'number' && typeof bValue === 'number';
      
      let comparison = 0;
      if (isNumeric) {
        comparison = (aValue as number) - (bValue as number);
      } else {
        // Ordenamiento alfabético
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        comparison = aStr.localeCompare(bStr);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    console.log('✅ useDashboardState: Filters and sorting applied:', {
      originalCount: allPlayers.length,
      filteredCount: filtered.length,
      sortBy,
      sortOrder
    });

    setFilteredPlayers(sortedFiltered);
  }, [
    allPlayers, 
    searchTerm, 
    activeTab, 
    JSON.stringify(activeFilters), // Serializar objeto para evitar cambios de referencia
    selectedNationalities.join(','), // Convertir arrays a strings para dependencias estables
    selectedPositions.join(','),
    selectedTeams.join(','),
    selectedCompetitions.join(','),
    selectedAges.join(','),
    playerList.join(','), // Convertir array a string para dependencia estable
    sortBy,
    sortOrder,
    AVAILABLE_CATEGORIES // Agregar categorías para acceso en ordenamiento
  ]);

  return {
    // Estados
    showFilters,
    setShowFilters,
    searchTerm,
    activeTab,
    paymentSuccess: _paymentSuccess,
    selectedCategories,
    activeFilters,
    selectedNationalities,
    selectedPositions,
    selectedTeams,
    selectedCompetitions,
    selectedAges,
    filterOptions,
    sortBy,
    sortOrder,
    
    // Datos derivados
    loading,
    error: _error || playerListError,
    filteredPlayers,
    tabCounts,
    selectedCategoriesData,
    
    // Funciones
    handleSearch,
    handleTabChange,
    handleCategoryToggle,
    applyFilters,
    clearFilters,
    handleSort,
    setSelectedNationalities,
    setSelectedPositions,
    setSelectedTeams,
    setSelectedCompetitions,
    setSelectedAges,
    
    // Player list functions
    addToList,
    removeFromList,
    isInList,
    
    // Constants
    AVAILABLE_CATEGORIES,
  };
};