'use client'

import { useUser } from '@clerk/nextjs'

import { Badge } from '@/components/ui/badge'
import { isTester } from '@/lib/auth/user-role'

export function TesterBadge() {
  const { user } = useUser()
  
  if (!isTester(user)) {
    return null
  }

  return (
    <Badge 
      variant="secondary" 
      className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-medium"
    >
      Tester
    </Badge>
  )
}