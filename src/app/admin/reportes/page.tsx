'use client'

import DashboardHeader from '@/components/layout/dashboard-header'
import { AdminReportForm } from '@/components/admin/AdminReportForm'

export default function AdminReportesPage() {
  return (
    <div className="min-h-screen bg-[#080F17]">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Admin</span>
          <span>›</span>
          <span className="text-[#D6DDE6]">Reportes</span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#D6DDE6] mb-2">
            Crear Reporte para Scout
          </h1>
          <p className="text-[#6d6d6d]">
            Crea un reporte en nombre de un scout. El reporte aparecerá en el feed del scout seleccionado.
          </p>
        </div>

        {/* Form */}
        <AdminReportForm />
      </main>
    </div>
  )
}
