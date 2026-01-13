'use client'

import { Briefcase, MapPin, Building2, Eye, ExternalLink, Flag } from 'lucide-react'
import { useEffect, useState } from 'react'

import ScoutNavbar from '@/components/layout/scout-navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { JobOffer } from '@/types/job-offer'

export default function ScoutJobsPage() {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    search: '',
    location: '',
  })

  useEffect(() => {
    loadJobOffers()
  }, [])

  const loadJobOffers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/scout/jobs?limit=100')

      if (response.ok) {
        const data = await response.json()
        setJobOffers(data.jobOffers || [])
      }
    } catch (error) {
      console.error('Error loading job offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewJob = async (job: JobOffer) => {
    // Increment view count
    try {
      await fetch(`/api/scout/jobs/${job.id}/view`, { method: 'POST' })
    } catch (error) {
      console.error('Error incrementing views:', error)
    }

    // Redirigir directamente a la URL de la oferta
    if (job.application_url) {
      window.open(job.application_url, '_blank')
    }
  }

  // Filtrar ofertas - solo por título y ubicación (campos que realmente se capturan)
  const filteredJobs = jobOffers.filter(job => {
    if (filters.search && !job.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.location && job.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false
    }
    return true
  })

  // Obtener el nombre del club/equipo
  const getClubName = (job: JobOffer) => {
    if (job.team?.team_name) return job.team.team_name
    if (job.club_name) return job.club_name
    return null
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
          Ofertas de trabajo
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mb-8">
          <h2 className="text-lg font-semibold text-[#000000] mb-4">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6d6d6d]">Buscar por puesto</label>
              <Input
                placeholder="Título del puesto..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="bg-[#f8f7f4] border-[#e7e7e7]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6d6d6d]">Ubicación</label>
              <Input
                placeholder="Ciudad..."
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="bg-[#f8f7f4] border-[#e7e7e7]"
              />
            </div>
          </div>

          {(filters.search || filters.location) && (
            <div className="mt-4 pt-4 border-t border-[#e7e7e7]">
              <button
                onClick={() => setFilters({ search: '', location: '' })}
                className="text-sm text-[#8B0000] hover:text-[#660000] font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#6d6d6d]">Cargando ofertas...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg p-12 border border-[#e7e7e7] text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-[#6d6d6d] opacity-50" />
            <h3 className="text-xl font-semibold text-[#000000] mb-2">No hay ofertas disponibles</h3>
            <p className="text-[#6d6d6d]">Intenta ajustar los filtros o vuelve más tarde</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => {
              const clubName = getClubName(job)

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-lg p-6 border border-[#e7e7e7] hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Puesto */}
                      <h3 className="text-xl font-semibold text-[#000000] mb-1">{job.title}</h3>

                      {/* Categoría */}
                      {job.category && (
                        <p className="text-sm text-[#6d6d6d] mb-3">{job.category}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#6d6d6d] mb-3">
                        {/* Club / Equipo */}
                        {clubName && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{clubName}</span>
                          </div>
                        )}

                        {/* Selección Nacional */}
                        {job.national_team && (
                          <div className="flex items-center gap-1">
                            <Flag className="w-4 h-4" />
                            <span>{job.national_team}</span>
                          </div>
                        )}

                        {/* Ubicación */}
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        )}

                        {/* Remoto */}
                        {job.remote_allowed && (
                          <span className="text-[#8B0000] font-medium">Remoto permitido</span>
                        )}
                      </div>

                      {/* Vistas */}
                      <div className="flex items-center gap-1 text-sm text-[#6d6d6d]">
                        <Eye className="w-4 h-4" />
                        <span>{job.views_count} vistas</span>
                      </div>
                    </div>

                    {/* Botón Ver oferta */}
                    {job.application_url ? (
                      <Button
                        onClick={() => handleViewJob(job)}
                        className="bg-[#8B0000] hover:bg-[#660000] text-white ml-4 flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver oferta
                      </Button>
                    ) : (
                      <span className="text-sm text-[#6d6d6d] ml-4">Sin enlace</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
