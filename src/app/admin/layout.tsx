import AdminGuard from '@/components/auth/admin-guard'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <AdminGuard>
        <div className="min-h-screen bg-[#080F17]">
          {children}
        </div>
      </AdminGuard>
    </ErrorBoundary>
  )
}

