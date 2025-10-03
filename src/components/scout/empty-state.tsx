'use client'

import { FileSearch, TrendingUp, Users } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: 'search' | 'chart' | 'users'
  actionText?: string
  onAction?: () => void
}

export function EmptyState({ 
  title = 'No hay datos disponibles',
  description = 'No se encontraron datos para mostrar en este momento.',
  icon = 'search',
  actionText,
  onAction
}: EmptyStateProps) {
  const icons = {
    search: FileSearch,
    chart: TrendingUp,
    users: Users
  }

  const IconComponent = icons[icon]

  return (
    <div className='flex flex-col items-center justify-center p-12 text-center'>
      <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
        <IconComponent className='w-8 h-8 text-gray-400' />
      </div>
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
        {title}
      </h3>
      <p className='text-gray-600 mb-6 max-w-md'>
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className='px-4 py-2 bg-[#8B4513] text-white rounded-lg hover:bg-[#7A3F12] transition-colors'
        >
          {actionText}
        </button>
      )}
    </div>
  )
}