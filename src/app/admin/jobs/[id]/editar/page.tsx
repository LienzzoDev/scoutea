'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { JobOfferForm } from '@/components/admin/JobOfferForm'
import { Button } from '@/components/ui/button'
import type { JobOffer } from '@/types/job-offer'

export default function EditJobOfferPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadJobOffer()
    }
  }, [id])

  const loadJobOffer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/jobs/${id}`)

      if (response.ok) {
        const data = await response.json()
        setJobOffer(data)
      } else {
        setError('Oferta de trabajo no encontrada')
      }
    } catch (err) {
      console.error('Error loading job offer:', err)
      setError('Error al cargar la oferta de trabajo')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080F17] flex items-center justify-center">
        <div className="text-gray-400">Cargando...</div>
      </div>
    )
  }

  if (error || !jobOffer) {
    return (
      <div className="min-h-screen bg-[#080F17]">
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-center py-12 bg-[#131921] rounded-lg border border-slate-700">
            <p className="text-red-400 mb-4">{error || 'Oferta no encontrada'}</p>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/jobs')}
              className="border-slate-600 text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a ofertas
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080F17]">
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/jobs')}
            className="text-gray-400 hover:text-[#D6DDE6] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a ofertas
          </Button>

          <h1 className="text-3xl font-bold text-[#D6DDE6]">Editar oferta de trabajo</h1>
          <p className="text-gray-400 mt-2">{jobOffer.title}</p>
        </div>

        {/* Form */}
        <JobOfferForm mode="edit" jobOffer={jobOffer} />
      </main>
    </div>
  )
}
