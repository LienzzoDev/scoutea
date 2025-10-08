'use client'

import ScoutNavbar from '@/components/layout/scout-navbar'
import { PlayerDetailsForm } from '@/components/scout/player-details-form'

export default function NewPlayerReportPage() {
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
          <span className="text-[#000000]">New Player</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">
          New Player
        </h1>

        {/* Form */}
        <PlayerDetailsForm />
      </main>
    </div>
  )
}