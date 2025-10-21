'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createJobOfferSchema, type CreateJobOfferInput } from '@/lib/validation/job-offer-schemas'
import type { JobOffer } from '@/types/job-offer'

interface JobOfferFormProps {
  jobOffer?: JobOffer
  mode: 'create' | 'edit'
}

interface Team {
  id_team: string
  team_name: string
}

export function JobOfferForm({ jobOffer, mode }: JobOfferFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [teamSearch, setTeamSearch] = useState('')
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateJobOfferInput>({
    resolver: zodResolver(createJobOfferSchema),
    defaultValues: jobOffer ? {
      title: jobOffer.title,
      description: jobOffer.description,
      short_description: jobOffer.short_description || undefined,
      team_id: jobOffer.team_id || undefined,
      location: jobOffer.location || undefined,
      remote_allowed: jobOffer.remote_allowed,
      position_type: jobOffer.position_type,
      contract_type: jobOffer.contract_type,
      experience_level: jobOffer.experience_level,
      salary_min: jobOffer.salary_min || undefined,
      salary_max: jobOffer.salary_max || undefined,
      salary_currency: jobOffer.salary_currency || 'EUR',
      salary_period: jobOffer.salary_period || undefined,
      requirements: jobOffer.requirements || undefined,
      responsibilities: jobOffer.responsibilities || undefined,
      benefits: jobOffer.benefits || undefined,
      status: jobOffer.status,
      expires_at: jobOffer.expires_at ? new Date(jobOffer.expires_at).toISOString().split('T')[0] : undefined,
      contact_email: jobOffer.contact_email || undefined,
      contact_phone: jobOffer.contact_phone || undefined,
      application_url: jobOffer.application_url || undefined,
    } : {
      status: 'draft',
      salary_currency: 'EUR',
      remote_allowed: false,
    },
  })

  const teamId = watch('team_id')
  const selectedTeam = teams.find(t => t.id_team === teamId)

  // Cargar equipos al montar el componente
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await fetch('/api/teams?limit=1000')
        if (response.ok) {
          const data = await response.json()
          // La API devuelve { teams: [...] }
          setTeams(data.teams || [])
        }
      } catch (error) {
        console.error('Error loading teams:', error)
      } finally {
        setLoadingTeams(false)
      }
    }

    loadTeams()
  }, [])

  // Inicializar el teamSearch con el nombre del equipo seleccionado
  useEffect(() => {
    if (selectedTeam && teamSearch === '') {
      setTeamSearch(selectedTeam.team_name)
    }
  }, [selectedTeam, teamSearch])

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('#team_search') && !target.closest('.team-dropdown')) {
        setShowTeamDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const onSubmit = async (data: CreateJobOfferInput) => {
    setIsSubmitting(true)

    try {
      const url = mode === 'create' ? '/api/admin/jobs' : `/api/admin/jobs/${jobOffer?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      // Agregar valores por defecto para campos que no están en el formulario
      const payload = {
        ...data,
        position_type: data.position_type || 'Scout',
        contract_type: data.contract_type || 'Full-time',
        experience_level: data.experience_level || 'Senior',
        status: 'published', // Siempre publicar directamente
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/admin/jobs')
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Error: ${error.__error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error al guardar la oferta de trabajo')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtrar equipos basado en la búsqueda
  const filteredTeams = teams.filter(team =>
    team.team_name.toLowerCase().includes(teamSearch.toLowerCase())
  )

  // Manejar la selección de equipo
  const handleTeamSelect = (team: Team | null) => {
    if (team) {
      setValue('team_id', team.id_team)
      setTeamSearch(team.team_name)
    } else {
      setValue('team_id', undefined)
      setTeamSearch('')
    }
    setShowTeamDropdown(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Información básica */}
      <div className="bg-[#131921] p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold text-[#D6DDE6] mb-4">Información básica</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300 mb-2 block">Título *</Label>
            <Input
              id="title"
              {...register('title')}
              className="bg-[#1a2332] border-slate-600 text-white"
              placeholder="Ej: Scout Senior - La Liga"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300 mb-2 block">Descripción *</Label>
            <Textarea
              id="description"
              {...register('description')}
              className="bg-[#1a2332] border-slate-600 text-white"
              placeholder="Descripción de la oferta..."
              rows={6}
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
          </div>
        </div>
      </div>

      {/* Ubicación y equipo */}
      <div className="bg-[#131921] p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold text-[#D6DDE6] mb-4">Ubicación y equipo</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Label htmlFor="team_search" className="text-gray-300 mb-2 block">Equipo</Label>
            <div className="relative">
              <Input
                id="team_search"
                type="text"
                value={teamSearch}
                onChange={(e) => {
                  setTeamSearch(e.target.value)
                  setShowTeamDropdown(true)
                }}
                onFocus={() => setShowTeamDropdown(true)}
                className="bg-[#1a2332] border-slate-600 text-white pr-10"
                placeholder={loadingTeams ? "Cargando..." : "Buscar equipo..."}
                disabled={loadingTeams}
              />
              {teamId && (
                <button
                  type="button"
                  onClick={() => handleTeamSelect(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {showTeamDropdown && teamSearch && filteredTeams.length > 0 && (
              <div className="team-dropdown absolute z-50 w-full mt-1 bg-[#1a2332] border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredTeams.slice(0, 50).map((team) => (
                  <button
                    key={team.id_team}
                    type="button"
                    onClick={() => handleTeamSelect(team)}
                    className="w-full text-left px-4 py-2 text-white hover:bg-[#2a3442] transition-colors"
                  >
                    {team.team_name}
                  </button>
                ))}
                {filteredTeams.length > 50 && (
                  <div className="px-4 py-2 text-gray-400 text-sm">
                    Mostrando 50 de {filteredTeams.length} equipos. Refina tu búsqueda.
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="location" className="text-gray-300 mb-2 block">Ubicación</Label>
            <Input
              id="location"
              {...register('location')}
              className="bg-[#1a2332] border-slate-600 text-white"
              placeholder="Madrid, España"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remote_allowed"
              {...register('remote_allowed')}
              className="rounded border-slate-600"
            />
            <Label htmlFor="remote_allowed" className="text-gray-300 cursor-pointer">
              Permite trabajo remoto
            </Label>
          </div>
        </div>
      </div>

      {/* URL externa */}
      <div className="bg-[#131921] p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold text-[#D6DDE6] mb-4">Información de la oferta</h2>

        <div>
          <Label htmlFor="application_url" className="text-gray-300 mb-2 block">URL de la oferta *</Label>
          <Input
            id="application_url"
            type="url"
            {...register('application_url')}
            className="bg-[#1a2332] border-slate-600 text-white"
            placeholder="https://club.com/careers/scout-position"
          />
          <p className="text-gray-400 text-sm mt-1">Los scouts serán redirigidos a esta URL para ver más detalles y aplicar a la oferta</p>
          {errors.application_url && <p className="text-red-400 text-sm mt-1">{errors.application_url.message}</p>}
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/jobs')}
          disabled={isSubmitting}
          className="border-slate-600 text-gray-300"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
        >
          {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear oferta' : 'Actualizar oferta'}
        </Button>
      </div>
    </form>
  )
}
