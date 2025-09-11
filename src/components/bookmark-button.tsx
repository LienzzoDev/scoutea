'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'

interface BookmarkButtonProps {
  entityId: string
  isBookmarked: boolean
  onToggle: (entityId: string) => Promise<boolean>
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function BookmarkButton({
  entityId,
  isBookmarked,
  onToggle,
  disabled = false,
  size = 'md',
  className = ''
}: BookmarkButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (disabled || isLoading) return

    setIsLoading(true)
    try {
      await onToggle(entityId)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const iconSize = sizeClasses[size]

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 ${className}`}
      title={isBookmarked ? 'Remove from list' : 'Add to list'}
    >
      {isLoading ? (
        <div className={`${iconSize} border-2 border-[#8c1a10] border-t-transparent rounded-full animate-spin`} />
      ) : isBookmarked ? (
        <Bookmark className={`${iconSize} text-[#8c1a10] fill-current`} />
      ) : (
        <Bookmark className={`${iconSize} text-white stroke-gray-400 stroke-1`} style={{ fill: 'white' }} />
      )}
    </button>
  )
}