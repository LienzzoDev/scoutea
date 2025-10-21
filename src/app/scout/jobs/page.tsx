'use client'

import { Briefcase, MapPin, DollarSign, Calendar, Building2, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'

import ScoutNavbar from '@/components/layout/scout-navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { JobOffer } from '@/types/job-offer'

export default function ScoutJobsPage() {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null)

  const [filters, setFilters] = useState({
    search: '',
    position_type: '',
    contract_type: '',
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
    setSelectedJob(job)
    // Increment view count
    try {
      await fetch(`/api/scout/jobs/${job.id}/view`, { method: 'POST' })
    } catch (error) {
      console.error('Error incrementing views:', error)
    }
  }

  // Filtrar ofertas
  const filteredJobs = jobOffers.filter(job => {
    if (filters.search && !job.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !job.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.position_type && job.position_type !== filters.position_type) return false
    if (filters.contract_type && job.contract_type !== filters.contract_type) return false
    if (filters.location && job.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false
    }
    return true
  })

  // Get unique values for filters
  const positionTypes = [...new Set(jobOffers.map(j => j.position_type))].sort()
  const contractTypes = [...new Set(jobOffers.map(j => j.contract_type))].sort()

  const formatSalary = (min?: number | null, max?: number | null, currency = 'EUR', period?: string | null) => {
    if (!min && !max) return 'Salario no especificado'

    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    })

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}${period ? `/${period === 'yearly' ? 'año' : 'mes'}` : ''}`
    }

    return `${formatter.format(min || max || 0)}${period ? `/${period === 'yearly' ? 'año' : 'mes'}` : ''}`
  }

  const formatDate = (date?: Date | string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (selectedJob) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />

        <main className="max-w-4xl mx-auto px-6 py-8">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedJob(null)}
            className="mb-6 text-[#8B0000] hover:text-[#660000]"
          >
            ← Volver a ofertas
          </Button>

          {/* Job Detail */}
          <div className="bg-white rounded-lg border border-[#e7e7e7] overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-[#e7e7e7]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-[#000000] mb-2">{selectedJob.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-[#6d6d6d]">
                    {selectedJob.team && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{selectedJob.team.team_name}</span>
                      </div>
                    )}
                    {selectedJob.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedJob.location}</span>
                        {selectedJob.remote_allowed && <span className="text-[#8B0000]">(Remoto)</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{selectedJob.contract_type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary */}
              <div className="mt-4 p-4 bg-[#f8f7f4] rounded-lg">
                <div className="flex items-center gap-2 text-[#8B0000] font-semibold">
                  <DollarSign className="w-5 h-5" />
                  <span>{formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency, selectedJob.salary_period)}</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              {/* Description */}
              {selectedJob.description && (
                <div>
                  <h2 className="text-xl font-semibold text-[#000000] mb-3">Descripción</h2>
                  <div className="text-[#6d6d6d] whitespace-pre-line">{selectedJob.description}</div>
                </div>
              )}

              {/* Responsibilities */}
              {selectedJob.responsibilities && (
                <div>
                  <h2 className="text-xl font-semibold text-[#000000] mb-3">Responsabilidades</h2>
                  <div className="text-[#6d6d6d] whitespace-pre-line">{selectedJob.responsibilities}</div>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && (
                <div>
                  <h2 className="text-xl font-semibold text-[#000000] mb-3">Requisitos</h2>
                  <div className="text-[#6d6d6d] whitespace-pre-line">{selectedJob.requirements}</div>
                </div>
              )}

              {/* Benefits */}
              {selectedJob.benefits && (
                <div>
                  <h2 className="text-xl font-semibold text-[#000000] mb-3">Beneficios</h2>
                  <div className="text-[#6d6d6d] whitespace-pre-line">{selectedJob.benefits}</div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#f8f7f4] rounded-lg">
                <div>
                  <div className="text-sm text-[#6d6d6d] mb-1">Tipo de posición</div>
                  <div className="font-semibold text-[#000000]">{selectedJob.position_type}</div>
                </div>
                <div>
                  <div className="text-sm text-[#6d6d6d] mb-1">Nivel de experiencia</div>
                  <div className="font-semibold text-[#000000]">{selectedJob.experience_level}</div>
                </div>
                {selectedJob.expires_at && (
                  <div>
                    <div className="text-sm text-[#6d6d6d] mb-1">Fecha de cierre</div>
                    <div className="font-semibold text-[#000000]">{formatDate(selectedJob.expires_at)}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-[#6d6d6d] mb-1">Vistas</div>
                  <div className="font-semibold text-[#000000]">{selectedJob.views_count}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-[#e7e7e7] bg-[#f8f7f4]">
              <div className="flex flex-col sm:flex-row gap-4">
                {selectedJob.application_url ? (
                  <Button
                    onClick={() => window.open(selectedJob.application_url!, '_blank')}
                    className="flex-1 bg-[#8B0000] hover:bg-[#660000] text-white"
                  >
                    Aplicar ahora
                  </Button>
                ) : selectedJob.contact_email ? (
                  <Button
                    onClick={() => window.location.href = `mailto:${selectedJob.contact_email}`}
                    className="flex-1 bg-[#8B0000] hover:bg-[#660000] text-white"
                  >
                    Contactar vía email
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6d6d6d]">Buscar</label>
              <Input
                placeholder="Título o descripción..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="bg-[#f8f7f4] border-[#e7e7e7]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6d6d6d]">Posición</label>
              <Select value={filters.position_type || undefined} onValueChange={(value) => setFilters(prev => ({ ...prev, position_type: value === 'all' ? '' : value }))}>
                <SelectTrigger className="bg-[#f8f7f4] border-[#e7e7e7]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {positionTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6d6d6d]">Tipo de contrato</label>
              <Select value={filters.contract_type || undefined} onValueChange={(value) => setFilters(prev => ({ ...prev, contract_type: value === 'all' ? '' : value }))}>
                <SelectTrigger className="bg-[#f8f7f4] border-[#e7e7e7]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {contractTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {(filters.search || filters.position_type || filters.contract_type || filters.location) && (
            <div className="mt-4 pt-4 border-t border-[#e7e7e7]">
              <button
                onClick={() => setFilters({ search: '', position_type: '', contract_type: '', location: '' })}
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
            {filteredJobs.map(job => (
              <div
                key={job.id}
                onClick={() => handleViewJob(job)}
                className="bg-white rounded-lg p-6 border border-[#e7e7e7] hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#000000] mb-2">{job.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#6d6d6d] mb-3">
                      {job.team && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{job.team.team_name}</span>
                        </div>
                      )}
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                          {job.remote_allowed && <span className="text-[#8B0000]">(Remoto)</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.contract_type}</span>
                      </div>
                      {job.expires_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Expira: {formatDate(job.expires_at)}</span>
                        </div>
                      )}
                    </div>

                    {job.short_description && (
                      <p className="text-[#6d6d6d] mb-3 line-clamp-2">{job.short_description}</p>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="text-[#8B0000] font-semibold">
                        {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-[#6d6d6d]">
                        <Eye className="w-4 h-4" />
                        <span>{job.views_count} vistas</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="bg-[#8B0000] hover:bg-[#660000] text-white ml-4"
                  >
                    Ver detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
