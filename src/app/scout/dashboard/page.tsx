'use client'

import ScoutNavbar from '@/components/layout/scout-navbar'
import ScoutPlayersDashboard from '@/components/scout/scout-players-dashboard'

export default function ScoutDashboard() {
  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />
      <ScoutPlayersDashboard />
    </div>
  )
}