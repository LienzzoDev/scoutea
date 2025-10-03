export interface Scout {
  id_scout: string;
  join_date?: Date | null;
  scout_name?: string | null;
  name?: string | null;
  surname?: string | null;
  date_of_birth?: Date | null;
  age?: number | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  favourite_club?: string | null;
  open_to_work?: boolean | null;
  professional_experience?: string | null;
  twitter_profile?: string | null;
  instagram_profile?: string | null;
  linkedin_profile?: string | null;
  url_profile?: string | null;
  total_reports?: number | null;
  total_reports_norm?: number | null;
  total_reports_rank?: number | null;
  original_reports?: number | null;
  original_reports_norm?: number | null;
  original_reports_rank?: number | null;
  nationality_expertise?: string | null;
  competition_expertise?: string | null;
  avg_potential?: number | null;
  avg_initial_age?: number | null;
  avg_initial_age_norm?: number | null;
  
  // Economic fields with history
  total_investment?: number | null;
  total_investment_rank?: number | null;
  total_investment_orig?: number | null;
  total_investment_orig_rank?: number | null;
  previous_total_investment?: number | null;
  previous_total_investment_date?: Date | null;
  total_investment_change_percent?: number | null;
  total_investment_last_updated?: Date | null;
  
  net_profits?: number | null;
  net_profits_rank?: number | null;
  net_profits_orig?: number | null;
  net_profits_orig_rank?: number | null;
  previous_net_profits?: number | null;
  previous_net_profits_date?: Date | null;
  net_profits_change_percent?: number | null;
  net_profits_last_updated?: Date | null;
  
  roi?: number | null;
  roi_norm?: number | null;
  roi_rank?: number | null;
  roi_orig?: number | null;
  roi_orig_rank?: number | null;
  previous_roi?: number | null;
  previous_roi_date?: Date | null;
  roi_change_percent?: number | null;
  roi_last_updated?: Date | null;
  
  avg_initial_trfm_value?: number | null;
  avg_initial_trfm_value_rank?: number | null;
  avg_initial_trfm_value_orig?: number | null;
  avg_initial_trfm_value_orig_rank?: number | null;
  previous_avg_initial_trfm_value?: number | null;
  previous_avg_initial_trfm_value_date?: Date | null;
  avg_initial_trfm_value_change_percent?: number | null;
  avg_initial_trfm_value_last_updated?: Date | null;
  
  max_profit_report?: number | null;
  max_profit_report_rank?: number | null;
  previous_max_profit_report?: number | null;
  previous_max_profit_report_date?: Date | null;
  max_profit_report_change_percent?: number | null;
  max_profit_report_last_updated?: Date | null;
  
  min_profit_report?: number | null;
  min_profit_report_rank?: number | null;
  previous_min_profit_report?: number | null;
  previous_min_profit_report_date?: Date | null;
  min_profit_report_change_percent?: number | null;
  min_profit_report_last_updated?: Date | null;
  
  avg_profit_report?: number | null;
  avg_profit_report_norm?: number | null;
  avg_profit_report_rank?: number | null;
  avg_profit_report_orig?: number | null;
  avg_profit_report_orig_rank?: number | null;
  previous_avg_profit_report?: number | null;
  previous_avg_profit_report_date?: Date | null;
  avg_profit_report_change_percent?: number | null;
  avg_profit_report_last_updated?: Date | null;
  
  transfer_team_pts?: number | null;
  transfer_team_pts_norm?: number | null;
  transfer_team_pts_rank?: number | null;
  transfer_team_pts_orig?: number | null;
  transfer_team_pts_orig_rank?: number | null;
  previous_transfer_team_pts?: number | null;
  previous_transfer_team_pts_date?: Date | null;
  transfer_team_pts_change_percent?: number | null;
  transfer_team_pts_last_updated?: Date | null;
  
  avg_initial_team_elo?: number | null;
  avg_initial_team_level?: string | null;
  
  transfer_competition_pts?: number | null;
  transfer_competition_pts_norm?: number | null;
  transfer_competition_pts_rank?: number | null;
  transfer_competition_pts_orig?: number | null;
  transfer_competition_pts_orig_rank?: number | null;
  previous_transfer_competition_pts?: number | null;
  previous_transfer_competition_pts_date?: Date | null;
  transfer_competition_pts_change_percent?: number | null;
  transfer_competition_pts_last_updated?: Date | null;
  
  avg_initial_competition_elo?: number | null;
  avg_initial_competition_level?: string | null;
  scout_elo?: number | null;
  scout_level?: string | null;
  scout_ranking?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoutSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: {
    search?: string;
    nationality?: string;
    country?: string;
    scout_level?: string;
    open_to_work?: boolean;
    min_age?: number;
    max_age?: number;
    min_scout_elo?: number;
    max_scout_elo?: number;
  };
}

export interface ScoutSearchResult {
  scouts: Scout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ScoutStats {
  totalScouts: number;
  averageRating: number;
  topScouts: Scout[];
}