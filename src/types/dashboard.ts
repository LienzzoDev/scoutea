/**
 * Tipos para el Dashboard State
 * Reemplaza los tipos genéricos y 'any' por tipos específicos
 */

export interface PlayerData {
  id?: string;
  id_player: string;
  player_name?: string;
  name?: string;
  nationality_1?: string;
  nationality?: string;
  position_player?: string;
  position?: string;
  team_name?: string;
  team?: string;
  team_competition?: string;
  competition?: string;
  age?: number;
  player_rating?: number;
  rating?: number;
  height?: number;
  correct_foot?: string;
  foot?: string;
  player_trfm_value?: number;
  market_value?: number;
  correct_date_of_birth?: string | Date;
  date_of_birth?: string | Date;
  birth_date?: string | Date;
  contract_expires?: string | Date;
  on_loan?: boolean;
  goals?: number;
  assists?: number;
  matches_played?: number;
  games?: number;
  minutes_played?: number;
  minutes?: number;
  team_country?: string;
  country?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlayerFilters {
  min_age?: number;
  max_age?: number;
  min_rating?: number;
  max_rating?: number;
  min_value?: number;
  max_value?: number;
  nationalities?: string[];
  positions?: string[];
  teams?: string[];
  competitions?: string[];
  player_name?: string;
  position_player?: string;
  team_name?: string;
  nationality_1?: string;
  on_loan?: boolean;
}

export interface FilterOptions {
  nationalities: string[];
  positions: string[];
  teams: string[];
  competitions: string[];
  ages: string[];
}

export interface Category {
  key: string;
  label: string;
  enabled: boolean;
  getValue: (player: PlayerData) => string | number | null | undefined;
}

export interface TabCounts {
  all: number;
  list: number;
  news: number;
}

export interface DashboardState {
  // Estados básicos
  showFilters: boolean;
  searchTerm: string;
  activeTab: string;
  paymentSuccess: boolean;
  selectedCategories: string[];
  activeFilters: PlayerFilters;
  selectedNationalities: string[];
  selectedPositions: string[];
  selectedTeams: string[];
  selectedCompetitions: string[];
  selectedAges: string[];
  filterOptions: FilterOptions;
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Estados de datos
  loading: boolean;
  error: string | null;
  filteredPlayers: PlayerData[];
  tabCounts: TabCounts;
  selectedCategoriesData: Category[];

  // Funciones
  setShowFilters: (show: boolean) => void;
  handleSearch: (term: string) => void;
  handleTabChange: (tab: string) => void;
  handleCategoryToggle: (categoryId: string) => void;
  applyFilters: (filters: PlayerFilters) => void;
  clearFilters: () => void;
  handleSort: (categoryKey: string) => void;
  setSelectedNationalities: (values: string[]) => void;
  setSelectedPositions: (values: string[]) => void;
  setSelectedTeams: (values: string[]) => void;
  setSelectedCompetitions: (values: string[]) => void;
  setSelectedAges: (values: string[]) => void;

  // Player list functions
  addToList: (playerId: string) => Promise<boolean>;
  removeFromList: (playerId: string) => Promise<boolean>;
  isInList: (playerId: string) => boolean;

  // Constants
  AVAILABLE_CATEGORIES: Category[];
}
