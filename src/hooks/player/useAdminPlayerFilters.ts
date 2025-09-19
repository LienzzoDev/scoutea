"use client";

import { useCallback, useMemo, useState } from 'react';
import type { Player } from '@/types/player';

interface FilterOptions {
  nationalities: string[];
  positions: string[];
  teams: string[];
  agencies: string[];
}

interface UseAdminPlayerFiltersReturn {
  // Estado de filtros
  showFilters: boolean;
  selectedNationalities: string[];
  selectedPositions: string[];
  selectedTeams: string[];
  selectedAgencies: string[];
  
  // Opciones de filtros
  filterOptions: FilterOptions;
  
  // Funciones de control
  toggleFilters: () => void;
  setSelectedNationalities: (values: string[]) => void;
  setSelectedPositions: (values: string[]) => void;
  setSelectedTeams: (values: string[]) => void;
  setSelectedAgencies: (values: string[]) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  
  // Jugadores filtrados
  filteredPlayers: Player[];
}

export function useAdminPlayerFilters(players: Player[]): UseAdminPlayerFiltersReturn {
  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);

  // Generar opciones de filtros basadas en los jugadores disponibles
  const filterOptions = useMemo((): FilterOptions => {
    const nationalities = new Set<string>();
    const positions = new Set<string>();
    const teams = new Set<string>();
    const agencies = new Set<string>();

    if (players && Array.isArray(players)) {
      players.forEach(player => {
        if (player.nationality_1) {
          nationalities.add(player.nationality_1);
        }
        if (player.position_player) {
          positions.add(player.position_player);
        }
        if (player.team_name) {
          teams.add(player.team_name);
        }
        if (player.agency) {
          agencies.add(player.agency);
        }
      });
    }

    return {
      nationalities: Array.from(nationalities).sort(),
      positions: Array.from(positions).sort(),
      teams: Array.from(teams).sort(),
      agencies: Array.from(agencies).sort()
    };
  }, [players]);

  // Filtrar jugadores basado en los filtros seleccionados
  const filteredPlayers = useMemo(() => {
    if (!players || !Array.isArray(players)) {
      return [];
    }

    return players.filter(player => {
      // Filtro por nacionalidad
      if ((selectedNationalities?.length || 0) > 0) {
        if (!player.nationality_1 || !selectedNationalities.includes(player.nationality_1)) {
          return false;
        }
      }

      // Filtro por posición
      if ((selectedPositions?.length || 0) > 0) {
        if (!player.position_player || !selectedPositions.includes(player.position_player)) {
          return false;
        }
      }

      // Filtro por equipo
      if ((selectedTeams?.length || 0) > 0) {
        if (!player.team_name || !selectedTeams.includes(player.team_name)) {
          return false;
        }
      }

      // Filtro por agencia
      if ((selectedAgencies?.length || 0) > 0) {
        if (!player.agency || !selectedAgencies.includes(player.agency)) {
          return false;
        }
      }

      return true;
    });
  }, [players, selectedNationalities, selectedPositions, selectedTeams, selectedAgencies]);

  // Funciones de control
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const applyFilters = useCallback(() => {
    // Los filtros se aplican automáticamente a través del useMemo
    // Esta función puede usarse para cerrar el panel de filtros o realizar acciones adicionales
    console.log('Filtros aplicados:', {
      nationalities: selectedNationalities,
      positions: selectedPositions,
      teams: selectedTeams,
      agencies: selectedAgencies
    });
  }, [selectedNationalities, selectedPositions, selectedTeams, selectedAgencies]);

  const clearFilters = useCallback(() => {
    setSelectedNationalities([]);
    setSelectedPositions([]);
    setSelectedTeams([]);
    setSelectedAgencies([]);
  }, []);

  return {
    // Estado de filtros
    showFilters,
    selectedNationalities,
    selectedPositions,
    selectedTeams,
    selectedAgencies,
    
    // Opciones de filtros
    filterOptions,
    
    // Funciones de control
    toggleFilters,
    setSelectedNationalities,
    setSelectedPositions,
    setSelectedTeams,
    setSelectedAgencies,
    applyFilters,
    clearFilters,
    
    // Jugadores filtrados
    filteredPlayers
  };
}