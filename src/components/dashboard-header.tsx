'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function DashboardHeader() {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    try {
      router.push('/login')
    } catch (error) {
      console.error('Error during logout redirect:', error)
      window.location.href = '/login'
    }
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <header className="border-b border-slate-800 bg-[#080F17]">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <img 
              src="/sports_and_outdoors.svg" 
              alt="Sports & Outdoors" 
              className="w-8 h-8 object-contain"
              style={{ marginRight: '2px' }}
            />
            <img 
              src="/Scouting.png" 
              alt="Scouting" 
              className="w-8 h-8 object-contain"
              style={{ width: 'calc(var(--spacing) * 20)' }}
            />
          </div>
          <nav className="flex space-x-6">
            <a href="/dashboard" className="text-[#D6DDE6] hover:text-gray-300 transition-colors">
              Dashboard
            </a>
            <a href="/dashboard/jugadores" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
              Jugadores
            </a>
            <a href="#" className="text-gray-400 hover:text-[#D6DDE6] transition-colors">
              Configuración
            </a>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Search className="w-5 h-5 text-gray-400" />
          <Avatar className="w-8 h-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-[#FF5733] hover:bg-[#E64A2B] text-white rounded-lg transition-colors text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  )
}
