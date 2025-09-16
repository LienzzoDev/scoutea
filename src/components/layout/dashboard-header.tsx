'use client'

import { UserButton, SignOutButton } from '@clerk/nextjs'
import { useAuth, useUser } from '@clerk/nextjs'
import { 
  Menu,
  X,
  Users
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { getUserRole } from '@/lib/auth/user-role'

export default function DashboardHeader() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Obtener el rol del usuario
  const userRole = getUserRole(user)
  const isAdmin = userRole === 'admin'

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleSignOut = () => {
    // Cerrar sesión y redirigir
    router.push('/login')
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <header className="bg-[#131921] border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y navegación principal */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img
                className="h-8 w-auto"
                src="/logo-nav.png"
                alt="Scoutea Logo"
              />
            </div>
            
            {/* Navegación desktop */}
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <a href="/admin/dashboard" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                Dashboard
              </a>
              <a href="/admin/jugadores" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                Jugadores
              </a>
              <a href="/admin/equipos" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                Equipos
              </a>
              <a href="/admin/torneos" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                Torneos
              </a>
              <a href="/admin/dashboard" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                Analytics
              </a>
              <a href="/admin/dashboard" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                Configuración
              </a>
            </nav>
          </div>

          {/* Botón de menú móvil */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-gray-400 hover:text-[#D6DDE6]"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Usuario y acciones */}
          <div className="flex items-center space-x-4">
            {/* Botón para ir a la sección de miembros - Solo visible para usuarios admin */}
            {isAdmin && (
              <Button
                onClick={() => router.push('/member/dashboard')}
                className="bg-[#8c1a10] hover:bg-[#6d1410] text-white text-sm px-3 py-1.5 flex items-center gap-2"
                size="sm"
              >
                <Users className="w-4 h-4" />
                Miembros
              </Button>
            )}
            
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
            <SignOutButton>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400"
                onClick={handleSignOut}
              >
                Cerrar Sesión
              </Button>
            </SignOutButton>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#131921] border-t border-slate-700">
            {/* Botón para ir a la sección de miembros - Solo visible para usuarios admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  router.push('/member/dashboard')
                }}
                className="w-full text-left text-[#8c1a10] hover:text-[#6d1410] block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Ir a Miembros
              </button>
            )}
            
            <a href="/admin/dashboard" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              Dashboard
            </a>
            <a href="/admin/jugadores" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              Jugadores
            </a>
            <a href="/admin/equipos" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              Equipos
            </a>
            <a href="/admin/torneos" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              Torneos
            </a>
            <a href="/admin/dashboard" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              Analytics
            </a>
            <a href="/admin/dashboard" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              Configuración
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
