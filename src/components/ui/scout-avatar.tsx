'use client'

import EntityAvatar from './entity-avatar'

interface Scout {
  id_scout?: string
  scout_name?: string
  name?: string
  surname?: string
  nationality?: string
  country?: string
  scout_level?: string
  url_profile?: string
}

interface ScoutAvatarProps {
  scout: Scout
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showFlag?: boolean
  className?: string
}

export default function ScoutAvatar({ 
  scout, 
  size = 'md', 
  showFlag = true, 
  className = '' 
}: ScoutAvatarProps) {
  return (
    <EntityAvatar
      entity={scout}
      type="scout"
      size={size}
      showFlag={showFlag}
      showBadge={false}
      className={className}
    />
  )
}