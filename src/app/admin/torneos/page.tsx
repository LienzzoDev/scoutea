'use client'

import { Search, Filter, Plus, Edit, Trash2, Calendar, MapPin, Trophy, FileText } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingPage, LoadingCard } from "@/components/ui/loading-spinner"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useTournaments, TorneoFilters, Torneo } from "@/hooks/tournament/useTournaments"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TorneosPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const _router = useRouter()
  const searchParams = useSearchParams()
  const [_selectedTorneo, _setSelectedTorneo] = useState<Torneo | null>(null)
  const [_isModalOpen, _setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [filters, setFilters] = useState<TorneoFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOptions, setFilterOptions] = useState<Record<string, unknown> | null>(null)

  const {
    torneos,
    loading,
    error,
    total,
    page: _page,
    totalPages,
    searchTorneos,
    deleteTorneo,
    clearError: _clearError
  } = useTournaments()

  // Cargar torneos al montar el componente
  useEffect(() => {
    if (isSignedIn) {
      searchTorneos(filters, currentPage, 10)
    }
  }, [isSignedIn, searchTorneos, filters, currentPage])

  // Recargar datos cuando se regresa de una edición o creación
  useEffect(() => {
    const updated = searchParams.get('updated')
    const created = searchParams.get('created')
    
    if ((updated === 'true' || created === 'true') && isSignedIn) {
      console.log(`🔄 Recargando torneos después de ${updated ? 'actualización' : 'creación'}`)
      searchTorneos(filters, currentPage, 10)
      // Limpiar el parámetro de la URL
      _router.replace('/admin/torneos', { scroll: false })
    }
  }, [searchParams, isSignedIn, filters, currentPage, searchTorneos, _router])

  // Recargar datos cuando se regresa de una edición (fallback)
  useEffect(() => {
    const handleFocus = () => {
      // Recargar datos cuando la ventana recupera el foco
      if (isSignedIn && !loading) {
        console.log('🔄 Recargando torneos al recuperar foco de ventana')
        searchTorneos(filters, currentPage, 10)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isSignedIn, loading, filters, currentPage, searchTorneos])

  // Cargar opciones de filtros
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/torneos/filters')
        if (response.ok) {
          const options = await response.json()
          setFilterOptions(options)
        }
      } catch (_error) {
        console.error('Error loading filter options:', error)
      }
    }
    loadFilterOptions()
  }, [])

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm }))
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setCurrentPage(1)
  }

  const handleDelete = async (id: string) => {
    const success = await deleteTorneo(id)
    if (success) {
      setShowDeleteConfirm(null)
      // Recargar la lista
      searchTorneos(filters, currentPage, 10)
    }
  }

  const _formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }


  if (!isLoaded) {
    return <LoadingPage />
  }

  if (!isSignedIn) {
    _router.replace('/login')
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
                Gestión de Torneos
              </h1>
              <p className="text-gray-400">
                Administra todos los torneos del sistema
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() =>_router.push('/admin/torneos/nuevo-torneo')}
                className="bg-[#8C1A10] hover:bg-[#7A1610] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Torneo
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
                    placeholder="Buscar torneos..."
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
                  onClick={() =>setShowFilters(!showFilters)}
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
            {showFilters && filterOptions && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tipo de Torneo
                  </label>
                  <Select
                    value={filters.tipo_torneo || undefined}
                    onValueChange={(value) => handleFilterChange('tipo_torneo', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.tiposTorneo.map((tipo: string) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Categoría
                  </label>
                  <Select
                    value={filters.categoria || undefined}
                    onValueChange={(value) => handleFilterChange('categoria', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.categorias.map((categoria: string) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Género
                  </label>
                  <Select
                    value={filters.genero || undefined}
                    onValueChange={(value) => handleFilterChange('genero', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.generos.map((genero: string) => (
                        <SelectItem key={genero} value={genero}>
                          {genero.charAt(0).toUpperCase() + genero.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Estado
                  </label>
                  <Select
                    value={filters.estado || undefined}
                    onValueChange={(value) => handleFilterChange('estado', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.estados.map((estado: string) => (
                        <SelectItem key={estado} value={estado}>
                          {estado.charAt(0).toUpperCase() + estado.slice(1)}
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
                <Trophy className="h-8 w-8 text-[#8C1A10] mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Torneos</p>
                  <p className="text-2xl font-bold text-[#D6DDE6]">{total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#131921] border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-400">En Curso</p>
                  <p className="text-2xl font-bold text-[#D6DDE6]">
                    {torneos?.filter(t => t.estado === 'en_curso').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de torneos */}
        <Card className="bg-[#131921] border-slate-700">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <LoadingCard />
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-400 mb-4">{typeof error === 'string' ? error : error?.message || 'Error desconocido'}</p>
                <Button onClick={() => searchTorneos(filters, currentPage, 10)}>
                  Reintentar
                </Button>
              </div>
            ) : !torneos || torneos.length === 0 ? (
              <div className="p-6 text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No se encontraron torneos</p>
                <Button
                  onClick={() =>_router.push('/admin/torneos/nuevo-torneo')}
                  className="bg-[#8C1A10] hover:bg-[#7A1610] text-white">
                  Crear Primer Torneo
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1F2937] border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Torneo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Competición
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Fechas
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        PDF
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {torneos.map((torneo) => (
                      <tr key={torneo.id_torneo} className="hover:bg-[#1F2937]">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-[#D6DDE6]">
                              {torneo.nombre}
                            </div>
                            <div className="text-sm text-gray-400">
                              {torneo.organizador && `por ${torneo.organizador}`}
                            </div>
                            {torneo.pais && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {torneo.ciudad && `${torneo.ciudad}, `}
                                {torneo.pais}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {torneo.competition ? (
                            <div>
                              <div className="text-sm font-medium text-[#D6DDE6]">
                                {torneo.competition.competition_name}
                              </div>
                              {torneo.competition.competition_country && (
                                <div className="text-xs text-gray-400">
                                  {torneo.competition.competition_country}
                                </div>
                              )}
                              {torneo.competition.competition_tier && (
                                <div className="text-xs text-gray-500">
                                  {torneo.competition.competition_tier}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Sin competición</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#D6DDE6]">
                            {formatDate(torneo.fecha_inicio)}
                          </div>
                          <div className="text-sm text-gray-400">
                            hasta {formatDate(torneo.fecha_fin)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            console.log(`🔍 Debug UI - Torneo ${torneo.nombre}: pdf_url =`, torneo.pdf_url)
                            return torneo.pdf_url ? (
                              <a
                                href={torneo.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-400 hover:text-blue-300"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Ver PDF
                              </a>
                            ) : (
                              <span className="text-gray-500 text-sm">Sin PDF</span>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>_router.push(`/admin/torneos/${torneo.id_torneo}/editar`)}
                              className="border-slate-600 text-gray-300 hover:bg-slate-700">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>setShowDeleteConfirm(torneo.id_torneo)}
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
                onClick={() =>setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
                Anterior
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                onClick={() =>setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
                  ¿Estás seguro de que quieres eliminar este torneo? Esta acción no se puede deshacer.
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() =>setShowDeleteConfirm(null)}
                    variant="outline" className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700">
                    Cancelar
                  </Button>
                  <Button
                    onClick={() =>handleDelete(showDeleteConfirm)}
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
