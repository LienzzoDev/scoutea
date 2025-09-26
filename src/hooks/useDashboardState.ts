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
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.nationality_1 || player.nationality
    },
    { 
      key: 'rating', 
      label: 'Rating', 
      enabled: false,
      getValue: (player: Record<string, unknown>) => player.rating
    }
  ], []);

  // Datos de categorías seleccionadas (memoizado)
  const selectedCategoriesData = useMemo(() => 
    AVAILABLE_CATEGORIES.filter(cat => selectedCategories.includes(cat.key)),
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
        : [...prev, categoryId]
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

  // Las funciones de lista de jugadores ahora vienen del hook usePlayerList

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const loadRealPlayers = async () => {
      setLoading(true);
      try {
        console.log('🔍 useDashboardState: Loading real players...');
        const response = await fetch('/api/players-simple?page=1&limit=100'); // Cargar más jugadores para filtrar
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ useDashboardState: Loaded players:', data.players?.length || 0);
          setAllPlayers(data.players || []);
        } else {
          console.error('❌ useDashboardState: Failed to load players');
          setAllPlayers([]);
        }
      } catch (error) {
        console.error('❌ useDashboardState: Error loading players:', error);
        setAllPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    loadRealPlayers();
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

    console.log('✅ useDashboardState: Filters applied:', {
      originalCount: allPlayers.length,
      filteredCount: filtered.length
    });

    setFilteredPlayers(filtered);
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
    playerList.join(',') // Convertir array a string para dependencia estable
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