"use client";

import { Filter } from "lucide-react";
import React, { memo, useMemo } from "react";

import MultiSelectFilter from "@/components/filters/multi-select-filter";
import { Button } from "@/components/ui/button";

interface FilterOptions {
  nationalities: string[];
  positions: string[];
  teams: string[];
  competitions: string[];
}

interface PlayerFiltersProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  filterOptions: FilterOptions;
  selectedNationalities: string[];
  selectedPositions: string[];
  selectedTeams: string[];
  selectedCompetitions: string[];
  onNationalitiesChange: (values: string[]) => void;
  onPositionsChange: (values: string[]) => void;
  onTeamsChange: (values: string[]) => void;
  onCompetitionsChange: (values: string[]) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

// 🚀 COMPONENTE OPTIMIZADO DE FILTROS DE JUGADORES
// 🎯 PROPÓSITO: Filtros eficientes con memoización para evitar re-renders
// 📊 IMPACTO: Mejor performance al cambiar filtros frecuentemente

const PlayerFilters = memo<PlayerFiltersProps>(function PlayerFilters({
  showFilters,
  onToggleFilters,
  filterOptions,
  selectedNationalities,
  selectedPositions,
  selectedTeams,
  selectedCompetitions,
  onNationalitiesChange,
  onPositionsChange,
  onTeamsChange,
  onCompetitionsChange,
  onApplyFilters,
  onClearFilters,
}) {
  // 📊 MEMOIZAR CÁLCULOS DE ESTADO DE FILTROS
  const filterState = useMemo(() => {
    const hasActiveFilters = 
      selectedNationalities.length > 0 ||
      selectedPositions.length > 0 ||
      selectedTeams.length > 0 ||
      selectedCompetitions.length > 0;

    const totalActiveFilters = 
      selectedNationalities.length +
      selectedPositions.length +
      selectedTeams.length +
      selectedCompetitions.length;

    return {
      hasActiveFilters,
      totalActiveFilters,
      buttonText: totalActiveFilters > 0 ? `Filtros (${totalActiveFilters})` : 'Filtros'
    };
  }, [selectedNationalities, selectedPositions, selectedTeams, selectedCompetitions]);

  // 🔄 MEMOIZAR OPCIONES DE FILTROS PARA EVITAR RE-PROCESAMIENTO
  const memoizedFilterOptions = useMemo(() => ({
    nationalities: filterOptions.nationalities || [],
    positions: filterOptions.positions || [],
    teams: filterOptions.teams || [],
    competitions: filterOptions.competitions || []
  }), [filterOptions]);

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

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-[#e7e7e7] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Nationality Filter */}
            <div>
              <label className="block text-sm font-medium text-[#2e3138] mb-2">
                Nacionalidad
              </label>
              <MultiSelectFilter
                label="Nacionalidad"
                options={memoizedFilterOptions.nationalities}
                selectedValues={selectedNationalities}
                onSelectionChange={onNationalitiesChange}
                placeholder="Seleccionar nacionalidades"
              />
            </div>

            {/* Position Filter */}
            <div>
              <label className="block text-sm font-medium text-[#2e3138] mb-2">
                Posición
              </label>
              <MultiSelectFilter
                label="Posición"
                options={memoizedFilterOptions.positions}
                selectedValues={selectedPositions}
                onSelectionChange={onPositionsChange}
                placeholder="Seleccionar posiciones"
              />
            </div>

            {/* Team Filter */}
            <div>
              <label className="block text-sm font-medium text-[#2e3138] mb-2">
                Equipo
              </label>
              <MultiSelectFilter
                label="Equipo"
                options={memoizedFilterOptions.teams}
                selectedValues={selectedTeams}
                onSelectionChange={onTeamsChange}
                placeholder="Seleccionar equipos"
              />
            </div>

            {/* Competition Filter */}
            <div>
              <label className="block text-sm font-medium text-[#2e3138] mb-2">
                Competición
              </label>
              <MultiSelectFilter
                label="Competición"
                options={memoizedFilterOptions.competitions}
                selectedValues={selectedCompetitions}
                onSelectionChange={onCompetitionsChange}
                placeholder="Seleccionar competiciones"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#e7e7e7]">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="text-[#6d6d6d] border-[#e7e7e7] hover:bg-gray-50"
              disabled={!filterState.hasActiveFilters}
            >
              Limpiar filtros
            </Button>
            <Button
              onClick={onApplyFilters}
              className="bg-[#8c1a10] hover:bg-[#8c1a10]/90 text-white"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}
    </>
  );
});

PlayerFilters.displayName = 'PlayerFilters';

export default PlayerFilters;