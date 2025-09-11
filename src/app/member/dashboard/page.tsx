"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Bookmark,
  ArrowRight,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MemberNavbar from "@/components/member-navbar";
import { usePlayers, Player } from "@/hooks/usePlayers";
import { usePlayerList } from "@/hooks/usePlayerList";
import BookmarkButton from "@/components/bookmark-button";
import PlayerAvatar from "@/components/player-avatar";
import CategorySelector from "@/components/category-selector";
import MultiSelectFilter from "@/components/multi-select-filter";
import RangeFilter from "@/components/range-filter";
import ToggleFilter from "@/components/toggle-filter";

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

export default function MemberDashboard() {
  const router = useRouter();
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
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>(
    []
  );
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>(
    []
  );
  const [filterOptions, setFilterOptions] = useState<any>({
    nationalities: [],
    positions: [],
    teams: [],
    competitions: [],
  });

  // Referencias para scroll sincronizado
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const rowScrollRefs = useRef<HTMLDivElement[]>([]);

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
    const plan = searchParams.get("plan");

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

  // Filtrar jugadores según la pestaña activa y filtros aplicados
  const getFilteredPlayers = () => {
    if (!players || players.length === 0) {
      rowScrollRefs.current = [];
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

    // Aplicar filtro de búsqueda por texto (multi-campo mejorado)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((player) => {
        return (
          // Nombre del jugador
          player.player_name?.toLowerCase().includes(searchLower) ||
          player.complete_player_name?.toLowerCase().includes(searchLower) ||
          // ID del jugador
          player.id_player?.toString().includes(searchLower) ||
          // Nacionalidad
          player.nationality_1?.toLowerCase().includes(searchLower) ||
          player.nationality_2?.toLowerCase().includes(searchLower) ||
          // Posición
          player.position_player?.toLowerCase().includes(searchLower) ||
          // Equipo
          player.team_name?.toLowerCase().includes(searchLower) ||
          player.owner_club?.toLowerCase().includes(searchLower) ||
          // Competición
          player.team_competition?.toLowerCase().includes(searchLower) ||
          // País del equipo
          player.team_country?.toLowerCase().includes(searchLower) ||
          // Agencia
          player.agency?.toLowerCase().includes(searchLower) ||
          // Pie hábil
          player.foot?.toLowerCase().includes(searchLower) ||
          // Edad (búsqueda por número)
          player.age?.toString().includes(searchTerm.trim())
        );
      });
    }

    return filtered;
  };

  const filteredPlayers = getFilteredPlayers();

  // Calcular conteos para las pestañas
  const tabCounts = {
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
    [searchPlayers, players]
  );

  // Función para cambiar de pestaña optimizada
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearchTerm("");
  }, []);

  // Función para obtener categorías seleccionadas
  const getSelectedCategoriesData = () => {
    return AVAILABLE_CATEGORIES.filter((cat) =>
      selectedCategories.includes(cat.key)
    );
  };

  // Función para manejar scroll sincronizado
  const handleScroll = (scrollLeft: number) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }
    rowScrollRefs.current.forEach((ref) => {
      if (ref) {
        ref.scrollLeft = scrollLeft;
      }
    });
  };

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
          positions: [
            "GK",
            "CB",
            "LB",
            "RB",
            "CDM",
            "CM",
            "CAM",
            "LW",
            "RW",
            "ST",
          ],
          teams: ["Real Madrid", "Barcelona", "Atletico Madrid", "Valencia"],
          competitions: ["La Liga", "Premier League", "Serie A", "Bundesliga"],
        };
        setFilterOptions(fallbackOptions);
      }
    } catch (error) {
      const fallbackOptions = {
        nationalities: ["Spain", "Brazil", "Argentina", "France", "Germany"],
        positions: [
          "GK",
          "CB",
          "LB",
          "RB",
          "CDM",
          "CM",
          "CAM",
          "LW",
          "RW",
          "ST",
        ],
        teams: ["Real Madrid", "Barcelona", "Atletico Madrid", "Valencia"],
        competitions: ["La Liga", "Premier League", "Serie A", "Bundesliga"],
      };
      setFilterOptions(fallbackOptions);
    }
  }, []);

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
    [searchPlayers, searchTerm]
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

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      {/* Mensaje de pago exitoso */}
      {paymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ¡Pago completado exitosamente!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Tu suscripción ha sido activada correctamente.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Wonderkids</span>
          <span>›</span>
          <span className="text-[#000000]">Players</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">Players</h1>

        {/* Selector de Categorías */}
        <CategorySelector
          title="Display Categories"
          categories={AVAILABLE_CATEGORIES}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          minCategories={1}
          storageKey="dashboard-selected-categories"
        />

        {/* Tabs and Search */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <button
              className={`pb-2 flex items-center gap-2 ${
                activeTab === "all"
                  ? "text-[#000000] font-medium border-b-2 border-[#000000]"
                  : "text-[#6d6d6d]"
              }`}
              onClick={() => handleTabChange("all")}
            >
              All
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === "all"
                    ? "bg-[#000000] text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tabCounts.all}
              </span>
            </button>
            <button
              className={`pb-2 flex items-center gap-2 ${
                activeTab === "news"
                  ? "text-[#000000] font-medium border-b-2 border-[#000000]"
                  : "text-[#6d6d6d]"
              }`}
              onClick={() => handleTabChange("news")}
            >
              New players
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === "news"
                    ? "bg-[#000000] text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tabCounts.news}
              </span>
            </button>
            <button
              className={`pb-2 flex items-center gap-2 ${
                activeTab === "list"
                  ? "text-[#000000] font-medium border-b-2 border-[#000000]"
                  : "text-[#6d6d6d]"
              }`}
              onClick={() => handleTabChange("list")}
            >
              Your list
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === "list"
                    ? "bg-[#000000] text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tabCounts.list}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, nacionalidad, equipo, posición..."
                className="pl-10 w-80 bg-[#ffffff] border-[#e7e7e7]"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className={`flex items-center gap-2 border-[#e7e7e7] transition-all duration-200 ${
                showFilters
                  ? "bg-[#8c1a10]/10 text-[#8c1a10] border-[#8c1a10]/30"
                  : "text-[#6d6d6d] bg-transparent"
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 text-[#8c1a10]" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
            <span className="ml-3 text-[#6d6d6d] mt-2">
              {searchTerm
                ? `Buscando "${searchTerm}"...`
                : "Cargando jugadores..."}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-600">
              Error al cargar los jugadores: {error}
            </p>
          </div>
        )}

        {/* Players List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#6d6d6d] text-lg">
                  {activeTab === "list"
                    ? "No tienes jugadores en tu lista"
                    : activeTab === "news"
                    ? "No hay jugadores nuevos en los últimos 7 días"
                    : searchTerm
                    ? `No se encontraron jugadores para "${searchTerm}"`
                    : "No se encontraron jugadores"}
                </p>
                <p className="text-[#6d6d6d] text-sm mt-2">
                  {searchTerm
                    ? "Intenta con otros términos de búsqueda"
                    : "No hay jugadores disponibles en este momento"}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => handleSearch("")}
                    className="mt-4 px-4 py-2 bg-[#8c1a10] text-white rounded-lg hover:bg-[#6d1410] transition-colors"
                  >
                    Ver todos los jugadores
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#e7e7e7] overflow-hidden">
                {/* HEADER */}
                <div className="bg-[#f8f9fa] border-b border-[#e7e7e7] flex">
                  {/* Columna fija - Player Info */}
                  <div className="w-80 p-4 border-r border-[#e7e7e7] flex-shrink-0">
                    <h4 className="font-semibold text-[#6d6d6d] text-sm">
                      Player Info
                    </h4>
                  </div>

                  {/* Headers scrolleables */}
                  <div
                    ref={headerScrollRef}
                    className="flex-1 overflow-x-auto scrollbar-hide"
                    onScroll={(e) => handleScroll(e.currentTarget.scrollLeft)}
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div
                      className="flex"
                      style={{
                        minWidth: `${Math.max(
                          getSelectedCategoriesData().length * 140,
                          100
                        )}px`,
                      }}
                    >
                      {getSelectedCategoriesData().map(
                        (category, index, array) => (
                          <div
                            key={category.key}
                            className="p-4 text-center border-r border-[#e7e7e7] last:border-r-0 flex-shrink-0"
                            style={{
                              minWidth: "140px",
                              width:
                                array.length <= 4
                                  ? `${100 / array.length}%`
                                  : "140px",
                            }}
                          >
                            <h4 className="font-semibold text-[#6d6d6d] text-sm">
                              {category.label}
                            </h4>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Columna fija - Actions */}
                  <div className="w-20 p-4 text-center border-l border-[#e7e7e7] flex-shrink-0">
                    <h4 className="font-semibold text-[#6d6d6d] text-sm">
                      Actions
                    </h4>
                  </div>
                </div>

                {/* FILAS DE JUGADORES */}
                <div className="divide-y divide-[#e7e7e7]">
                  {filteredPlayers.map((player, index) => (
                    <div
                      key={player.id_player}
                      className="flex cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        router.push(`/member/player/${player.id_player}`)
                      }
                    >
                      {/* Columna fija - Player Info */}
                      <div className="w-80 p-4 border-r border-[#e7e7e7] flex-shrink-0">
                        <div className="flex items-center gap-4">
                          <PlayerAvatar player={player} size="md" />
                          <div>
                            <h3 className="font-semibold text-[#000000]">
                              {player.player_name}
                            </h3>
                            <p className="text-[#6d6d6d] text-sm">
                              {player.age ? `${player.age} años` : "Edad N/A"} •{" "}
                              {player.nationality_1 || "Nacionalidad N/A"}
                            </p>
                            {player.position_player && (
                              <p className="text-[#8c1a10] text-xs font-medium mt-1">
                                {player.position_player}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Valores scrolleables */}
                      <div
                        ref={(el) => {
                          if (el) rowScrollRefs.current[index] = el;
                        }}
                        className="flex-1 overflow-x-auto scrollbar-hide"
                        onScroll={(e) =>
                          handleScroll(e.currentTarget.scrollLeft)
                        }
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        <div
                          className="flex"
                          style={{
                            minWidth: `${Math.max(
                              getSelectedCategoriesData().length * 140,
                              100
                            )}px`,
                          }}
                        >
                          {getSelectedCategoriesData().map(
                            (category, catIndex, array) => {
                              const value = category.getValue(player);
                              const formattedValue = category.format
                                ? category.format(value)
                                : value || "N/A";

                              return (
                                <div
                                  key={category.key}
                                  className="p-4 text-center border-r border-[#e7e7e7] last:border-r-0 flex-shrink-0"
                                  style={{
                                    minWidth: "140px",
                                    width:
                                      array.length <= 4
                                        ? `${100 / array.length}%`
                                        : "140px",
                                  }}
                                >
                                  <p className="font-medium text-[#000000]">
                                    {formattedValue}
                                  </p>
                                  {category.key === "competition" &&
                                    player.team_name && (
                                      <p className="text-[#6d6d6d] text-xs mt-1 truncate">
                                        {player.team_name}
                                      </p>
                                    )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Columna fija - Actions */}
                      <div className="w-20 p-4 text-center border-l border-[#e7e7e7] flex-shrink-0">
                        <div className="flex items-center justify-center gap-2">
                          <BookmarkButton
                            entityId={player.id_player}
                            isBookmarked={isInList(player.id_player)}
                            onToggle={async (playerId) => {
                              if (isInList(playerId)) {
                                return await removeFromList(playerId);
                              } else {
                                return await addToList(playerId);
                              }
                            }}
                          />
                          <ArrowRight
                            className="w-4 h-4 text-[#8c1a10] cursor-pointer hover:text-[#8c1a10]/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/member/player/${player.id_player}`);
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
  );
}
