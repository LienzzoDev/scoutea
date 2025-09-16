"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import { usePlayerList } from "@/hooks/player/usePlayerList";
import { usePlayers } from "@/hooks/player/usePlayers";
import type { Player } from "@/types/player";

// 🎯 CATEGORÍAS DISPONIBLES PARA MOSTRAR
const AVAILABLE_CATEGORIES = [
  {
    key: "rating",
    label: "Rating",
    getValue: (player: Player) => player.player_rating,
    format: (value: any) => (value ? `${value}/100` : "N/A"),
  },
  {
    key: "age",
    label: "Age",
    getValue: (player: Player) => player.age,
    format: (value: any) => (value ? `${value} años` : "N/A"),
  },
  {
    key: "position",
    label: "Position",
    getValue: (player: Player) => player.position_player,
  },
  {
    key: "team",
    label: "Team",
    getValue: (player: Player) => player.team_name,
  },
  {
    key: "competition",
    label: "Competition",
    getValue: (player: Player) => player.team_competition,
  },
  {
    key: "nationality",
    label: "Nationality",
    getValue: (player: Player) => player.nationality_1,
  },
  {
    key: "contract_end",
    label: "Contract End",
    getValue: (player: Player) => player.contract_end,
    format: (value: any) => {
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
    key: "market_value",
    label: "Market Value",
    getValue: (player: Player) => player.player_trfm_value,
    format: (value: any) => {
      if (!value) return "N/A";
      if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
      return `€${value}`;
    },
  },
  {
    key: "height",
    label: "Height",
    getValue: (player: Player) => player.height,
    format: (value: any) => (value ? `${value} cm` : "N/A"),
  },
  {
    key: "agency",
    label: "Agency",
    getValue: (player: Player) => player.agency,
  },
  { key: "foot", label: "Foot", getValue: (player: Player) => player.foot },
  {
    key: "loan_status",
    label: "Loan Status",
    getValue: (player: Player) => (player.on_loan ? "En Préstamo" : "Propio"),
  },
];

export function useDashboardState() {
  const searchParams = useSearchParams();

  // Estados básicos
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Estados para categorías seleccionadas
  const defaultCategories = ["rating", "age", "position", "team"];
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(defaultCategories);

  // Estados para filtros
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>({
    nationalities: [],
    positions: [],
    teams: [],
    competitions: [],
  });

  // Hooks
  const { players, loading, error, searchPlayers, pagination } = usePlayers();
  const { playerList, addToList, removeFromList, isInList } = usePlayerList();

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
      } catch (error) {
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
    const initialSearchOptions = {
      page: 1,
      limit: 20,
      sortBy: "player_rating" as const,
      sortOrder: "desc" as const,
      filters: {},
    };

    searchPlayers(initialSearchOptions);
    loadFilterOptions();
  }, []);

  // Cargar opciones de filtros
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await fetch("/api/players/filters");
      if (response.ok) {
        const options = await response.json();
        setFilterOptions(options);
      } else {
        const fallbackOptions = {
          nationalities: ["Spain", "Brazil", "Argentina", "France", "Germany"],
          positions: ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"],
          teams: ["Real Madrid", "Barcelona", "Atletico Madrid", "Valencia"],
          competitions: ["La Liga", "Premier League", "Serie A", "Bundesliga"],
        };
        setFilterOptions(fallbackOptions);
      }
    } catch (error) {
      const fallbackOptions = {
        nationalities: ["Spain", "Brazil", "Argentina", "France", "Germany"],
        positions: ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"],
        teams: ["Real Madrid", "Barcelona", "Atletico Madrid", "Valencia"],
        competitions: ["La Liga", "Premier League", "Serie A", "Bundesliga"],
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

    return filtered;
  }, [players, activeTab, searchTerm, isInList]);

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
          filters: { player_name: term.trim() },
        };

        searchPlayers(searchOptions);
      }
    },
    [searchPlayers]
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
    (newFilters: any) => {
      setActiveFilters(newFilters);

      const searchOptions = {
        page: 1,
        limit: 20,
        sortBy: "player_rating" as const,
        sortOrder: "desc" as const,
        filters: {
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

      searchPlayers(searchOptions);
    },
    [searchPlayers, searchTerm, selectedNationalities, selectedPositions, selectedTeams, selectedCompetitions]
  );

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setSelectedNationalities([]);
    setSelectedPositions([]);
    setSelectedTeams([]);
    setSelectedCompetitions([]);
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
      } catch (error) {
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
    
    // Player list functions
    addToList,
    removeFromList,
    isInList,
    
    // Constants
    AVAILABLE_CATEGORIES,
  };
}