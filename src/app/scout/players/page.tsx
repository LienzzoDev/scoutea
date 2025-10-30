"use client";

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ScoutPlayersPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/scout/portfolio')
  }, [router])

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
    </div>
  )
}

function _OldScoutPlayersPage() {
  const {
    // Estados
    showFilters,
    setShowFilters,
    searchTerm,
    selectedCategories,
    activeFilters,
    selectedNationalities,
    selectedPositions,
    selectedTeams,
    selectedCompetitions,
    selectedAges,
    filterOptions,
    sortBy,
    sortOrder,
    
    // Datos derivados
    loading,
    error,
    filteredPlayers,
    selectedCategoriesData,
    
    // Funciones
    handleSearch,
    handleCategoryToggle,
    applyFilters,
    clearFilters,
    handleSort,
    setSelectedNationalities,
    setSelectedPositions,
    setSelectedTeams,
    setSelectedCompetitions,
    setSelectedAges,
    
    // Player list functions
    addToList,
    removeFromList,
    isInList,
    
    // Constants
    AVAILABLE_CATEGORIES,
  } = useScoutPlayersState();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f8f7f4]">
        {/* Header */}
        <ScoutNavbar />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
            <span>Scout Area</span>
            <span>›</span>
            <span className="text-[#000000]">Players</span>
          </div>

          {/* Page Title */}
          <h1 className="text-4xl font-bold text-[#000000] mb-8">Mis Jugadores Reportados</h1>

          {/* Selector de Categorías */}
          <CategorySelector
            title="Display Categories"
            categories={AVAILABLE_CATEGORIES}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            minCategories={1}
            storageKey="scout-players-selected-categories"
          />

          {/* Search and Filters */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, nacionalidad, equipo, posición..."
                  className="pl-10 w-80 bg-[#ffffff] border-[#e7e7e7]"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <ScoutPlayerFilters
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                filterOptions={filterOptions}
                selectedNationalities={selectedNationalities}
                selectedPositions={selectedPositions}
                selectedTeams={selectedTeams}
                selectedCompetitions={selectedCompetitions}
                selectedAges={selectedAges}
                activeFilters={activeFilters}
                onNationalitiesChange={setSelectedNationalities}
                onPositionsChange={setSelectedPositions}
                onTeamsChange={setSelectedTeams}
                onCompetitionsChange={setSelectedCompetitions}
                onAgesChange={setSelectedAges}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
              />
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-[#000000]">Filtros</h3>
                  {(Object.keys(activeFilters).length > 0 || selectedNationalities.length > 0 || selectedPositions.length > 0 || selectedTeams.length > 0 || selectedCompetitions.length > 0 || selectedAges.length > 0) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <span className="text-red-600 text-sm">Limpiar Filtros</span>
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Nacionalidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nacionalidad
                  </label>
                  <MultiSelectFilter
                    label="Nacionalidad"
                    options={filterOptions.nationalities}
                    selectedValues={selectedNationalities}
                    onSelectionChange={setSelectedNationalities}
                    placeholder="Seleccionar nacionalidades..."
                    searchPlaceholder="Buscar nacionalidades..."
                    maxDisplayTags={2}
                  />
                </div>

                {/* Posiciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posición
                  </label>
                  <MultiSelectFilter
                    label="Posición"
                    options={filterOptions.positions}
                    selectedValues={selectedPositions}
                    onSelectionChange={setSelectedPositions}
                    placeholder="Seleccionar posiciones..."
                    searchPlaceholder="Buscar posiciones..."
                    maxDisplayTags={2}
                  />
                </div>

                {/* Equipos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipo
                  </label>
                  <MultiSelectFilter
                    label="Equipo"
                    options={filterOptions.teams}
                    selectedValues={selectedTeams}
                    onSelectionChange={setSelectedTeams}
                    placeholder="Seleccionar equipos..."
                    searchPlaceholder="Buscar equipos..."
                    maxDisplayTags={1}
                  />
                </div>

                {/* Competiciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competición
                  </label>
                  <MultiSelectFilter
                    label="Competición"
                    options={filterOptions.competitions}
                    selectedValues={selectedCompetitions}
                    onSelectionChange={setSelectedCompetitions}
                    placeholder="Seleccionar competiciones..."
                    searchPlaceholder="Buscar competiciones..."
                    maxDisplayTags={1}
                  />
                </div>
              </div>

              {/* Filtros adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                {/* Rango de Edad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Edad
                  </label>
                  <RangeFilter
                    label="Edad"
                    minValue={activeFilters.min_age}
                    maxValue={activeFilters.max_age}
                    onRangeChange={(min, max) => {
                      const newFilters = { ...activeFilters }
                      if (min === undefined) {
                        delete newFilters.min_age
                      } else {
                        newFilters.min_age = min
                      }
                      if (max === undefined) {
                        delete newFilters.max_age
                      } else {
                        newFilters.max_age = max
                      }
                      applyFilters(newFilters)
                    }}
                    placeholder="Seleccionar rango de edad..." 
                    step="1" 
                    suffix=" años" 
                  />
                </div>

                {/* Rango de Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Rating
                  </label>
                  <RangeFilter
                    label="Rating"
                    minValue={activeFilters.min_rating}
                    maxValue={activeFilters.max_rating}
                    onRangeChange={(min, max) => {
                      const newFilters = { ...activeFilters }
                      if (min === undefined) {
                        delete newFilters.min_rating
                      } else {
                        newFilters.min_rating = min
                      }
                      if (max === undefined) {
                        delete newFilters.max_rating
                      } else {
                        newFilters.max_rating = max
                      }
                      applyFilters(newFilters)
                    }}
                    placeholder="Seleccionar rango de rating..." 
                    step="0.1" 
                  />
                </div>

                {/* Rango de Valor de Mercado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor de Mercado (€M)
                  </label>
                  <RangeFilter
                    label="Valor"
                    minValue={activeFilters.min_value}
                    maxValue={activeFilters.max_value}
                    onRangeChange={(min, max) => {
                      const newFilters = { ...activeFilters }
                      if (min === undefined) {
                        delete newFilters.min_value
                      } else {
                        newFilters.min_value = min
                      }
                      if (max === undefined) {
                        delete newFilters.max_value
                      } else {
                        newFilters.max_value = max
                      }
                      applyFilters(newFilters)
                    }}
                    placeholder="Seleccionar rango de valor..." 
                    step="0.1" 
                    suffix="M €" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
              <span className="ml-3 text-[#6d6d6d] mt-2">
                {searchTerm
                  ? `Buscando "${searchTerm}"...`
                  : "Cargando jugadores..."}
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-600">
                Error al cargar los jugadores: {typeof error === 'string' ? error : error?.message || 'Error desconocido'}
              </p>
            </div>
          )}

          {/* Players List */}
          {!loading && !error && (
            <div className="space-y-4">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#6d6d6d] text-lg">
                    {searchTerm
                      ? `No se encontraron jugadores para "${searchTerm}"`
                      : "No tienes jugadores reportados"}
                  </p>
                  <p className="text-[#6d6d6d] text-sm mt-2">
                    {searchTerm
                      ? "Intenta con otros términos de búsqueda"
                      : "Aquí aparecerán los jugadores sobre los que hayas creado reportes"}
                  </p>
                  {searchTerm ? (
                    <button
                      onClick={() => handleSearch("")}
                      className="mt-4 px-4 py-2 bg-[#8c1a10] text-white rounded-lg hover:bg-[#6d1410] transition-colors">
                      Ver todos tus jugadores
                    </button>
                  ) : (
                    <button
                      onClick={() => window.location.href = '/scout/reports/new'}
                      className="mt-4 px-4 py-2 bg-[#8c1a10] text-white rounded-lg hover:bg-[#6d1410] transition-colors">
                      Crear primer reporte
                    </button>
                  )}
                </div>
              ) : (
                <PlayerTable
                  players={filteredPlayers}
                  selectedCategories={selectedCategoriesData}
                  isInList={isInList}
                  addToList={addToList}
                  removeFromList={removeFromList}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}