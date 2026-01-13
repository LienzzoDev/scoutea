'use client'

import { Filter, Globe, Plus, RefreshCw, Search } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import ImportCompetitionsButton from "@/components/admin/ImportCompetitionsButton"
import CompetitionTable from "@/components/competition/CompetitionTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingPage } from "@/components/ui/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useInfiniteCompetitionsScroll } from '@/hooks/admin/useInfiniteCompetitionsScroll'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import type { Competition } from '@/lib/services/competition-service'

export default function CompeticionesPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<string>('competition_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Filtros
  const [countryFilter, setCountryFilter] = useState('')
  const [tierFilter, setTierFilter] = useState<number | undefined>(undefined)
  const [confederationFilter, setConfederationFilter] = useState('')

  // Estados para opciones de filtros
  const [countries, setCountries] = useState<(string | { name: string; id?: string })[]>([])
  const [confederations, setConfederations] = useState<string[]>([])

  // Debounce del search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Hook de infinite scroll
  const {
    competitions,
    loading,
    error: hookError,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfiniteCompetitionsScroll({
    search: debouncedSearch,
    country: countryFilter,
    confederation: confederationFilter,
    ...(tierFilter !== undefined && { tier: tierFilter }),
    limit: 50
  })

  // Forzar refresh al montar la página para obtener datos frescos
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    setDebouncedSearch(searchTerm)
  }

  // Cargar opciones de filtros
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/competitions/filters')
        if (response.ok) {
          const data = await response.json()
          setCountries(data.countries || [])
          setConfederations(data.confederations || [])
        }
      } catch (err) {
        console.error('Error loading filter options:', err)
      }
    }
    loadFilterOptions()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'country') {
      setCountryFilter(value === '' ? '' : value)
    } else if (key === 'tier') {
      setTierFilter(value === '' ? undefined : parseInt(value))
    } else if (key === 'confederation') {
      setConfederationFilter(value === '' ? '' : value)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCountryFilter('')
    setTierFilter(undefined)
    setConfederationFilter('')
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/competitions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar competición')
      }

      setShowDeleteConfirm(null)
      refresh() // Refrescar la lista después de eliminar
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }

  // Categorías para mostrar en la tabla - todos los campos de la base de datos
  const categories = useMemo(() => [
    {
      key: 'competition_country',
      label: 'País',
      getValue: (comp: Competition) => comp.competition_country,
    },
    {
      key: 'url_trfm',
      label: 'URL Transfermarkt',
      getValue: (comp: Competition) => comp.url_trfm,
      format: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'N/A';
        return value.length > 30 ? value.substring(0, 30) + '...' : value;
      },
    },
    {
      key: 'competition_confederation',
      label: 'Confederación',
      getValue: (comp: Competition) => comp.competition_confederation || comp.confederation,
    },
    {
      key: 'competition_tier',
      label: 'Tier',
      getValue: (comp: Competition) => comp.competition_tier || comp.tier,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return `Tier ${value}`;
      },
    },
    {
      key: 'season_format',
      label: 'Formato',
      getValue: (comp: Competition) => comp.season_format,
    },
    {
      key: 'competition_trfm_value',
      label: 'Valor TM',
      getValue: (comp: Competition) => comp.competition_trfm_value,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return `€${value.toLocaleString('es-ES')}`;
      },
    },
    {
      key: 'competition_trfm_value_norm',
      label: 'Valor TM Norm',
      getValue: (comp: Competition) => comp.competition_trfm_value_norm,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return value.toFixed(2);
      },
    },
    {
      key: 'competition_rating',
      label: 'Rating',
      getValue: (comp: Competition) => comp.competition_rating,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return value.toFixed(1);
      },
    },
    {
      key: 'competition_rating_norm',
      label: 'Rating Norm',
      getValue: (comp: Competition) => comp.competition_rating_norm,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return value.toFixed(2);
      },
    },
    {
      key: 'competition_elo',
      label: 'ELO',
      getValue: (comp: Competition) => comp.competition_elo,
      format: (value: unknown) => {
        if (!value || typeof value !== 'number') return 'N/A';
        return Math.round(value).toString();
      },
    },
    {
      key: 'competition_level',
      label: 'Nivel',
      getValue: (comp: Competition) => comp.competition_level,
    },
    {
      key: 'createdAt',
      label: 'Creado',
      getValue: (comp: Competition) => comp.createdAt ? new Date(comp.createdAt).toISOString() : null,
      format: (value: unknown) => {
        if (!value) return 'N/A';
        return new Date(value as string).toLocaleDateString('es-ES');
      },
    },
    {
      key: 'updatedAt',
      label: 'Actualizado',
      getValue: (comp: Competition) => comp.updatedAt ? new Date(comp.updatedAt).toISOString() : null,
      format: (value: unknown) => {
        if (!value) return 'N/A';
        return new Date(value as string).toLocaleDateString('es-ES');
      },
    },
  ], [])

  // Función de ordenamiento
  const handleSort = (categoryKey: string) => {
    if (sortBy === categoryKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(categoryKey)
      setSortOrder('asc')
    }
  }

  // Client-side sorting
  const sortedCompetitions = useMemo(() => {
    if (!Array.isArray(competitions)) return [];

    return [...competitions].sort((a, b) => {
      let aValue: string | number | Date | null | undefined = a[sortBy as keyof Competition];
      let bValue: string | number | Date | null | undefined = b[sortBy as keyof Competition];

      // Manejar valores null/undefined
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Convertir a string para comparación si es necesario
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      // Comparar
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [competitions, sortBy, sortOrder])

  if (!isLoaded) {
    return <LoadingPage />
  }

  if (!isSignedIn) {
    router.replace('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-[#080F17] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D6DDE6] mb-2">
                Gestión de Competiciones
              </h1>
              <p className="text-gray-400">
                Administra todas las competiciones de la base de datos
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => router.push('/admin/competiciones/nueva')}
                className="bg-[#8C1A10] hover:bg-[#7A1610] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Competición
              </Button>
            </div>
          </div>
        </div>

        {/* Importación de Competiciones */}
        <Card className="mb-6 bg-[#131921] border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#D6DDE6] mb-4">
              Importar Competiciones desde Excel
            </h3>
            <ImportCompetitionsButton />
          </CardContent>
        </Card>

        {/* Filtros y búsqueda */}
        <Card className="mb-6 bg-[#131921] border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar competiciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 bg-[#1F2937] border-slate-600 text-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className={`border-slate-600 hover:bg-slate-700 transition-colors ${
                    showFilters
                      ? 'bg-slate-700 text-white border-slate-500'
                      : 'bg-[#1F2937] text-gray-300 hover:text-white'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-slate-600 bg-[#1F2937] text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Limpiar
                </Button>
                <Button
                  onClick={refresh}
                  variant="outline"
                  className="border-slate-600 bg-[#1F2937] text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refrescar
                </Button>
              </div>
            </div>

            {/* Filtros avanzados */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="country-select" className="block text-sm font-medium text-gray-300 mb-2">
                    País
                  </label>
                  <Select
                    value={countryFilter || ''}
                    onValueChange={(value) => handleFilterChange('country', value)}
                  >
                    <SelectTrigger id="country-select" className="w-full bg-[#1F2937] border-slate-600 text-white hover:bg-[#2D3748] focus:ring-[#8C1A10]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                      <SelectContent className="bg-[#1F2937] border-slate-600">
                        {countries.map((country) => {
                          const countryName = typeof country === 'string' ? country : country.name
                          const countryKey = typeof country === 'string' ? country : country.id || country.name
                          return (
                            <SelectItem key={countryKey} value={countryName} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                              {countryName}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="tier-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Tier
                  </label>
                  <Select
                    value={tierFilter ? tierFilter.toString() : ''}
                    onValueChange={(value) => handleFilterChange('tier', value)}
                  >
                    <SelectTrigger id="tier-select" className="w-full bg-[#1F2937] border-slate-600 text-white hover:bg-[#2D3748] focus:ring-[#8C1A10]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1F2937] border-slate-600">
                      {[1, 2, 3, 4, 5].map((tier) => (
                        <SelectItem key={tier} value={tier.toString()} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                          Tier {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="confederation-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Confederación
                  </label>
                  <Select
                    value={confederationFilter || ''}
                    onValueChange={(value) => handleFilterChange('confederation', value)}
                  >
                    <SelectTrigger id="confederation-select" className="w-full bg-[#1F2937] border-slate-600 text-white hover:bg-[#2D3748] focus:ring-[#8C1A10]">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1F2937] border-slate-600">
                      {confederations.map((conf) => (
                        <SelectItem key={conf} value={conf} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                          {conf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-[#8C1A10] mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Competiciones</p>
                  <p className="text-2xl font-bold text-[#D6DDE6]">
                    {totalCount ?? competitions.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {hookError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 mb-4">{hookError.message}</p>
            <Button onClick={refresh}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Competition Table */}
        <CompetitionTable
          competitions={sortedCompetitions}
          selectedCategories={categories}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          loading={false}
          darkMode={true}
          onEdit={(competitionId) => router.push(`/admin/competiciones/${competitionId}/editar`)}
          onDelete={(competitionId) => setShowDeleteConfirm(competitionId)}
        />

        {/* Infinite Scroll Observer Target */}
        {hasMore && (
          <div
            ref={observerTarget}
            className="flex items-center justify-center py-8"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8C1A10]"></div>
              <span>Cargando más competiciones...</span>
            </div>
          </div>
        )}

        {/* Mostrar total cargadas */}
        {!hasMore && competitions.length > 0 && (
          <div className="text-center py-6 text-slate-400">
            <p>
              Mostrando {competitions.length} de {totalCount ?? competitions.length} competiciones
            </p>
          </div>
        )}

        {/* Note: Removed old pagination - now using infinite scroll */}
        {/* Note: using infinite scroll interactions instead */ }

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="bg-[#131921] border-slate-700 max-w-md w-full mx-4">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#D6DDE6] mb-4">
                  Confirmar Eliminación
                </h3>
                <p className="text-gray-400 mb-6">
                  ¿Estás seguro de que quieres eliminar esta competición? Esta acción no se puede deshacer.
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setShowDeleteConfirm(null)}
                    variant="outline" className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700">
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
