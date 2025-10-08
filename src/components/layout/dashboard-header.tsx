'use client'

import { UserButton, SignOutButton } from '@clerk/nextjs'
import { useAuth, useUser } from '@clerk/nextjs'
import {
  Menu,
  X,
  Users,
  ChevronDown,
  Shield,
  Search,
  User
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { getUserRole } from '@/lib/auth/user-role'

export default function DashboardHeader() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const _router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAreaDropdown, setShowAreaDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Obtener el rol del usuario
  const userRole = getUserRole(user)
  const isAdmin = userRole === 'admin'

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAreaDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = () => {
    // Cerrar sesión y redirigir
    _router.push('/login')
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
              <img src="/logo-nav.png" alt="Scoutea Logo" className="h-8 w-auto" />
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
            {/* Dropdown para cambiar entre áreas - Solo visible para usuarios admin */}
            {isAdmin && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                  className="bg-[#8c1a10] hover:bg-[#6d1410] text-white text-sm px-3 py-1.5 flex items-center gap-2"
                  size="sm"
                >
                  <Shield className="w-4 h-4" />
                  Cambiar Área
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {/* Dropdown Menu */}
                {showAreaDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="py-2">
                      <button
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#8c1a10] transition-colors flex items-center gap-2"
                        onClick={() => {
                          setShowAreaDropdown(false)
                          _router.push('/member/dashboard')
                        }}
                      >
                        <Users className="w-4 h-4" />
                        Área de Miembros
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#8c1a10] transition-colors flex items-center gap-2"
                        onClick={() => {
                          setShowAreaDropdown(false)
                          _router.push('/scout/dashboard')
                        }}
                      >
                        <Search className="w-4 h-4" />
                        Área de Scouts
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botón de Perfil */}
            <div
              className="w-8 h-8 bg-[#8c1a10] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6d1410] transition-colors"
              onClick={() => _router.push('/admin/profile')}
            >
              <User className="w-4 h-4 text-white" />
            </div>

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
            {/* Botones para cambiar entre áreas - Solo visible para usuarios admin */}
            {isAdmin && (
              <>
                <button
                  onClick={() =>{
                    setIsMenuOpen(false)
                    _router.push('/member/dashboard')
                  }}
                  className="w-full text-left text-[#8c1a10] hover:text-[#6d1410] block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Ir a Miembros
                </button>
                <button
                  onClick={() =>{
                    setIsMenuOpen(false)
                    _router.push('/scout/dashboard')
                  }}
                  className="w-full text-left text-[#8c1a10] hover:text-[#6d1410] block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Ir a Scouts
                </button>
              </>
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
          </div>
        </div>
      )}
    </header>
  )
}
