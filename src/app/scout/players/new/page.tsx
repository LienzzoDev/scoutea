'use client'

import ScoutNavbar from '@/components/layout/scout-navbar'
import { PlayerDetailsForm } from '@/components/scout/player-details-form'

export default function NewPlayerPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Scout</span>
          <span>›</span>
          <span>Players</span>
          <span>›</span>
          <span className="text-[#000000]">Add Player</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">
          Add New Player
        </h1>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Los jugadores que añadas aparecerán inmediatamente en tu lista personal. Sin embargo, solo serán visibles para los miembros una vez que el administrador los haya aprobado.
          </p>
        </div>

        {/* Form */}
        <PlayerDetailsForm />
      </main>
    </div>
  )
}