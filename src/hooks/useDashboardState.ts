"use client";

import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";

import { usePlayerList } from "@/hooks/player/usePlayerList";
import { usePlayers } from "@/hooks/player/usePlayers";
import type { Player } from "@/types/player";

// 🎯 CATEGORÍAS DISPONIBLES PARA MOSTRAR
const AVAILABLE_CATEGORIES = [
  {
    _key: "rating",
    label: "Rating",
    getValue: (__player: Player) =>player.player_rating,
    format: (value: unknown) => (value ? `${value}/100` : "N/A"),
  },
  {
    _key: "age",
    label: "Age",
    getValue: (__player: Player) => player.age,
    format: (value: unknown) => (value ? `${value} años` : "N/A"),
  },
  {
    _key: "position",
    label: "Position",
    getValue: (__player: Player) => player.position_player,
  },
  {
    _key: "team",
    label: "Team",
    getValue: (__player: Player) => player.team_name,
  },
  {
    _key: "competition",
    label: "Competition",
    getValue: (__player: Player) => player.team_competition,
  },
  {
    _key: "nationality",
    label: "Nationality",
    getValue: (__player: Player) => player.nationality_1,
  },
  {
    _key: "contract_end",
    label: "Contract End",
    getValue: (__player: Player) => player.contract_end,
    format: (value: unknown) => {
      if (!value) return "N/A";
      try {
        const date = new Date(value);
        return date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } catch {
        return "N/A";
      }
    },
  },
  {
    _key: "market_value",
    label: "Market Value",
    getValue: (__player: Player) => player.player_trfm_value,
    format: (value: unknown) => {
      if (!value) return "N/A";
      if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
      return `€${value}`;
    },
  },
  {
    _key: "height",
    label: "Height",
    getValue: (__player: Player) => player.height,
    format: (value: unknown) => (value ? `${value} cm` : "N/A"),
  },
  {
    _key: "agency",
    label: "Agency",
    getValue: (__player: Player) => player.agency,
  },
  { _key: "foot", label: "Foot", getValue: (__player: Player) => player.foot },
  {
    _key: "loan_status",
    label: "Loan Status",
    getValue: (__player: Player) => (player.on_loan ? "En Préstamo" : "Propio"),
  },
];

export function useDashboardState() {
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();

  // Estados básicos
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);

  // Estados para categorías seleccionadas
  const defaultCategories = ["rating", "age", "position", "team"];
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(defaultCategories);

  // Estados para filtros
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({});
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    nationalities: string[];
    positions: string[];
    teams: string[];
    competitions: string[];
    ages: string[];
  }>({
    nationalities: [],
    positions: [],
    teams: [],
    competitions: [],
    ages: [],
  });

  // Hooks
  const { players, loading, error, searchPlayers, pagination } = usePlayers();
  const { playerList, addToList, removeFromList, isInList } = usePlayerList();
  
  // Use ref to store searchPlayers function to avoid dependency issues
  const searchPlayersRef = useRef(searchPlayers);
  searchPlayersRef.current = searchPlayers;

  // Cargar categorías guardadas
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-selected-categories");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedCategories(parsed);
        } else {
          setSelectedCategories(defaultCategories);
          localStorage.setItem(
            "dashboard-selected-categories",
            JSON.stringify(defaultCategories)
          );
        }
      } catch (_error) {
        setSelectedCategories(defaultCategories);
        localStorage.setItem(
          "dashboard-selected-categories",
          JSON.stringify(defaultCategories)
        );
      }
    } else {
      setSelectedCategories(defaultCategories);
      localStorage.setItem(
        "dashboard-selected-categories",
        JSON.stringify(defaultCategories)
      );
    }
  }, []);

  // Detectar pago exitoso
  useEffect(() => {
    const success = searchParams.get("payment_success");
    if (success === "true") {
      setPaymentSuccess(true);
    }
  }, [searchParams]);

  // Cargar jugadores iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      // 🔐 ESPERAR A QUE CLERK ESTÉ LISTO
      if (!isLoaded) {
        console.log('useDashboardState: Clerk not loaded yet, waiting...');
        return;
      }
      
      if (!isSignedIn) {
        console.log('useDashboardState: User not signed in');
        return;
      }

      // Prevent multiple loads
      if (initialLoadCompleted) {
        console.log('useDashboardState: Initial load already completed, skipping...');
        return;
      }
      
      console.log('useDashboardState: Loading initial data...');
      
      const initialSearchOptions = {
        page: 1,
        limit: 20,
        sortBy: "player_rating" as const,
        sortOrder: "desc" as const,
        _filters: {},
      };

      try {
        await searchPlayersRef.current(initialSearchOptions);
        console.log('useDashboardState: Initial players loaded');
        setInitialLoadCompleted(true);
      } catch (_error) {
        console.error('useDashboardState: Error loading initial players:', error);
      }
      
      await loadFilterOptions();
    };

    // Only load once when authentication is ready
    if (isLoaded && isSignedIn && !initialLoadCompleted) {
      loadInitialData();
    }
  }, [isLoaded, isSignedIn, initialLoadCompleted]); // Added initialLoadCompleted to prevent loops

  // Cargar opciones de filtros
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await fetch("/api/players/filters");
      if (response.ok) {
        const options = await response.json();
        setFilterOptions(options);
      } else {
        const fallbackOptions = {
          nationalities: ["Spain", "Brazil", "Argentina", "France", "Germany", "Italy", "England", "Portugal", "Netherlands", "Belgium"],
          positions: ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF", "LM", "RM"],
          teams: ["Real Madrid", "Barcelona", "Atletico Madrid", "Valencia", "Sevilla", "Real Sociedad"],
          competitions: ["La Liga", "Premier League", "Serie A", "Bundesliga", "Ligue 1", "Champions League"],
          ages: ["16-18", "19-21", "22-24", "25-27", "28-30", "31+"],
        };
        setFilterOptions(fallbackOptions);
      }
    } catch (_error) {
      const fallbackOptions = {
        nationalities: ["Spain", "Brazil", "Argentina", "France", "Germany", "Italy", "England", "Portugal", "Netherlands", "Belgium"],
        positions: ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF", "LM", "RM"],
        teams: ["Real Madrid", "Barcelona", "Atletico Madrid", "Valencia", "Sevilla", "Real Sociedad"],
        competitions: ["La Liga", "Premier League", "Serie A", "Bundesliga", "Ligue 1", "Champions League"],
        ages: ["16-18", "19-21", "22-24", "25-27", "28-30", "31+"],
      };
      setFilterOptions(fallbackOptions);
    }
  }, []);

  // Filtrar jugadores según la pestaña activa y filtros aplicados
  const getFilteredPlayers = useCallback(() => {
    if (!players || players.length === 0) {
      return [];
    }

    let filtered = [...players];

    // Filtrar por pestaña
    if (activeTab === "list") {
      filtered = filtered.filter((player) => isInList(player.id_player));
    } else if (activeTab === "news") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((player) => {
        if (!player.createdAt) return false;
        const createdDate = new Date(player.createdAt);
        return createdDate >= sevenDaysAgo;
      });
    }

    // Aplicar filtro de búsqueda por texto
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((player) => {
        return (
          player.player_name?.toLowerCase().includes(searchLower) ||
          player.complete_player_name?.toLowerCase().includes(searchLower) ||
          player.id_player?.toString().includes(searchLower) ||
          player.nationality_1?.toLowerCase().includes(searchLower) ||
          player.nationality_2?.toLowerCase().includes(searchLower) ||
          player.position_player?.toLowerCase().includes(searchLower) ||
          player.team_name?.toLowerCase().includes(searchLower) ||
          player.team_competition?.toLowerCase().includes(searchLower) ||
          player.team_country?.toLowerCase().includes(searchLower) ||
          player.agency?.toLowerCase().includes(searchLower) ||
          player.foot?.toLowerCase().includes(searchLower) ||
          player.age?.toString().includes(searchTerm.trim())
        );
      });
    }

    // Aplicar filtros avanzados
    const hasActiveFilters = Object.keys(activeFilters).length > 0 || 
                            selectedNationalities.length > 0 || 
                            selectedPositions.length > 0 || 
                            selectedTeams.length > 0 || 
                            selectedCompetitions.length > 0 || 
                            selectedAges.length > 0;

    if (hasActiveFilters) {
      console.log('🔍 Applying player __filters: ', {
        activeFilters,
        selectedNationalities,
        selectedPositions,
        selectedTeams,
        selectedCompetitions,
        selectedAges,
        totalPlayers: filtered.length
      });

      filtered = filtered.filter(player => {
        // Filtro por nacionalidades (multi-select)
        if (selectedNationalities.length > 0 && !selectedNationalities.includes(player.nationality_1 || '')) {
          return false;
        }
        
        // Filtro por posiciones (multi-select)
        if (selectedPositions.length > 0 && !selectedPositions.includes(player.position_player || '')) {
          return false;
        }
        
        // Filtro por equipos (multi-select)
        if (selectedTeams.length > 0 && !selectedTeams.includes(player.team_name || '')) {
          return false;
        }
        
        // Filtro por competiciones (multi-select)
        if (selectedCompetitions.length > 0 && !selectedCompetitions.includes(player.team_competition || '')) {
          return false;
        }
        
        // Filtro por edad
        if (activeFilters.min_age && (!player.age || player.age < activeFilters.min_age)) {
          return false;
        }
        if (activeFilters.max_age && (!player.age || player.age > activeFilters.max_age)) {
          return false;
        }
        
        // Filtro por rating
        if (activeFilters.min_rating && (!player.player_rating || player.player_rating < activeFilters.min_rating)) {
          return false;
        }
        if (activeFilters.max_rating && (!player.player_rating || player.player_rating > activeFilters.max_rating)) {
          return false;
        }
        
        // Filtro por valor de mercado (en millones)
        if (activeFilters.min_value && (!player.player_trfm_value || (player.player_trfm_value / 1000000) < activeFilters.min_value)) {
          return false;
        }
        if (activeFilters.max_value && (!player.player_trfm_value || (player.player_trfm_value / 1000000) >activeFilters.max_value)) {
          return false;
        }
        
        return true;
      });

      console.log('🔍 Filtered players result:', filtered.length);
    }

    return filtered;
  }, [players, activeTab, searchTerm, isInList, activeFilters, selectedNationalities, selectedPositions, selectedTeams, selectedCompetitions, selectedAges]);

  // Calcular conteos para las pestañas
  const getTabCounts = useCallback(() => {
    return {
      all: players?.length || 0,
      news:
        players?.filter((player) => {
          if (!player.createdAt) return false;
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const createdDate = new Date(player.createdAt);
          return createdDate >= sevenDaysAgo;
        }).length || 0,
      list: playerList?.length || 0,
    };
  }, [players, playerList]);

  // Función de búsqueda optimizada
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);

      if (term.trim().length >= 2) {
        const searchOptions = {
          page: 1,
          limit: 20,
          sortBy: "player_rating" as const,
          sortOrder: "desc" as const,
          _filters: { player_name: term.trim() },
        };

        searchPlayersRef.current(searchOptions);
      }
    },
    [] // Removed searchPlayers dependency
  );

  // Función para cambiar de pestaña optimizada
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearchTerm("");
  }, []);

  // Función para obtener categorías seleccionadas
  const getSelectedCategoriesData = useCallback(() => {
    return AVAILABLE_CATEGORIES.filter((cat) =>
      selectedCategories.includes(cat.key)
    );
  }, [selectedCategories]);

  // Aplicar filtros
  const applyFilters = useCallback(
    (newFilters: Record<string, unknown>) => {
      setActiveFilters(newFilters);

      const searchOptions = {
        page: 1,
        limit: 20,
        sortBy: "player_rating" as const,
        sortOrder: "desc" as const,
        _filters: {
          ...newFilters,
          ...(searchTerm ? { player_name: searchTerm } : {}),
          ...(selectedNationalities.length > 0
            ? { nationalities: selectedNationalities }
            : {}),
          ...(selectedPositions.length > 0
            ? { positions: selectedPositions }
            : {}),
          ...(selectedTeams.length > 0 ? { teams: selectedTeams } : {}),
          ...(selectedCompetitions.length > 0
            ? { competitions: selectedCompetitions }
            : {}),
        },
      };

      searchPlayersRef.current(searchOptions);
    },
    [searchTerm, selectedNationalities, selectedPositions, selectedTeams, selectedCompetitions, selectedAges]
  );

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setSelectedNationalities([]);
    setSelectedPositions([]);
    setSelectedTeams([]);
    setSelectedCompetitions([]);
    setSelectedAges([]);
  }, []);

  // Manejar toggle de categorías
  const handleCategoryToggle = useCallback((categoryKey: string) => {
    setSelectedCategories((prev) => {
      let newCategories;
      if (prev.includes(categoryKey)) {
        if (prev.length > 1) {
          newCategories = prev.filter((key) => key !== categoryKey);
        } else {
          return prev;
        }
      } else {
        newCategories = [...prev, categoryKey];
      }

      try {
        localStorage.setItem(
          "dashboard-selected-categories",
          JSON.stringify(newCategories)
        );
      } catch (_error) {
        console.error("❌ Error saving categories to localStorage:", error);
      }

      return newCategories;
    });
  }, []);

  return {
    // Estados
    showFilters,
    setShowFilters,
    searchTerm,
    activeTab,
    paymentSuccess,
    selectedCategories,
    activeFilters,
    selectedNationalities,
    selectedPositions,
    selectedTeams,
    selectedCompetitions,
    selectedAges,
    filterOptions,
    
    // Datos derivados
    players,
    loading,
    error,
    filteredPlayers: getFilteredPlayers(),
    tabCounts: getTabCounts(),
    selectedCategoriesData: getSelectedCategoriesData(),
    
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
}