'use client'

import { useState } from 'react'
import { Calendar, MapPin, Users, Tag } from 'lucide-react'
import ScoutNavbar from '@/components/layout/scout-navbar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Componente de logo de equipo con múltiples APIs de fallback
const TeamLogo = ({ team, className = "" }: { team: { name: string, id: string, apiId?: number }, className?: string }) => {
  const [currentSource, setCurrentSource] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  // Múltiples fuentes de logos en orden de preferencia
  const logoSources = [
    // Football-data.org API (más confiable)
    `https://crests.football-data.org/${team.apiId}.png`,
    // API-Sports (alternativa)
    `https://media.api-sports.io/football/teams/${team.apiId}.png`,
    // Logo.dev (genérico pero funcional)
    `https://img.logo.dev/${team.name.toLowerCase().replace(/\s+/g, '')}.com?token=pk_X-1ZO13ESWmr-CV9l7hqQ`,
    // Placeholder genérico de fútbol
    `https://via.placeholder.com/96x96/8B0000/FFFFFF?text=${team.name.split(' ').map(w => w[0]).join('').substring(0, 3)}`
  ]
  
  if (hasError || currentSource >= logoSources.length) {
    // Fallback final: mostrar iniciales del equipo en un círculo
    const initials = team.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 3)
      .toUpperCase()
    
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#8B0000] to-[#660000] text-white font-bold text-sm rounded-full ${className}`}>
        {initials}
      </div>
    )
  }
  
  const handleError = () => {
    if (currentSource < logoSources.length - 1) {
      setCurrentSource(prev => prev + 1)
      setIsLoading(true)
    } else {
      setHasError(true)
      setIsLoading(false)
    }
  }
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg animate-pulse">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      )}
      <img
        key={currentSource} // Force re-render when source changes
        src={logoSources[currentSource]}
        alt={`${team.name} logo`}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
      />
    </div>
  )
}

// Datos de equipos con logos de API confiable
const teams = [
  {
    id: 'real-madrid',
    name: 'Real Madrid',
    city: 'Madrid',
    category: 'Primera División',
    offers: 3,
    apiId: 86
  },
  {
    id: 'barcelona',
    name: 'FC Barcelona',
    city: 'Barcelona',
    category: 'Primera División',
    offers: 2,
    apiId: 81
  },
  {
    id: 'atletico',
    name: 'Atlético Madrid',
    city: 'Madrid',
    category: 'Primera División',
    offers: 1,
    apiId: 78
  },
  {
    id: 'sevilla',
    name: 'Sevilla FC',
    city: 'Sevilla',
    category: 'Primera División',
    offers: 2,
    apiId: 559
  },
  {
    id: 'valencia',
    name: 'Valencia CF',
    city: 'Valencia',
    category: 'Primera División',
    offers: 1,
    apiId: 95
  },
  {
    id: 'villarreal',
    name: 'Villarreal CF',
    city: 'Villarreal',
    category: 'Primera División',
    offers: 1,
    apiId: 94
  },
  {
    id: 'betis',
    name: 'Real Betis',
    city: 'Sevilla',
    category: 'Primera División',
    offers: 2,
    apiId: 90
  },
  {
    id: 'sociedad',
    name: 'Real Sociedad',
    city: 'San Sebastián',
    category: 'Primera División',
    offers: 1,
    apiId: 92
  },
  {
    id: 'athletic',
    name: 'Athletic Bilbao',
    city: 'Bilbao',
    category: 'Primera División',
    offers: 1,
    apiId: 77
  },
  {
    id: 'getafe',
    name: 'Getafe CF',
    city: 'Getafe',
    category: 'Primera División',
    offers: 1,
    apiId: 82
  },
  {
    id: 'espanyol',
    name: 'RCD Espanyol',
    city: 'Barcelona',
    category: 'Segunda División',
    offers: 2,
    apiId: 80
  },
  {
    id: 'malaga',
    name: 'Málaga CF',
    city: 'Málaga',
    category: 'Segunda División',
    offers: 1,
    apiId: 89
  }
]

export default function ScoutJobsPage() {
  const [filters, setFilters] = useState({
    date: '',
    city: '',
    team: '',
    category: ''
  })

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  // Filtrar equipos según los filtros aplicados
  const filteredTeams = teams.filter(team => {
    if (filters.city && team.city !== filters.city) return false
    if (filters.team && team.name.toLowerCase().includes(filters.team.toLowerCase()) === false) return false
    if (filters.category && team.category !== filters.category) return false
    return true
  })

  // Obtener ciudades únicas para el filtro
  const cities = [...new Set(teams.map(team => team.city))].sort()
  
  // Obtener categorías únicas para el filtro
  const categories = [...new Set(teams.map(team => team.category))].sort()

  const handleTeamClick = (teamId: string) => {
    setSelectedTeam(teamId)
    // Aquí podrías navegar a una página de detalles del equipo o mostrar las ofertas
    console.log(`Viewing offers for team: ${teamId}`)
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Scout</span>
          <span>›</span>
          <span className="text-[#000000]">Jobs</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">
          Scout Jobs
        </h1>

        {/* Filters Section */}
        <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mb-8">
          <h2 className="text-lg font-semibold text-[#000000] mb-4">Filtros</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fecha */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#6d6d6d]">
                <Calendar className="w-4 h-4" />
                Fecha
              </label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                className="h-10 bg-[#f8f7f4] border-[#e7e7e7]"
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#6d6d6d]">
                <MapPin className="w-4 h-4" />
                Ciudad
              </label>
              <Select value={filters.city || undefined} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}>
                <SelectTrigger className="h-10 bg-[#f8f7f4] border-[#e7e7e7]">
                  <SelectValue placeholder="Seleccionar ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipo */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#6d6d6d]">
                <Users className="w-4 h-4" />
                Equipo
              </label>
              <Input
                placeholder="Buscar equipo..."
                value={filters.team}
                onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
                className="h-10 bg-[#f8f7f4] border-[#e7e7e7]"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#6d6d6d]">
                <Tag className="w-4 h-4" />
                Categoría
              </label>
              <Select value={filters.category || undefined} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="h-10 bg-[#f8f7f4] border-[#e7e7e7]">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.date || filters.city || filters.team || filters.category) && (
            <div className="mt-4 pt-4 border-t border-[#e7e7e7]">
              <button
                onClick={() => setFilters({ date: '', city: '', team: '', category: '' })}
                className="text-sm text-[#8B0000] hover:text-[#660000] font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Teams Grid */}
        <div className="bg-white rounded-lg p-6 border border-[#e7e7e7]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#000000]">
              Equipos Disponibles ({filteredTeams.length})
            </h2>
            {selectedTeam && (
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-sm text-[#6d6d6d] hover:text-[#000000]"
              >
                Ver todos los equipos
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredTeams.map(team => (
              <div
                key={team.id}
                onClick={() => handleTeamClick(team.id)}
                className={`group cursor-pointer bg-white rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                  selectedTeam === team.id 
                    ? 'border-[#8B0000] bg-[#8B0000]/5' 
                    : 'border-[#e7e7e7] hover:border-[#8B0000]/50'
                }`}
              >
                {/* Team Logo */}
                <div className="aspect-square mb-3 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                  <TeamLogo 
                    team={team} 
                    className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-200"
                  />
                </div>

                {/* Team Info */}
                <div className="text-center">
                  <h3 className="font-semibold text-sm text-[#000000] mb-1 line-clamp-2 group-hover:text-[#8B0000] transition-colors">
                    {team.name}
                  </h3>
                  <p className="text-xs text-[#6d6d6d] mb-1">{team.city}</p>
                  <p className="text-xs text-[#6d6d6d] mb-2">{team.category}</p>
                  
                  {/* Offers Badge */}
                  <div className="inline-flex items-center px-2 py-1 bg-[#8B0000] text-white text-xs rounded-full">
                    {team.offers} {team.offers === 1 ? 'oferta' : 'ofertas'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTeams.length === 0 && (
            <div className="text-center py-12">
              <div className="text-[#6d6d6d] mb-4">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg">No se encontraron equipos</p>
                <p className="text-sm">Intenta ajustar los filtros para ver más resultados</p>
              </div>
            </div>
          )}
        </div>

        {/* Selected Team Details */}
        {selectedTeam && (
          <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mt-6">
            {(() => {
              const team = teams.find(t => t.id === selectedTeam)
              if (!team) return null
              
              return (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <TeamLogo 
                      team={team} 
                      className="w-16 h-16 object-contain"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-[#000000]">{team.name}</h2>
                      <p className="text-[#6d6d6d]">{team.city} • {team.category}</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#f8f7f4] rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-[#000000] mb-2">
                      Ofertas Disponibles
                    </h3>
                    <p className="text-[#6d6d6d] mb-4">
                      {team.offers} {team.offers === 1 ? 'oferta disponible' : 'ofertas disponibles'} para este equipo
                    </p>
                    <button className="bg-[#8B0000] text-white px-6 py-2 rounded-lg hover:bg-[#660000] transition-colors">
                      Ver Ofertas
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </main>
    </div>
  )
}