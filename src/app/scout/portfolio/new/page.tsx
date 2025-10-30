'use client'

import ScoutNavbar from '@/components/layout/scout-navbar'
import { UnifiedReportForm } from '@/components/scout/unified-report-form'

export default function NewReportPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Scout</span>
          <span>›</span>
          <span>Portfolio</span>
          <span>›</span>
          <span className="text-[#000000]">New Report</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">
          Nuevo Reporte
        </h1>

        {/* Form */}
        <UnifiedReportForm />
      </main>
    </div>
  )
}
