export interface Player {
  id: string;
  id_player: string;
  player_name: string;
  complete_player_name?: string | null;
  date_of_birth?: Date | null;
  correct_date_of_birth?: Date | null;
  age?: number | null;
  position_player?: string | null;
  correct_position_player?: string | null;
  foot?: string | null;
  correct_foot?: string | null;
  height?: number | null;
  correct_height?: number | null;
  nationality_1?: string | null;
  correct_nationality_1?: string | null;
  nationality_2?: string | null;
  correct_nationality_2?: string | null;
  national_tier?: string | null;
  correct_national_tier?: string | null;
  team_name?: string | null;
  correct_team_name?: string | null;
  team_country?: string | null;
  team_level?: string | null;
  team_elo?: number | null;
  team_competition?: string | null;
  competition_country?: string | null;
  competition_tier?: string | null;
  competition_level?: string | null;
  on_loan?: boolean | null;
  owner_club?: string | null;
  owner_club_country?: string | null;
  agency?: string | null;
  correct_agency?: string | null;
  contract_end?: Date | null;
  correct_contract_end?: Date | null;
  player_rating?: number | null;
  player_trfm_value?: number | null;
  previous_trfm_value?: number | null;
  previous_trfm_value_date?: Date | null;
  trfm_value_change_percent?: number | null;
  trfm_value_last_updated?: Date | null;
  // Campos de redes sociales
  facebook_profile?: string | null;
  twitter_profile?: string | null;
  linkedin_profile?: string | null;
  telegram_profile?: string | null;
  instagram_profile?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrearJugadorData {
  name: string;
  position: string;
  team: string;
  age: number;
  nationality?: string;
  height?: number;
  weight?: number;
  // Add other properties as needed
}

export interface PlayerStats {
  totalPlayers: number;
  averageRating: number;
  playersByPosition: Array<{
    position: string;
    count: number;
  }>;
  playersByNationality: Array<{
    nationality: string;
    count: number;
  }>;
  topRatedPlayers: Array<{
    id: string;
    name: string;
    rating: number;
    position: string;
    team: string;
  }>;
}

export interface PlayerSearchResult {
  players: Player[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}