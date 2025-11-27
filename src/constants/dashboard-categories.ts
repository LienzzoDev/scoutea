export interface Category {
  key: string
  label: string
  enabled?: boolean
  getValue?: (player: Record<string, unknown>) => unknown
}

export interface CategoryGroup {
  groupName: string
  categories: Category[]
  subgroups?: CategoryGroup[]
}

// Helper function to create a default getValue function based on the key
const defaultGetValue = (key: string) => (player: Record<string, unknown>) => player[key] || 'N/A';

// Helper function to add getValue to categories that don't have it
const ensureGetValue = (category: Category): Category => {
  if (!category.getValue) {
    return { ...category, getValue: defaultGetValue(category.key) };
  }
  return category;
};

// Helper to process groups recursively
const processGroup = (group: CategoryGroup): CategoryGroup => ({
  ...group,
  categories: group.categories.map(ensureGetValue),
  subgroups: group.subgroups?.map(processGroup)
});

export const DASHBOARD_CATEGORY_GROUPS: CategoryGroup[] = [
  // PASSPORT
  {
    groupName: 'PASSPORT',
    categories: [
      {
        key: 'birth_date',
        label: 'Date of birth',
        getValue: (player: Record<string, unknown>) => {
          const date = player.correct_date_of_birth || player.date_of_birth || player.birth_date;
          return date ? new Date(date as string).toLocaleDateString('es-ES') : 'N/A';
        }
      },
      {
        key: 'age',
        label: 'Age',
        getValue: (player: Record<string, unknown>) => player.age
      },
      {
        key: 'position',
        label: 'Position',
        getValue: (player: Record<string, unknown>) => player.position_player || player.position
      },
      {
        key: 'foot',
        label: 'Foot',
        getValue: (player: Record<string, unknown>) => player.correct_foot || player.foot
      },
      {
        key: 'height',
        label: 'Height',
        getValue: (player: Record<string, unknown>) => player.height ? `${player.height} cm` : 'N/A'
      },
      {
        key: 'nationality_1',
        label: 'Nationality 1',
        getValue: (player: Record<string, unknown>) => player.nationality_1 || player.nationality
      },
      {
        key: 'nationality_2',
        label: 'Nationality 2',
        getValue: (player: Record<string, unknown>) => player.nationality_2 || 'N/A'
      },
      {
        key: 'national_tier',
        label: 'National tier',
        getValue: (player: Record<string, unknown>) => player.national_tier || 'N/A'
      },
      {
        key: 'player_elo',
        label: 'Player ELO',
        getValue: (player: Record<string, unknown>) => player.player_elo || player.elo || 'N/A'
      },
      {
        key: 'player_ranking',
        label: 'Player Ranking',
        getValue: (player: Record<string, unknown>) => player.player_ranking || player.ranking || 'N/A'
      },
      {
        key: 'player_level',
        label: 'Player Level',
        getValue: (player: Record<string, unknown>) => player.player_level || player.level || 'N/A'
      },
      {
        key: 'community_potential',
        label: 'Community Potential',
        getValue: (player: Record<string, unknown>) => player.community_potential || 'N/A'
      },
    ]
  },

  // CONTRACT
  {
    groupName: 'CONTRACT',
    categories: [
      {
        key: 'owner_club',
        label: 'Owner club',
        getValue: (player: Record<string, unknown>) => player.owner_club || 'N/A'
      },
      {
        key: 'owner_club_country',
        label: 'Owner club country',
        getValue: (player: Record<string, unknown>) => player.owner_club_country || 'N/A'
      },
      {
        key: 'team',
        label: 'Team',
        getValue: (player: Record<string, unknown>) => player.team_name || player.team
      },
      {
        key: 'team_country',
        label: 'Team country',
        getValue: (player: Record<string, unknown>) => player.team_country || player.country || 'N/A'
      },
      {
        key: 'team_level',
        label: 'Team level',
        getValue: (player: Record<string, unknown>) => player.team_level || 'N/A'
      },
      {
        key: 'on_loan',
        label: 'On loan',
        getValue: (player: Record<string, unknown>) => player.on_loan ? 'Yes' : 'No'
      },
      {
        key: 'competition',
        label: 'Competition',
        getValue: (player: Record<string, unknown>) => player.team_competition || player.competition
      },
      {
        key: 'competition_country',
        label: 'Competition country',
        getValue: (player: Record<string, unknown>) => player.competition_country || 'N/A'
      },
      {
        key: 'competition_tier',
        label: 'Competition tier',
        getValue: (player: Record<string, unknown>) => player.competition_tier || 'N/A'
      },
      {
        key: 'competition_confederation',
        label: 'Competition confederation',
        getValue: (player: Record<string, unknown>) => player.competition_confederation || 'N/A'
      },
      {
        key: 'competition_level',
        label: 'Competition level',
        getValue: (player: Record<string, unknown>) => player.competition_level || 'N/A'
      },
      {
        key: 'agency',
        label: 'Agency',
        getValue: (player: Record<string, unknown>) => player.agency || 'N/A'
      },
      {
        key: 'contract_end',
        label: 'Contract end',
        getValue: (player: Record<string, unknown>) => {
          const date = player.contract_expires || player.contract_end;
          return date ? new Date(date as string).toLocaleDateString('es-ES') : 'N/A';
        }
      },
      {
        key: 'trfm_value',
        label: 'TRFM value',
        getValue: (player: Record<string, unknown>) => {
          const value = player.player_trfm_value || player.trfm_value || player.market_value;
          if (!value) return 'N/A';
          const numValue = typeof value === 'string' ? parseFloat(value) : (value as number);
          return `€${numValue.toFixed(2)}M`;
        }
      },
    ]
  },

  // STATS
  {
    groupName: 'STATS',
    categories: [],
    subgroups: [
      // 1. General
      {
        groupName: '1. General',
        categories: [],
        subgroups: [
          {
            groupName: '1.1 General Stats (3M)',
            categories: [
              { key: 'matches_played_tot_3m', label: 'Matches played (TOT)', getValue: (p: Record<string, unknown>) => p.matches_played_tot_3m || 0 },
              { key: 'minutes_played_tot_3m', label: 'Minutes played (TOT)', getValue: (p: Record<string, unknown>) => p.minutes_played_tot_3m || 0 },
              { key: 'goals_p90_3m', label: 'Goals (P90)', getValue: (p: Record<string, unknown>) => p.goals_p90_3m || 0 },
              { key: 'goals_tot_3m', label: 'Goals (TOT)', getValue: (p: Record<string, unknown>) => p.goals_tot_3m || 0 },
              { key: 'assists_p90_3m', label: 'Assists (P90)', getValue: (p: Record<string, unknown>) => p.assists_p90_3m || 0 },
              { key: 'assists_tot_3m', label: 'Assists (TOT)', getValue: (p: Record<string, unknown>) => p.assists_tot_3m || 0 },
              { key: 'yellow_cards_p90_3m', label: 'Yellow cards (P90)', getValue: (p: Record<string, unknown>) => p.yellow_cards_p90_3m || 0 },
              { key: 'yellow_cards_tot_3m', label: 'Yellow cards (TOT)', getValue: (p: Record<string, unknown>) => p.yellow_cards_tot_3m || 0 },
              { key: 'red_cards_p90_3m', label: 'Red cards (P90)', getValue: (p: Record<string, unknown>) => p.red_cards_p90_3m || 0 },
              { key: 'red_cards_tot_3m', label: 'Red cards (TOT)', getValue: (p: Record<string, unknown>) => p.red_cards_tot_3m || 0 },
            ]
          },
        ]
      },

      // 2. Goalkeeping
      {
        groupName: '2. Goalkeeping',
        categories: [
          { key: 'conceded_goals_p90_3m', label: 'Conceded goals (P90)' },
          { key: 'conceded_goals_tot_3m', label: 'Conceded goals (TOT)' },
          { key: 'prevented_goals_p90_3m', label: 'Prevented goals (P90)' },
          { key: 'prevented_goals_tot_3m', label: 'Prevented goals (TOT)' },
          { key: 'shots_against_p90_3m', label: 'Shots against (P90)' },
          { key: 'shots_against_tot_3m', label: 'Shots against (TOT)' },
          { key: 'clean_sheets_tot_3m', label: 'Clean sheets (TOT)' },
          { key: 'clean_sheets_percent_3m', label: 'Clean sheets (%)' },
          { key: 'save_rate_percent_3m', label: 'Save rate (%)' },
        ]
      },

      // 3. Defending
      {
        groupName: '3. Defending',
        categories: [
          { key: 'tackles_p90_3m', label: 'Tackles (P90)' },
          { key: 'tackles_tot_3m', label: 'Tackles (TOT)' },
          { key: 'interceptions_p90_3m', label: 'Interceptions (P90)' },
          { key: 'interceptions_tot_3m', label: 'Interceptions (TOT)' },
          { key: 'fouls_p90_3m', label: 'Fouls (P90)' },
          { key: 'fouls_tot_3m', label: 'Fouls (TOT)' },
        ]
      },

      // 4. Passing
      {
        groupName: '4. Passing',
        categories: [
          { key: 'passes_p90_3m', label: 'Passes (P90)' },
          { key: 'passes_tot_3m', label: 'Passes (TOT)' },
          { key: 'forward_passes_p90_3m', label: 'Forward passes (P90)' },
          { key: 'forward_passes_tot_3m', label: 'Forward passes (TOT)' },
          { key: 'crosses_p90_3m', label: 'Crosses (P90)' },
          { key: 'crosses_tot_3m', label: 'Crosses (TOT)' },
          { key: 'accurate_passes_percent_3m', label: 'Accurate passes (%)' },
        ]
      },

      // 5. Finishing
      {
        groupName: '5. Finishing',
        categories: [
          { key: 'shots_p90_3m', label: 'Shots (P90)' },
          { key: 'shots_tot_3m', label: 'Shots (TOT)' },
          { key: 'effectiveness_percent_3m', label: 'Effectiveness (%)' },
        ]
      },

      // 6. 1vs1
      {
        groupName: '6. 1vs1',
        categories: [
          { key: 'off_duels_p90_3m', label: 'Off duels (P90)' },
          { key: 'off_duels_tot_3m', label: 'Off duels (TOT)' },
          { key: 'off_duels_won_percent_3m', label: 'Off duels won (%)' },
          { key: 'def_duels_p90_3m', label: 'Def duels (P90)' },
          { key: 'def_duels_tot_3m', label: 'Def duels (TOT)' },
          { key: 'def_duels_won_percent_3m', label: 'Def duels won (%)' },
          { key: 'aerials_duels_p90_3m', label: 'Aerial duels (P90)' },
          { key: 'aerials_duels_tot_3m', label: 'Aerial duels (TOT)' },
          { key: 'aerials_duels_won_percent_3m', label: 'Aerial duels won (%)' },
        ]
      },
    ]
  },

  // ON THE PITCH
  {
    groupName: 'ON THE PITCH',
    categories: [
      { key: 'goalkeeper_fmi', label: 'Goalkeeper' },
      { key: 'defender_right_fmi', label: 'Defender right' },
      { key: 'defender_central_fmi', label: 'Defender central' },
      { key: 'defender_left_fmi', label: 'Defender left' },
      { key: 'wing_back_right_fmi', label: 'Wing back right' },
      { key: 'defensive_midfielder_fmi', label: 'Defensive midfielder' },
      { key: 'wing_back_left_fmi', label: 'Wing back left' },
      { key: 'midfielder_right_fmi', label: 'Midfielder right' },
      { key: 'midfielder_central_fmi', label: 'Midfielder central' },
      { key: 'midfielder_left_fmi', label: 'Midfielder left' },
      { key: 'attacking_mid_right_fmi', label: 'Attacking mid right' },
      { key: 'attacking_mid_central_fmi', label: 'Attacking mid central' },
      { key: 'attacking_mid_left_fmi', label: 'Attacking mid left' },
      { key: 'striker_fmi', label: 'Striker' },
    ]
  },

  // PLAYER ROLE
  {
    groupName: 'PLAYER ROLE',
    categories: [
      { key: 'gk_dominator', label: 'GK Dominator' },
      { key: 'gk_reactive', label: 'GK Reactive' },
      { key: 'gk_initiator', label: 'GK Initiator' },
      { key: 'central_def_aggressor', label: 'Central Def Aggressor' },
      { key: 'central_def_spreader', label: 'Central Def Spreader' },
      { key: 'central_def_anchor', label: 'Central Def Anchor' },
      { key: 'wide_def_overlapper', label: 'Wide Def Overlapper' },
      { key: 'wide_def_progressor', label: 'Wide Def Progressor' },
      { key: 'wide_def_safety', label: 'Wide Def Safety' },
      { key: 'deep_mid_box_to_box', label: 'Deep Mid Box to Box' },
      { key: 'deep_mid_distributor', label: 'Deep Mid Distributor' },
      { key: 'deep_mid_builder', label: 'Deep Mid Builder' },
      { key: 'advanced_mid_box_crasher', label: 'Advanced Mid Box Crasher' },
      { key: 'advanced_mid_creator', label: 'Advanced Mid Creator' },
      { key: 'advanced_mid_orchestrator', label: 'Advanced Mid Orchestrator' },
      { key: 'wide_att_outlet', label: 'Wide Att Outlet' },
      { key: 'wide_att_unlocker', label: 'Wide Att Unlocker' },
      { key: 'wide_att_threat', label: 'Wide Att Threat' },
      { key: 'central_att_roamer', label: 'Central Att Roamer' },
      { key: 'central_att_target', label: 'Central Att Target' },
      { key: 'central_att_finisher', label: 'Central Att Finisher' },
    ]
  },

  // IN PLAY
  {
    groupName: 'IN PLAY',
    categories: [
      { key: 'transition', label: 'Transition' },
      { key: 'keeping_the_ball', label: 'Keeping the Ball' },
      { key: 'progression', label: 'Progression' },
      { key: 'finishing_archetype', label: 'Finishing' },
      { key: 'set_piece', label: 'Set Piece' },
      { key: 'aerial_play', label: 'Aerial Play' },
      { key: 'ball_recovery', label: 'Ball Recovery' },
      { key: 'defensive_shape', label: 'Defensive Shape' },
      { key: 'goal_saving', label: 'Goal Saving' },
    ]
  },

  // PLAY MODE
  {
    groupName: 'PLAY MODE',
    categories: [
      { key: 'positional_att_tendency', label: 'Positional Att Tendency' },
      { key: 'positional_att_dominance', label: 'Positional Att Dominance' },
      { key: 'direct_att_tendency', label: 'Direct Att Tendency' },
      { key: 'direct_att_dominance', label: 'Direct Att Dominance' },
      { key: 'low_block_def_tendency', label: 'Low Block Def Tendency' },
      { key: 'low_block_def_dominance', label: 'Low Block Def Dominance' },
      { key: 'high_block_def_tendency', label: 'High Block Def Tendency' },
      { key: 'high_block_def_dominance', label: 'High Block Def Dominance' },
      { key: 'influence_off_tendency', label: 'Off Influence Tendency' },
      { key: 'influence_off_dominance', label: 'Off Influence Dominance' },
      { key: 'influence_def_tendency', label: 'Def Influence Tendency' },
      { key: 'influence_def_dominance', label: 'Def Influence Dominance' },
      { key: 'open_spaces_tendency', label: 'Open Spaces Tendency' },
      { key: 'open_spaces_dominance', label: 'Open Spaces Dominance' },
      { key: 'tight_spaces_tendency', label: 'Tight Spaces Tendency' },
      { key: 'tight_spaces_dominance', label: 'Tight Spaces Dominance' },
      { key: 'right_foot_tendency', label: 'Right Foot Tendency' },
      { key: 'right_foot_dominance', label: 'Right Foot Dominance' },
      { key: 'left_foot_tendency', label: 'Left Foot Tendency' },
      { key: 'left_foot_dominance', label: 'Left Foot Dominance' },
    ]
  },

  // PHYSICAL
  {
    groupName: 'PHYSICAL',
    categories: [
      { key: 'sprinter', label: 'Sprinter' },
      { key: 'marathonian', label: 'Marathonian' },
      { key: 'bomberman', label: 'Bomberman' },
      { key: 'three_sixty', label: '360º' },
      { key: 'the_rock', label: 'The Rock' },
      { key: 'air_flyer', label: 'Air Flyer' },
    ]
  },

  // PERFORMANCE
  {
    groupName: 'PERFORMANCE',
    categories: [
      { key: 'one_vs_one_off', label: '1vs1 Off' },
      { key: 'intelligence', label: 'Intelligence' },
      { key: 'game_pace', label: 'Game Pace' },
      { key: 'striking', label: 'Striking' },
      { key: 'ball_control', label: 'Ball Control' },
      { key: 'creativity', label: 'Creativity' },
      { key: 'one_vs_one_def', label: '1vs1 Def' },
      { key: 'reliability', label: 'Reliability' },
      { key: 'competitiveness', label: 'Competitiveness' },
      { key: 'injury_resistance', label: 'Injury Resistance' },
    ]
  },
].map(processGroup);
