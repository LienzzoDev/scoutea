import { Player } from '@/hooks/usePlayers'
import EntityAvatar from './entity-avatar'

interface PlayerAvatarProps {
  player: Player
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showFlag?: boolean
  showBadge?: boolean
  className?: string
}

export default function PlayerAvatar({ 
  player, 
  size = 'md', 
  showFlag = true, 
  showBadge = true, 
  className = '' 
}: PlayerAvatarProps) {
  return (
    <EntityAvatar
      entity={player}
      type="player"
      size={size}
      showFlag={showFlag}
      showBadge={showBadge}
      className={className}
    />
  )
}