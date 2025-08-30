'use client'

import { UserButton, SignOutButton } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Users, 
  BarChart3, 
  Settings, 
  Menu,
  X
} from "lucide-react"
import { useState } from 'react'

export default function DashboardHeader() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
                src="/Scouting.png"
                alt="Scoutea Logo"
              />
            </div>
            
            {/* Navegación desktop */}
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <a href="/dashboard" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                <Home className="h-5 w-5 inline mr-2" />
                Dashboard
              </a>
              <a href="/jugadores" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                <Users className="h-5 w-5 inline mr-2" />
                Jugadores
              </a>
              <a href="/dashboard" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                <BarChart3 className="h-5 w-5 inline mr-2" />
                Analytics
              </a>
              <a href="/dashboard" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
                <Settings className="h-5 w-5 inline mr-2" />
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
                className="text-gray-400 hover:text-[#D6DDE6]"
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
            <a href="/dashboard" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              <Home className="h-5 w-5 inline mr-2" />
              Dashboard
            </a>
            <a href="/jugadores" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              <Users className="h-5 w-5 inline mr-2" />
              Jugadores
            </a>
            <a href="/dashboard" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              <BarChart3 className="h-5 w-5 inline mr-2" />
              Analytics
            </a>
            <a href="/dashboard" className="text-gray-400 hover:text-[#D6DDE6] block px-3 py-2 rounded-md text-base font-medium">
              <Settings className="h-5 w-5 inline mr-2" />
              Configuración
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
