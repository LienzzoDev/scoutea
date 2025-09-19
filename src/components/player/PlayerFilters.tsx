"use client";

import { Filter } from "lucide-react";
import React, { memo, useMemo } from "react";

import { Button } from "@/components/ui/button";

interface FilterOptions {
  nationalities: string[];
  positions: string[];
  teams: string[];
  competitions: string[];
  ages: string[];
}

interface PlayerFiltersProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  filterOptions: FilterOptions;
  selectedNationalities: string[];
  selectedPositions: string[];
  selectedTeams: string[];
  selectedCompetitions: string[];
  selectedAges: string[];
  activeFilters: Record<string, unknown>;
  onNationalitiesChange: (values: string[]) => void;
  onPositionsChange: (values: string[]) => void;
  onTeamsChange: (values: string[]) => void;
  onCompetitionsChange: (values: string[]) => void;
  onAgesChange: (values: string[]) => void;
  onApplyFilters: (_filters: Record<string, unknown>) => void;
  onClearFilters: () => void;
}

// 🚀 COMPONENTE MEJORADO DE FILTROS DE JUGADORES (BASADO EN SCOUTS)
// 🎯 PROPÓSITO: Filtros avanzados con memoización y funcionalidades extendidas
// 📊 IMPACTO: Mejor performance y más opciones de filtrado

const PlayerFilters = memo<PlayerFiltersProps>(function PlayerFilters({
  showFilters,
  onToggleFilters,
  filterOptions: _filterOptions,
  selectedNationalities,
  selectedPositions,
  selectedTeams,
  selectedCompetitions,
  selectedAges,
  activeFilters,
  onNationalitiesChange: _onNationalitiesChange,
  onPositionsChange: _onPositionsChange,
  onTeamsChange: _onTeamsChange,
  onCompetitionsChange: _onCompetitionsChange,
  onAgesChange: _onAgesChange,
  onApplyFilters: _onApplyFilters,
  onClearFilters: _onClearFilters,
}) {
  // 📊 MEMOIZAR CÁLCULOS DE ESTADO DE FILTROS
  const filterState = useMemo(() => {
    const hasActiveFilters = 
      selectedNationalities.length > 0 ||
      selectedPositions.length > 0 ||
      selectedTeams.length > 0 ||
      selectedCompetitions.length > 0 ||
      selectedAges.length > 0 ||
      Object.keys(activeFilters).length > 0;

    const totalActiveFilters = 
      selectedNationalities.length +
      selectedPositions.length +
      selectedTeams.length +
      selectedCompetitions.length +
      selectedAges.length +
      Object.keys(activeFilters).length;

    return {
      hasActiveFilters,
      totalActiveFilters,
      buttonText: totalActiveFilters > 0 ? `Filtros (${totalActiveFilters})` : 'Filtros'
    };
  }, [selectedNationalities, selectedPositions, selectedTeams, selectedCompetitions, selectedAges, activeFilters]);



  // 🎨 MEMOIZAR CLASES CSS DEL BOTÓN
  const buttonClasses = useMemo(() => 
    `flex items-center gap-2 border-[#e7e7e7] transition-all duration-200 ${
      showFilters
        ? "bg-[#8c1a10]/10 text-[#8c1a10] border-[#8c1a10]/30"
        : "text-[#6d6d6d] bg-transparent"
    }`,
    [showFilters]
  );

  return (
    <>
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        className={buttonClasses}
        onClick={onToggleFilters}
      >
        <Filter className="w-4 h-4 text-[#8c1a10]" />
        {filterState.buttonText}
      </Button>
    </>
  );
});

PlayerFilters.displayName = 'PlayerFilters';

export default PlayerFilters;