"use client";

import { Search, X } from "lucide-react";

import AuthGuard from "@/components/auth/AuthGuard";
import { PlayerTable } from "@/components/dynamic-imports";
import CategorySelector from "@/components/filters/category-selector";
import MultiSelectFilter from "@/components/filters/multi-select-filter";
import RangeFilter from "@/components/filters/range-filter";
import MemberNavbar from "@/components/layout/member-navbar";
import DashboardTabs from "@/components/player/DashboardTabs";
import PlayerFilters from "@/components/player/PlayerFilters";
import { Input } from "@/components/ui/input";
import { useDashboardStateInfinite } from "@/hooks/useDashboardStateInfinite";

export default function MemberDashboard() {
  const {
    // Estados
    showFilters,
    setShowFilters,
    searchTerm,
    activeTab,
    paymentSuccess,
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
    tabCounts,
    selectedCategoriesData,

    // Infinite scroll
    hasMore,
    observerTarget,

    // Funciones
    handleSearch,
    handleTabChange,
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
  } = useDashboardStateInfinite();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f8f7f4]">
        {/* Header */}
        <MemberNavbar />

      {/* Mensaje de pago exitoso */}
      {paymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ¡Pago completado exitosamente!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Tu suscripción ha sido activada correctamente.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Wonderkids</span>
          <span>›</span>
          <span className="text-[#000000]">Players</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">Players</h1>

        {/* Selector de Categorías */}
        <CategorySelector
          title="Display Categories"
          categories={AVAILABLE_CATEGORIES}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          minCategories={1}
          storageKey="dashboard-selected-categories"
        />

        {/* Tabs and Search */}
        <div className="flex items-center justify-between mb-8">
          <DashboardTabs
            activeTab={activeTab}
            tabCounts={tabCounts}
            onTabChange={handleTabChange}
          />

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
            <PlayerFilters
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
                  onRangeChange={(min, max) =>{
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
                  placeholder="Seleccionar rango de edad..." step="1" suffix=" años" />
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
                  onRangeChange={(min, max) =>{
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
                  placeholder="Seleccionar rango de rating..." step="0.1" />
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
                  onRangeChange={(min, max) =>{
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
                  placeholder="Seleccionar rango de valor..." step="0.1" suffix="M €" />
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
            <span className="ml-3 text-[#6d6d6d] mt-2">{searchTerm
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
                <p className="text-[#6d6d6d] text-lg">{activeTab === "favourites"
                    ? "No tienes jugadores en tus favoritos"
                    : activeTab === "news"
                    ? "No hay jugadores nuevos en los últimos 7 días"
                    : searchTerm
                    ? `No se encontraron jugadores para "${searchTerm}"`
                    : "No se encontraron jugadores"}
                </p>
                <p className="text-[#6d6d6d] text-sm mt-2">{searchTerm
                    ? "Intenta con otros términos de búsqueda"
                    : "No hay jugadores disponibles en este momento"}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => handleSearch("")}
                    className="mt-4 px-4 py-2 bg-[#8c1a10] text-white rounded-lg hover:bg-[#6d1410] transition-colors">
                    Ver todos los jugadores
                  </button>
                )}
                
                {/* Debug button - only in development and when payment=success */}
                {process.env.NODE_ENV === 'development' && 
                 typeof window !== 'undefined' && 
                 new URLSearchParams(window.location.search).get('payment') === 'success' && (
                  <div className="mt-6">
                    <button
                      onClick={async () => {
                        const response = await fetch('/api/debug/payment-status')
                        const data = await response.json()
                        console.log('🔍 Payment status debug:', data)
                        alert(JSON.stringify(data, null, 2))
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Debug Payment Status
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
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

                {/* Infinite Scroll Observer Target */}
                <div
                  ref={observerTarget}
                  style={{ minHeight: '80px' }}
                  className="flex items-center justify-center py-8"
                >
                  {loading && hasMore && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
                      <span className="text-[#6d6d6d] text-sm">Cargando más jugadores...</span>
                    </div>
                  )}
                  {!hasMore && filteredPlayers.length > 0 && (
                    <p className="text-[#6d6d6d] text-sm">No hay más jugadores para cargar</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
