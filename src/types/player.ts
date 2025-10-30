export interface Player {
  id: string;
  id_player: string;
  player_name: string;
  wyscout_id_1?: string | null;
  wyscout_id_2?: string | null;
  wyscout_name_1?: string | null;
  wyscout_name_2?: string | null;
  id_fmi?: string | null;
  player_rating?: number | null;
  photo_coverage?: string | null;
  gallery_photo?: string | null;
  url_trfm_advisor?: string | null;
  url_trfm?: string | null;
  url_secondary?: string | null;
  url_instagram?: string | null;
  complete_player_name?: string | null;
  date_of_birth?: Date | null;
  correct_date_of_birth?: Date | null;
  age?: number | null;
  age_value?: number | null;
  age_value_percent?: number | null;
  age_coeff?: number | null;
  position_player?: string | null;
  correct_position_player?: string | null;
  position_value?: number | null;
  position_value_percent?: number | null;
  foot?: string | null;
  correct_foot?: string | null;
  height?: number | null;
  correct_height?: number | null;
  nationality_1?: string | null;
  correct_nationality_1?: string | null;
  nationality_value?: number | null;
  nationality_value_percent?: number | null;
  nationality_2?: string | null;
  correct_nationality_2?: string | null;
  national_tier?: string | null;
  rename_national_tier?: string | null;
  correct_national_tier?: string | null;
  pre_team?: string | null;
  team_name?: string | null;
  correct_team_name?: string | null;
  team_country?: string | null;
  team_elo?: number | null;
  team_level?: string | null;
  team_level_value?: number | null;
  team_level_value_percent?: number | null;
  team_competition?: string | null;
  competition_country?: string | null;
  team_competition_value?: number | null;
  team_competition_value_percent?: number | null;
  competition_tier?: string | null;
  competition_confederation?: string | null;
  competition_elo?: number | null;
  competition_level?: string | null;
  competition_level_value?: number | null;
  competition_level_value_percent?: number | null;
  owner_club?: string | null;
  owner_club_country?: string | null;
  owner_club_value?: number | null;
  owner_club_value_percent?: number | null;
  pre_team_loan_from?: string | null;
  team_loan_from?: string | null;
  correct_team_loan_from?: string | null;
  on_loan?: boolean | null;
  agency?: string | null;
  correct_agency?: string | null;
  contract_end?: Date | null;
  correct_contract_end?: Date | null;
  player_trfm_value?: number | null;
  player_trfm_value_norm?: number | null;
  stats_evo_3m?: number | null;
  player_rating_norm?: number | null;
  total_fmi_pts_norm?: number | null;
  player_elo?: number | null;
  player_level?: string | null;
  player_ranking?: number | null;
  community_potential?: number | null;
  video?: string | null;
  existing_club?: string | null;
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
  nombre: string;
  posicion: string;
  equipo: string;
  edad: number;
  numeroCamiseta?: number;
  valoracion?: string;
  urlAvatar?: string;
  biografia?: string;
  atributos?: Array<{
    nombre: string;
    valor: string;
  }>;
  nationality?: string;
  height?: number;
  weight?: number;
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