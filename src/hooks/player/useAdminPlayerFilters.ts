import { useState, useMemo } from 'react';

import type { Player } from '@/types/player';

export interface PlayerFilters {
  position?: string;
  team?: string;
  ageMin?: number;
  ageMax?: number;
  search?: string;
}

export const useAdminPlayerFilters = (players: Player[]) => {
  const [filters, setFilters] = useState<PlayerFilters>({});

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      if (filters.position && player.position !== filters.position) return false;
      if (filters.team && player.team !== filters.team) return false;
      if (filters.ageMin && player.age < filters.ageMin) return false;
      if (filters.ageMax && player.age > filters.ageMax) return false;
      if (filters.search && !player.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [players, filters]);

  const updateFilter = (key: keyof PlayerFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    filters,
    filteredPlayers,
    updateFilter,
    clearFilters,
  };
};