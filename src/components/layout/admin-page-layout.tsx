import { ReactNode } from 'react'
import { PageContainer } from './page-container'

interface AdminPageLayoutProps {
  children: ReactNode
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageLayout({ 
  children, 
  title, 
  description,
  actions 
}: AdminPageLayoutProps) {
  return (
    <PageContainer title={title} description={description}>
      {actions && (
        <div className="flex justify-end mb-6">
          {actions}
        </div>
      )}
      {children}
    </PageContainer>
  )
}