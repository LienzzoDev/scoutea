"use client";

import { Filter } from "lucide-react";
import React, { memo, useMemo } from "react";

import MultiSelectFilter from "@/components/filters/multi-select-filter";
import { Button } from "@/components/ui/button";

interface FilterOptions {
  nationalities: string[];
  positions: string[];
  teams: string[];
  agencies: string[];
}

interface AdminPlayerFiltersProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  filterOptions: FilterOptions;
  selectedNationalities: string[];
  selectedPositions: string[];
  selectedTeams: string[];
  selectedAgencies: string[];
  onNationalitiesChange: (values: string[]) => void;
  onPositionsChange: (values: string[]) => void;
  onTeamsChange: (values: string[]) => void;
  onAgenciesChange: (values: string[]) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

// 🚀 COMPONENTE OPTIMIZADO DE FILTROS DE JUGADORES PARA ADMIN
// 🎯 PROPÓSITO: Filtros eficientes con memoización para la página de administración
// 📊 IMPACTO: Mejor performance al cambiar filtros frecuentemente

const AdminPlayerFilters = memo<AdminPlayerFiltersProps>(function AdminPlayerFilters({
  showFilters,
  onToggleFilters,
  filterOptions,
  selectedNationalities,
  selectedPositions,
  selectedTeams,
  selectedAgencies,
  onNationalitiesChange,
  onPositionsChange,
  onTeamsChange,
  onAgenciesChange,
  onApplyFilters,
  onClearFilters,
}) {
  // 📊 MEMOIZAR CÁLCULOS DE ESTADO DE FILTROS
  const filterState = useMemo(() => {
    const hasActiveFilters = 
      (selectedNationalities?.length || 0) > 0 ||
      (selectedPositions?.length || 0) > 0 ||
      (selectedTeams?.length || 0) > 0 ||
      (selectedAgencies?.length || 0) > 0;

    const totalActiveFilters = 
      (selectedNationalities?.length || 0) +
      (selectedPositions?.length || 0) +
      (selectedTeams?.length || 0) +
      (selectedAgencies?.length || 0);

    return {
      hasActiveFilters,
      totalActiveFilters,
      buttonText: totalActiveFilters > 0 ? `Filtros (${totalActiveFilters})` : 'Filtros'
    };
  }, [selectedNationalities, selectedPositions, selectedTeams, selectedAgencies]);

  // 🔄 MEMOIZAR OPCIONES DE FILTROS PARA EVITAR RE-PROCESAMIENTO
  const memoizedFilterOptions = useMemo(() => ({
    nationalities: filterOptions.nationalities || [],
    positions: filterOptions.positions || [],
    teams: filterOptions.teams || [],
    agencies: filterOptions.agencies || []
  }), [filterOptions]);

  // 🎨 MEMOIZAR CLASES CSS DEL BOTÓN (adaptado para tema oscuro)
  const buttonClasses = useMemo(() => 
    `flex items-center gap-2 transition-all duration-200 ${
      showFilters
        ? "bg-[#FF5733]/10 text-[#FF5733] border-[#FF5733]/30"
        : "text-slate-300 bg-[#131921] border-slate-700 hover:bg-slate-700"
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
        <Filter className="w-4 h-4 text-[#FF5733]" />
        {filterState.buttonText}
      </Button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[#131921] border border-slate-700 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Nationality Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nacionalidad
              </label>
              <MultiSelectFilter
                label="Nacionalidad"
                options={memoizedFilterOptions.nationalities}
                selectedValues={selectedNationalities}
                onSelectionChange={onNationalitiesChange}
                placeholder="Seleccionar nacionalidades"
                theme="dark"
              />
            </div>

            {/* Position Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Posición
              </label>
              <MultiSelectFilter
                label="Posición"
                options={memoizedFilterOptions.positions}
                selectedValues={selectedPositions}
                onSelectionChange={onPositionsChange}
                placeholder="Seleccionar posiciones"
                theme="dark"
              />
            </div>

            {/* Team Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Equipo
              </label>
              <MultiSelectFilter
                label="Equipo"
                options={memoizedFilterOptions.teams}
                selectedValues={selectedTeams}
                onSelectionChange={onTeamsChange}
                placeholder="Seleccionar equipos"
                theme="dark"
              />
            </div>

            {/* Agency Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Agencia
              </label>
              <MultiSelectFilter
                label="Agencia"
                options={memoizedFilterOptions.agencies}
                selectedValues={selectedAgencies}
                onSelectionChange={onAgenciesChange}
                placeholder="Seleccionar agencias"
                theme="dark"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="text-slate-300 border-slate-700 hover:bg-slate-700"
              disabled={!filterState.hasActiveFilters}
            >
              Limpiar filtros
            </Button>
            <Button
              onClick={onApplyFilters}
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}
    </>
  );
});

AdminPlayerFilters.displayName = 'AdminPlayerFilters';

export default AdminPlayerFilters;