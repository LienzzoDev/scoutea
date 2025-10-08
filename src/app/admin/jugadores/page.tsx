'use client'

import { Search, Download, Upload, Globe, Plus, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { PlayerTable } from '@/components/dynamic-imports'
import CategorySelector from '@/components/filters/category-selector'
import MultiSelectFilter from '@/components/filters/multi-select-filter'
import PlayerProfileModal from '@/components/player/player-profile-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useDashboardState } from '@/hooks/useDashboardState'
import type { Player } from '@/types/player'

export default function JugadoresPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const _router = useRouter()
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Usar el mismo hook que member/dashboard
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
  } = useDashboardState()

  // Funciones para el modal
  const openPlayerModal = (player: Player) => {
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  const closePlayerModal = () => {
    setIsModalOpen(false)
    setSelectedPlayer(null)
  }

  // Contar filtros activos
  const totalActiveFilters =
    selectedNationalities.length +
    selectedPositions.length +
    selectedTeams.length

  // Si no está cargado, mostrar loading
  if (!isLoaded) {
    return <LoadingPage />
  }

  // Si no está autenticado, mostrar nada (ya se está redirigiendo)
  if (!isSignedIn) {
    return null
  }

  // Stub functions for list management (not needed in admin)
  const isInList = (_playerId: string) => false
  const addToList = async (_playerId: string) => true
  const removeFromList = async (_playerId: string) => true

  return (
    <main className='px-6 py-8 max-w-full mx-auto'>
      {/* Page Header */}
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold text-[#D6DDE6]'>Jugadores</h1>
        <div className='flex items-center space-x-3'>
          <Button
            className='bg-[#FF5733] hover:bg-[#E64A2B] text-white'
            onClick={() => _router.push('/admin/jugadores/nuevo-jugador')}
          >
            <Plus className='h-4 w-4 mr-2' />
            Nuevo Jugador
          </Button>
          <Button
            variant='outline'
            className='border-slate-700 bg-[#131921] text-white hover:bg-slate-700'
            onClick={() => window.open('/admin/scraping', '_blank')}
          >
            <Globe className='h-4 w-4 mr-2' />
            Scraping URL
          </Button>
          <Button
            variant='outline'
            className='border-slate-700 bg-[#131921] text-white hover:bg-slate-700'
          >
            <Download className='h-4 w-4 mr-2' />
            Importar
          </Button>
          <Button
            variant='outline'
            className='border-slate-700 bg-[#131921] text-white hover:bg-slate-700'
          >
            <Upload className='h-4 w-4 mr-2' />
            Exportar
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='flex items-center justify-between mb-6'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
          <Input
            placeholder='Buscar jugadores...'
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className='pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400'
          />
        </div>

        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            className={`flex items-center gap-2 border-slate-700 text-white hover:bg-slate-700 ${
              showFilters ? 'bg-slate-700' : 'bg-[#131921]'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className='w-4 h-4' />
            {totalActiveFilters > 0 ? `Filtros (${totalActiveFilters})` : 'Filtros'}
          </Button>

          <CategorySelector
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
          />
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className='mb-6 p-6 bg-[#131921] border border-slate-700 rounded-lg'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <MultiSelectFilter
              label='Nacionalidad'
              options={filterOptions.nationalities}
              selectedValues={selectedNationalities}
              onChange={setSelectedNationalities}
            />

            <MultiSelectFilter
              label='Posición'
              options={filterOptions.positions}
              selectedValues={selectedPositions}
              onChange={setSelectedPositions}
            />

            <MultiSelectFilter
              label='Equipo'
              options={filterOptions.teams}
              selectedValues={selectedTeams}
              onChange={setSelectedTeams}
            />
          </div>

          <div className='flex justify-end gap-4 mt-6'>
            <Button variant='outline' onClick={clearFilters} className='border-slate-700 text-white hover:bg-slate-700'>
              Limpiar
            </Button>
            <Button onClick={applyFilters} className='bg-[#FF5733] hover:bg-[#E64A2B] text-white'>
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg'>
          <p className='text-red-400'>
            Error: {typeof error === 'string' ? error : error?.message || 'Error desconocido'}
          </p>
        </div>
      )}

      {/* Player Table */}
      <PlayerTable
        players={filteredPlayers}
        selectedCategories={selectedCategoriesData}
        isInList={isInList}
        addToList={addToList}
        removeFromList={removeFromList}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        loading={loading}
        darkMode={true}
      />

      {/* Modal del perfil del jugador */}
      <PlayerProfileModal player={selectedPlayer} isOpen={isModalOpen} onClose={closePlayerModal} />
    </main>
  )
}
