import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
}

export function PageContainer({ 
  children, 
  className,
  title,
  description 
}: PageContainerProps) {
  return (
    <div className={cn("container mx-auto px-4 py-6", className)}>
      {title && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}