export interface ScoutCategory {
  key: string
  label: string
  enabled?: boolean
  getValue?: (scout: Record<string, unknown>) => unknown
}

export interface ScoutCategoryGroup {
  groupName: string
  categories: ScoutCategory[]
  subgroups?: ScoutCategoryGroup[]
}

// Helper function to create a default getValue function based on the key
const defaultGetValue = (key: string) => (scout: Record<string, unknown>) => scout[key] || 'N/A';

// Helper function to add getValue to categories that don't have it
const ensureGetValue = (category: ScoutCategory): ScoutCategory => {
  if (!category.getValue) {
    return { ...category, getValue: defaultGetValue(category.key) };
  }
  return category;
};

// Helper to process groups recursively
const processGroup = (group: ScoutCategoryGroup): ScoutCategoryGroup => ({
  ...group,
  categories: group.categories.map(ensureGetValue),
  subgroups: group.subgroups?.map(processGroup)
});

export const SCOUT_CATEGORY_GROUPS: ScoutCategoryGroup[] = [
  // SCOUT ID
  {
    groupName: 'SCOUT ID',
    categories: [
      {
        key: 'date_of_birth',
        label: 'Date of birth',
        getValue: (scout: Record<string, unknown>) => {
          const date = scout.date_of_birth;
          return date ? new Date(date as string).toLocaleDateString('es-ES') : 'N/A';
        }
      },
      {
        key: 'nationality',
        label: 'Nationality',
        getValue: (scout: Record<string, unknown>) => scout.nationality || 'N/A'
      },
      {
        key: 'join_date',
        label: 'Join',
        getValue: (scout: Record<string, unknown>) => {
          const date = scout.join_date || scout.createdAt;
          return date ? new Date(date as string).toLocaleDateString('es-ES') : 'N/A';
        }
      },
      {
        key: 'scout_elo',
        label: 'Scout ELO',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.scout_elo;
          return value ? Number(value).toFixed(0) : 'N/A';
        }
      },
      {
        key: 'scout_ranking',
        label: 'Scout Ranking',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.scout_ranking;
          return value ? `#${value}` : 'N/A';
        }
      },
      {
        key: 'scout_level',
        label: 'Scout Level',
        getValue: (scout: Record<string, unknown>) => scout.scout_level || 'N/A'
      },
      {
        key: 'total_reports',
        label: 'Total Reports',
        getValue: (scout: Record<string, unknown>) => scout.total_reports || 0
      },
      {
        key: 'original_reports',
        label: 'Original Reports',
        getValue: (scout: Record<string, unknown>) => scout.original_reports || 0
      },
    ]
  },

  // STATS
  {
    groupName: 'STATS',
    categories: [
      {
        key: 'total_investment',
        label: 'Total Invest',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.total_investment;
          if (!value || typeof value !== 'number') return 'N/A';
          if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
          return `€${value}`;
        }
      },
      {
        key: 'net_profits',
        label: 'Net Profit',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.net_profits;
          if (!value || typeof value !== 'number') return 'N/A';
          if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
          return `€${value}`;
        }
      },
      {
        key: 'roi',
        label: 'ROI',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.roi;
          return value ? `${Number(value).toFixed(1)}%` : 'N/A';
        }
      },
      {
        key: 'max_profit_report',
        label: 'Max Profit',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.max_profit_report;
          if (!value || typeof value !== 'number') return 'N/A';
          if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
          return `€${value}`;
        }
      },
      {
        key: 'min_profit_report',
        label: 'Min Profit',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.min_profit_report;
          if (!value || typeof value !== 'number') return 'N/A';
          if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
          return `€${value}`;
        }
      },
      {
        key: 'avg_profit_report',
        label: 'Avg Profit',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.avg_profit_report;
          if (!value || typeof value !== 'number') return 'N/A';
          if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
          return `€${value}`;
        }
      },
      {
        key: 'transfer_team_pts',
        label: 'Transfer Team Pts',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.transfer_team_pts;
          return value ? Number(value).toFixed(1) : 'N/A';
        }
      },
      {
        key: 'avg_transfer_team_pts',
        label: 'Avg Transfer Team Pts',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.transfer_team_pts; // Using transfer_team_pts as avg is not in schema
          return value ? Number(value).toFixed(1) : 'N/A';
        }
      },
      {
        key: 'transfer_competition_pts',
        label: 'Transfer Compet Pts',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.transfer_competition_pts;
          return value ? Number(value).toFixed(1) : 'N/A';
        }
      },
      {
        key: 'avg_transfer_competition_pts',
        label: 'Avg Transfer Compet Pts',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.transfer_competition_pts; // Using transfer_competition_pts as avg is not in schema
          return value ? Number(value).toFixed(1) : 'N/A';
        }
      },
    ]
  },

  // START INFO
  {
    groupName: 'START INFO',
    categories: [
      {
        key: 'avg_initial_age',
        label: 'Avg Age',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.avg_initial_age;
          return value ? `${Number(value).toFixed(1)} years` : 'N/A';
        }
      },
      {
        key: 'avg_initial_trfm_value',
        label: 'Avg TRFM Value',
        getValue: (scout: Record<string, unknown>) => {
          const value = scout.avg_initial_trfm_value;
          if (!value || typeof value !== 'number') return 'N/A';
          return `€${Number(value).toFixed(2)}M`;
        }
      },
      {
        key: 'initial_team',
        label: 'Start Team',
        getValue: (scout: Record<string, unknown>) => scout.initial_team || 'N/A'
      },
      {
        key: 'avg_initial_team_level',
        label: 'Avg Team Level',
        getValue: (scout: Record<string, unknown>) => scout.avg_initial_team_level || 'N/A'
      },
      {
        key: 'initial_competition',
        label: 'Start Competition',
        getValue: (scout: Record<string, unknown>) => scout.initial_competition || 'N/A'
      },
      {
        key: 'avg_initial_competition_level',
        label: 'Avg Competition Level',
        getValue: (scout: Record<string, unknown>) => scout.avg_initial_competition_level || 'N/A'
      },
      {
        key: 'initial_competition_country',
        label: 'Start Competition Country',
        getValue: (scout: Record<string, unknown>) => scout.initial_competition_country || 'N/A'
      },
    ]
  },
].map(processGroup);
