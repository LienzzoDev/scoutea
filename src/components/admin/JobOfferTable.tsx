'use client'

import { Edit, Trash2, Eye, MapPin, Briefcase, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { JobOffer } from '@/types/job-offer'

interface JobOfferTableProps {
  jobOffers: JobOffer[]
  onDelete?: (id: string) => void
}

export function JobOfferTable({ jobOffers, onDelete }: JobOfferTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta oferta?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/jobs/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete?.(id)
        window.location.reload()
      } else {
        alert('Error al eliminar la oferta')
      }
    } catch (error) {
      console.error('Error deleting job offer:', error)
      alert('Error al eliminar la oferta')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-500',
      published: 'bg-green-500',
      closed: 'bg-red-500',
    }
    const labels = {
      draft: 'Borrador',
      published: 'Publicada',
      closed: 'Cerrada',
    }

    return (
      <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-500'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const formatSalary = (min?: number | null, max?: number | null, currency = 'EUR', period?: string | null) => {
    if (!min && !max) return '-'

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
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES')
  }

  if (jobOffers.length === 0) {
    return (
      <div className="text-center py-12 bg-[#131921] rounded-lg border border-slate-700">
        <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-400 text-lg">No hay ofertas de trabajo</p>
        <p className="text-gray-500 text-sm mt-2">Crea una nueva oferta para comenzar</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-[#131921] rounded-lg border border-slate-700">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-[#1a2332]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Título
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Equipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Posición
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Salario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Vistas/Apps
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Expira
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {jobOffers.map((job) => (
            <tr key={job.id} className="hover:bg-[#1a2332] transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-[#D6DDE6]">{job.title}</div>
                  {job.location && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                      {job.remote_allowed && ' (Remoto)'}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">
                  {job.team?.team_name || '-'}
                </div>
                {job.team?.team_country && (
                  <div className="text-xs text-gray-400">{job.team.team_country}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">{job.position_type}</div>
                <div className="text-xs text-gray-400">{job.contract_type}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(job.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Eye className="w-4 h-4" />
                  {job.views_count} / {job.applications_count}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(job.expires_at)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/jobs/${job.id}/editar`)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                    disabled={deletingId === job.id}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
