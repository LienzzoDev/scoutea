'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { JobOfferTable } from '@/components/admin/JobOfferTable'
import { Button } from '@/components/ui/button'
import type { JobOffer } from '@/types/job-offer'

export default function AdminJobsPage() {
  const router = useRouter()
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadJobOffers()
  }, [])

  const loadJobOffers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/jobs?limit=100')

      if (response.ok) {
        const data = await response.json()
        setJobOffers(data.jobOffers || [])
      } else {
        setError('Error al cargar las ofertas de trabajo')
      }
    } catch (err) {
      console.error('Error loading job offers:', err)
      setError('Error al cargar las ofertas de trabajo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080F17]">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#D6DDE6]">Ofertas de trabajo</h1>
            <p className="text-gray-400 mt-2">Gestiona las ofertas de trabajo para scouts</p>
          </div>
          <Button
            onClick={() => router.push('/admin/jobs/nueva')}
            className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva oferta
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#131921] p-6 rounded-lg border border-slate-700">
            <div className="text-gray-400 text-sm mb-1">Total de ofertas</div>
            <div className="text-3xl font-bold text-[#D6DDE6]">{jobOffers.length}</div>
          </div>
          <div className="bg-[#131921] p-6 rounded-lg border border-slate-700">
            <div className="text-gray-400 text-sm mb-1">Publicadas</div>
            <div className="text-3xl font-bold text-green-400">
              {jobOffers.filter(j => j.status === 'published').length}
            </div>
          </div>
          <div className="bg-[#131921] p-6 rounded-lg border border-slate-700">
            <div className="text-gray-400 text-sm mb-1">Borradores</div>
            <div className="text-3xl font-bold text-yellow-400">
              {jobOffers.filter(j => j.status === 'draft').length}
            </div>
          </div>
          <div className="bg-[#131921] p-6 rounded-lg border border-slate-700">
            <div className="text-gray-400 text-sm mb-1">Total de vistas</div>
            <div className="text-3xl font-bold text-blue-400">
              {jobOffers.reduce((sum, j) => sum + j.views_count, 0)}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 bg-[#131921] rounded-lg border border-slate-700">
            <p className="text-gray-400">Cargando ofertas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-[#131921] rounded-lg border border-slate-700">
            <p className="text-red-400">{error}</p>
            <Button
              onClick={loadJobOffers}
              variant="outline"
              className="mt-4 border-slate-600 text-gray-300"
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <JobOfferTable jobOffers={jobOffers} onDelete={loadJobOffers} />
        )}
      </main>
    </div>
  )
}
