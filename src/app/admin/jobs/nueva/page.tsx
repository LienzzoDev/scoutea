'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { JobOfferForm } from '@/components/admin/JobOfferForm'
import { Button } from '@/components/ui/button'

export default function NewJobOfferPage() {
  const router = useRouter()

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

          <h1 className="text-3xl font-bold text-[#D6DDE6]">Nueva oferta de trabajo</h1>
          <p className="text-gray-400 mt-2">Crea una nueva oferta de trabajo para scouts</p>
        </div>

        {/* Form */}
        <JobOfferForm mode="create" />
      </main>
    </div>
  )
}
