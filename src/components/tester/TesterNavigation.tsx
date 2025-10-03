'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUserRole } from '@/lib/auth/user-role'
import { isTester, getTesterNavigationRoutes } from '@/lib/utils/tester-utils'

export function TesterNavigation() {
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  
  const userRole = getUserRole(user)
  
  // Solo mostrar para usuarios tester
  if (!userRole || !isTester(userRole)) {
    return null
  }

  const routes = getTesterNavigationRoutes()
  const isInMemberArea = pathname.startsWith('/member')
  const isInScoutArea = pathname.startsWith('/scout')

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Tester Mode
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        Navegación rápida entre áreas:
      </p>
      
      <div className="space-y-2">
        {routes.map((route) => {
          const isActive = 
            (route.href.startsWith('/member') && isInMemberArea) ||
            (route.href.startsWith('/scout') && isInScoutArea)
            
          return (
            <Button
              key={route.href}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => router.push(route.href)}
              disabled={isActive}
            >
              {route.label}
              {isActive && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Actual
                </Badge>
              )}
            </Button>
          )
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Área actual: {isInMemberArea ? 'Members' : isInScoutArea ? 'Scouts' : 'Otra'}
        </p>
      </div>
    </div>
  )
}