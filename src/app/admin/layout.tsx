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
        {children}
      </AdminGuard>
    </ErrorBoundary>
  )
}

