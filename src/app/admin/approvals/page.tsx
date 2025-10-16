'use client'

import { ApprovalDashboard } from '@/components/admin/ApprovalDashboard'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'

export default function ApprovalsPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()

  // Si no está cargado, mostrar loading
  if (!isLoaded) {
    return <LoadingPage />
  }

  // Si no está autenticado, mostrar nada (ya se está redirigiendo)
  if (!isSignedIn) {
    return null
  }

  return (
    <main className="px-6 py-8 max-w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#D6DDE6]">Aprobaciones Pendientes</h1>
        <p className="text-sm text-slate-400 mt-1">
          Revisar y aprobar contenido creado por scouts
        </p>
      </div>
      <ApprovalDashboard />
    </main>
  )
}
