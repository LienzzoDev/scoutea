"use client";

import { Search } from "lucide-react";

import CategorySelector from "@/components/filters/category-selector";
import MemberNavbar from "@/components/layout/member-navbar";
import DashboardTabs from "@/components/player/DashboardTabs";
import PlayerFilters from "@/components/player/PlayerFilters";
import PlayerTable from "@/components/player/PlayerTable";
import { Input } from "@/components/ui/input";
import { useDashboardState } from "@/hooks/useDashboardState";

export default function MemberDashboard() {
  const {
    // Estados
    showFilters,
    setShowFilters,
    searchTerm,
    activeTab,
    paymentSuccess,
    selectedCategories,
    selectedNationalities,
    selectedPositions,
    selectedTeams,
    selectedCompetitions,
    filterOptions,
    
    // Datos derivados
    loading,
    error,
    filteredPlayers,
    tabCounts,
    selectedCategoriesData,
    
    // Funciones
    handleSearch,
    handleTabChange,
    handleCategoryToggle,
    applyFilters,
    clearFilters,
    setSelectedNationalities,
    setSelectedPositions,
    setSelectedTeams,
    setSelectedCompetitions,
    
    // Player list functions
    addToList,
    removeFromList,
    isInList,
    
    // Constants
    AVAILABLE_CATEGORIES,
  } = useDashboardState();

  return (
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
              onNationalitiesChange={setSelectedNationalities}
              onPositionsChange={setSelectedPositions}
              onTeamsChange={setSelectedTeams}
              onCompetitionsChange={setSelectedCompetitions}
              onApplyFilters={() => {
                applyFilters({
                  nationalities: selectedNationalities,
                  positions: selectedPositions,
                  teams: selectedTeams,
                  competitions: selectedCompetitions,
                });
                setShowFilters(false);
              }}
              onClearFilters={clearFilters}
            />
          </div>
        </div>

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
              Error al cargar los jugadores: {error}
            </p>
          </div>
        )}

        {/* Players List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#6d6d6d] text-lg">
                  {activeTab === "list"
                    ? "No tienes jugadores en tu lista"
                    : activeTab === "news"
                    ? "No hay jugadores nuevos en los últimos 7 días"
                    : searchTerm
                    ? `No se encontraron jugadores para "${searchTerm}"`
                    : "No se encontraron jugadores"}
                </p>
                <p className="text-[#6d6d6d] text-sm mt-2">
                  {searchTerm
                    ? "Intenta con otros términos de búsqueda"
                    : "No hay jugadores disponibles en este momento"}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => handleSearch("")}
                    className="mt-4 px-4 py-2 bg-[#8c1a10] text-white rounded-lg hover:bg-[#6d1410] transition-colors"
                  >
                    Ver todos los jugadores
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
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
