'use client'

import { Edit, Trash2, Eye, MapPin, Briefcase, ExternalLink, Flag } from 'lucide-react'
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
              Puesto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Club / Selección
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Ubicación
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              URL Oferta
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Vistas
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
                  {job.category && (
                    <div className="text-xs text-gray-400 mt-1">{job.category}</div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  {/* Mostrar equipo de BD o club manual */}
                  {job.team?.team_name ? (
                    <div className="text-sm text-gray-300">{job.team.team_name}</div>
                  ) : job.club_name ? (
                    <div className="text-sm text-gray-300">{job.club_name}</div>
                  ) : (
                    <div className="text-sm text-gray-500">-</div>
                  )}
                  {/* Mostrar selección nacional si existe */}
                  {job.national_team && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Flag className="w-3 h-3" />
                      {job.national_team}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  {job.location ? (
                    <div className="text-sm text-gray-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">-</div>
                  )}
                  {job.remote_allowed && (
                    <div className="text-xs text-green-400 mt-1">Remoto permitido</div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {job.application_url ? (
                  <a
                    href={job.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver oferta
                  </a>
                ) : (
                  <div className="text-sm text-gray-500">-</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(job.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Eye className="w-4 h-4" />
                  {job.views_count}
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
