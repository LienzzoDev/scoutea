"use client";

import { Filter } from "lucide-react";
import React, { memo, useMemo } from "react";

import { Button } from "@/components/ui/button";

interface FilterOptions {
  nationalities: string[];
  teams: string[];
  reportTypes: string[];
}

interface ScoutPlayerFiltersProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  filterOptions: FilterOptions;
  selectedNationalities: string[];
  selectedTeams: string[];
  selectedReportTypes: string[];
  activeFilters: Record<string, unknown>;
  onNationalitiesChange: (values: string[]) => void;
  onTeamsChange: (values: string[]) => void;
  onReportTypesChange: (values: string[]) => void;
  onApplyFilters: (_filters: Record<string, unknown>) => void;
  onClearFilters: () => void;
}

// 🚀 COMPONENTE DE FILTROS PARA SCOUT PLAYERS
// 🎯 PROPÓSITO: Filtros avanzados específicos para el área de scouts
// 📊 IMPACTO: Mejor performance y funcionalidades específicas para scouts

const ScoutPlayerFilters = memo<ScoutPlayerFiltersProps>(function ScoutPlayerFilters({
  showFilters,
  onToggleFilters,
  filterOptions: _filterOptions,
  selectedNationalities,
  selectedTeams,
  selectedReportTypes,
  activeFilters,
  onNationalitiesChange: _onNationalitiesChange,
  onTeamsChange: _onTeamsChange,
  onReportTypesChange: _onReportTypesChange,
  onApplyFilters: _onApplyFilters,
  onClearFilters: _onClearFilters,
}) {
  // 📊 MEMOIZAR CÁLCULOS DE ESTADO DE FILTROS
  const filterState = useMemo(() => {
    const hasActiveFilters = 
      selectedNationalities.length > 0 ||
      selectedTeams.length > 0 ||
      selectedReportTypes.length > 0 ||
      Object.keys(activeFilters).length > 0;

    const totalActiveFilters = 
      selectedNationalities.length +
      selectedTeams.length +
      selectedReportTypes.length +
      Object.keys(activeFilters).length;

    return {
      hasActiveFilters,
      totalActiveFilters,
      buttonText: totalActiveFilters > 0 ? `Filtros (${totalActiveFilters})` : 'Filtros'
    };
  }, [selectedNationalities, selectedTeams, selectedReportTypes, activeFilters]);

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

ScoutPlayerFilters.displayName = 'ScoutPlayerFilters';

export default ScoutPlayerFilters;