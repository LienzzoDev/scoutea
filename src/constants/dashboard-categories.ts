import { formatMoney } from '@/lib/utils/format-money'
import type { StatsPeriod } from '@/lib/utils/stats-period-utils'

export interface Category {
  key: string
  label: string
  enabled?: boolean
  getValue?: (player: Record<string, unknown>) => unknown
  getSortValue?: (player: Record<string, unknown>) => number
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

// Format a numeric stat value for display (round to 2 decimals if non-integer)
const formatStatValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '0'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

// Helper to create a stat category with stable key and support for 1..2 periods
const statCat = (baseName: string, label: string, periods: StatsPeriod[]): Category => {
  const primary = periods[0]
  return {
    key: baseName,
    label,
    getValue: (p: Record<string, unknown>) => {
      if (periods.length === 0) return 0
      if (periods.length === 1) return (p[`${baseName}_${periods[0]}`] as number | null | undefined) ?? 0
      const parts = periods.map(period => formatStatValue(p[`${baseName}_${period}`]))
      return parts.join(' | ')
    },
    getSortValue: (p: Record<string, unknown>) => {
      if (!primary) return 0
      const raw = p[`${baseName}_${primary}`]
      const n = Number(raw ?? 0)
      return Number.isNaN(n) ? 0 : n
    },
  }
}

// Generate STATS category groups for given periods (1..2)
function buildStatsGroups(periods: StatsPeriod[]): CategoryGroup[] {
  const p = periods
  const periodLabel = periods.map(x => x.toUpperCase()).join(' · ')
  return [
    {
      groupName: '1. General',
      categories: [],
      subgroups: [
        {
          groupName: `1.1 General Stats (${periodLabel})`,
          categories: [
            statCat('matches_played_tot', 'Matches played (TOT)', p),
            statCat('minutes_played_tot', 'Minutes played (TOT)', p),
            statCat('goals_p90', 'Goals (P90)', p),
            statCat('goals_tot', 'Goals (TOT)', p),
            statCat('assists_p90', 'Assists (P90)', p),
            statCat('assists_tot', 'Assists (TOT)', p),
            statCat('yellow_cards_p90', 'Yellow cards (P90)', p),
            statCat('yellow_cards_tot', 'Yellow cards (TOT)', p),
            statCat('red_cards_p90', 'Red cards (P90)', p),
            statCat('red_cards_tot', 'Red cards (TOT)', p),
          ]
        },
      ]
    },
    {
      groupName: '2. Goalkeeping',
      categories: [
        statCat('conceded_goals_p90', 'Conceded goals (P90)', p),
        statCat('conceded_goals_tot', 'Conceded goals (TOT)', p),
        statCat('prevented_goals_p90', 'Prevented goals (P90)', p),
        statCat('prevented_goals_tot', 'Prevented goals (TOT)', p),
        statCat('shots_against_p90', 'Shots against (P90)', p),
        statCat('shots_against_tot', 'Shots against (TOT)', p),
        statCat('clean_sheets_tot', 'Clean sheets (TOT)', p),
        statCat('clean_sheets_percent', 'Clean sheets (%)', p),
        statCat('save_rate_percent', 'Save rate (%)', p),
      ]
    },
    {
      groupName: '3. Defending',
      categories: [
        statCat('tackles_p90', 'Tackles (P90)', p),
        statCat('tackles_tot', 'Tackles (TOT)', p),
        statCat('interceptions_p90', 'Interceptions (P90)', p),
        statCat('interceptions_tot', 'Interceptions (TOT)', p),
        statCat('fouls_p90', 'Fouls (P90)', p),
        statCat('fouls_tot', 'Fouls (TOT)', p),
      ]
    },
    {
      groupName: '4. Passing',
      categories: [
        statCat('passes_p90', 'Passes (P90)', p),
        statCat('passes_tot', 'Passes (TOT)', p),
        statCat('forward_passes_p90', 'Forward passes (P90)', p),
        statCat('forward_passes_tot', 'Forward passes (TOT)', p),
        statCat('crosses_p90', 'Crosses (P90)', p),
        statCat('crosses_tot', 'Crosses (TOT)', p),
        statCat('accurate_passes_percent', 'Accurate passes (%)', p),
      ]
    },
    {
      groupName: '5. Finishing',
      categories: [
        statCat('shots_p90', 'Shots (P90)', p),
        statCat('shots_tot', 'Shots (TOT)', p),
        statCat('effectiveness_percent', 'Effectiveness (%)', p),
      ]
    },
    {
      groupName: '6. 1vs1',
      categories: [
        statCat('off_duels_p90', 'Off duels (P90)', p),
        statCat('off_duels_tot', 'Off duels (TOT)', p),
        statCat('off_duels_won_percent', 'Off duels won (%)', p),
        statCat('def_duels_p90', 'Def duels (P90)', p),
        statCat('def_duels_tot', 'Def duels (TOT)', p),
        statCat('def_duels_won_percent', 'Def duels won (%)', p),
        statCat('aerials_duels_p90', 'Aerial duels (P90)', p),
        statCat('aerials_duels_tot', 'Aerial duels (TOT)', p),
        statCat('aerials_duels_won_percent', 'Aerial duels won (%)', p),
      ]
    },
    {
      groupName: '7. Physical',
      categories: [
        { key: 'sprinter', label: 'Sprinter' },
        { key: 'marathonian', label: 'Marathonian' },
        { key: 'bomberman', label: 'Bomberman' },
        { key: 'three_sixty', label: '360º' },
        { key: 'the_rock', label: 'The Rock' },
        { key: 'air_flyer', label: 'Air Flyer' },
      ]
    },
  ]
}

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
          return formatMoney(value as number | string | null);
        }
      },
    ]
  },

  // STATS (dynamic based on period - default 3m, use getDashboardCategoryGroups for other periods)
  {
    groupName: 'STATS',
    categories: [],
    subgroups: buildStatsGroups(['3m']),
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

  // ARCHETYPE
  {
    groupName: 'ARCHETYPE',
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

  // EVOLUTION
  {
    groupName: 'EVOLUTION',
    categories: [
      {
        key: 'transfer_team_pts',
        label: 'Transfer Team Pts',
        getValue: (player: Record<string, unknown>) => player.transfer_team_pts ?? 'N/A'
      },
      {
        key: 'transfer_competition_pts',
        label: 'Transfer Competition Pts',
        getValue: (player: Record<string, unknown>) => player.transfer_competition_pts ?? 'N/A'
      },
      {
        key: 'roi',
        label: 'ROI',
        getValue: (player: Record<string, unknown>) => player.roi ?? 'N/A'
      },
    ]
  },
].map(processGroup);

/**
 * Generate dashboard category groups for a specific stats period.
 * Non-stats groups (PASSPORT, CONTRACT, etc.) stay the same.
 * Only the STATS group is regenerated with the appropriate period suffix.
 */
export function getDashboardCategoryGroups(periods: StatsPeriod[]): CategoryGroup[] {
  return DASHBOARD_CATEGORY_GROUPS.map(group => {
    if (group.groupName === 'STATS') {
      if (periods.length === 0) {
        // Hide STATS group entirely when no period is selected
        return null
      }
      return processGroup({
        ...group,
        subgroups: buildStatsGroups(periods),
      })
    }
    return group
  }).filter((g): g is CategoryGroup => g !== null)
}
