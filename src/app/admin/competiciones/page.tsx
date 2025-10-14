'use client'

import { Search, Filter, Plus, Edit, Trash2, Globe } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingPage, LoadingCard } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Competition {
  id: string
  name: string
  short_name: string | null
  country_id: string
  tier: number
  confederation: string | null
  season_format: string | null
  country: {
    name: string
    code: string
  }
}

interface CompetitionFilters {
  search?: string
  country_id?: string
  tier?: number
  confederation?: string
}

export default function CompeticionesPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [filters, setFilters] = useState<CompetitionFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Estados para datos
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Estados para opciones de filtros
  const [countries, setCountries] = useState<Array<{id: string, name: string}>>([])
  const [confederations, setConfederations] = useState<string[]>([])

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

  // Cargar competiciones
  const loadCompetitions = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.country_id) params.append('country_id', filters.country_id)
      if (filters.tier) params.append('tier', filters.tier.toString())
      if (filters.confederation) params.append('confederation', filters.confederation)
      params.append('page', currentPage.toString())
      params.append('limit', '10')

      const response = await fetch(`/api/competitions?${params}`)

      if (!response.ok) {
        throw new Error('Error al cargar competiciones')
      }

      const data = await response.json()
      setCompetitions(data.competitions || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      loadCompetitions()
    }
  }, [isSignedIn, filters, currentPage])

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm }))
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : (key === 'tier' ? parseInt(value) : value)
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setCurrentPage(1)
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
      loadCompetitions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

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
                  onClick={handleSearch}
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Buscar
                </Button>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Limpiar
                </Button>
              </div>
            </div>

            {/* Filtros avanzados */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    País
                  </label>
                  <Select
                    value={filters.country_id || undefined}
                    onValueChange={(value) => handleFilterChange('country_id', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tier
                  </label>
                  <Select
                    value={filters.tier?.toString() || undefined}
                    onValueChange={(value) => handleFilterChange('tier', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((tier) => (
                        <SelectItem key={tier} value={tier.toString()}>
                          Tier {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confederación
                  </label>
                  <Select
                    value={filters.confederation || undefined}
                    onValueChange={(value) => handleFilterChange('confederation', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      {confederations.map((conf) => (
                        <SelectItem key={conf} value={conf}>
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
                  <p className="text-2xl font-bold text-[#D6DDE6]">{total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de competiciones */}
        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <LoadingCard />
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={loadCompetitions}>
                  Reintentar
                </Button>
              </div>
            ) : !competitions || competitions.length === 0 ? (
              <div className="p-6 text-center">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No se encontraron competiciones</p>
                <Button
                  onClick={() => router.push('/admin/competiciones/nueva')}
                  className="bg-[#8C1A10] hover:bg-[#7A1610] text-white">
                  Crear Primera Competición
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1F2937] border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        País
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Confederación
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Formato
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {competitions.map((competition) => (
                      <tr key={competition.id} className="hover:bg-[#1F2937]">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-[#D6DDE6]">
                              {competition.name}
                            </div>
                            {competition.short_name && (
                              <div className="text-sm text-gray-400">
                                {competition.short_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#D6DDE6]">
                            {competition.country.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {competition.country.code}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#D6DDE6]">
                            Tier {competition.tier}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#D6DDE6]">
                            {competition.confederation || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#D6DDE6]">
                            {competition.season_format || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/competiciones/${competition.id}/editar`)}
                              className="border-slate-600 text-gray-300 hover:bg-slate-700">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowDeleteConfirm(competition.id)}
                              className="border-red-600 text-red-400 hover:bg-red-900">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
                Anterior
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
                Siguiente
              </Button>
            </div>
          </div>
        )}

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
