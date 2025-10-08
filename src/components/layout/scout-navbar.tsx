'use client'

import { useUser } from '@clerk/nextjs'
import { Search, ChevronDown, User, Shield, Users, FileText, BarChart3, Briefcase } from "lucide-react"
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import { Button } from "@/components/ui/button"
import { getUserRole, isTester } from '@/lib/auth/user-role'
import { TesterBadge } from '@/components/ui/tester-badge'

export default function ScoutNavbar() {
  const _router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [showAreaDropdown, setShowAreaDropdown] = useState(false)
  const areaDropdownRef = useRef<HTMLDivElement>(null)

  // Obtener el rol del usuario
  const userRole = getUserRole(user)
  const isAdmin = userRole === 'admin'
  const isUserTester = isTester(user)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setShowAreaDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Determine current page
  const isPlayersPage = pathname === '/scout/dashboard' || pathname === '/scout/players'
  const isReportsPage = pathname === '/scout/reports'
  const isStatsPage = pathname === '/scout/stats'
  const isJobsPage = pathname === '/scout/jobs'

  return (
    <header className="bg-[#f8f7f4] border-b border-[#e7e7e7] px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo-member.svg" alt="Scouted Logo" className="h-10 w-auto" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
          <span 
            className={`cursor-pointer flex items-center gap-2 ${isPlayersPage ? 'text-[#000000] font-medium' : 'text-[#6d6d6d] hover:text-[#000000]'} transition-colors`}
            onClick={() => _router.push('/scout/dashboard')}
          >
            <Users className="w-4 h-4" />
            Players
          </span>
          
          <span 
            className={`cursor-pointer flex items-center gap-2 ${isReportsPage ? 'text-[#000000] font-medium' : 'text-[#6d6d6d] hover:text-[#000000]'} transition-colors`}
            onClick={() => _router.push('/scout/reports')}
          >
            <FileText className="w-4 h-4" />
            Reports
          </span>
          
          <span 
            className={`cursor-pointer flex items-center gap-2 ${isStatsPage ? 'text-[#000000] font-medium' : 'text-[#6d6d6d] hover:text-[#000000]'} transition-colors`}
            onClick={() => _router.push('/scout/stats')}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </span>
          
          <span 
            className={`cursor-pointer flex items-center gap-2 ${isJobsPage ? 'text-[#000000] font-medium' : 'text-[#6d6d6d] hover:text-[#000000]'} transition-colors`}
            onClick={() => _router.push('/scout/jobs')}
          >
            <Briefcase className="w-4 h-4" />
            Jobs
          </span>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          
          {/* Badge de Tester */}
          <TesterBadge />
          
          {/* Dropdown para cambiar entre áreas - Visible para admin y tester */}
          {(isAdmin || isUserTester) && (
            <div className="relative" ref={areaDropdownRef}>
              <Button
                onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                className="bg-[#8c1a10] hover:bg-[#6d1410] text-white text-sm px-3 py-1.5 flex items-center gap-2" 
                size="sm"
              >
                {isAdmin ? <Shield className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                {isAdmin ? 'Cambiar Área' : 'Alternar Área'}
                <ChevronDown className="w-4 h-4" />
              </Button>
              
              {/* Dropdown Menu */}
              {showAreaDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-[#e7e7e7] rounded-lg shadow-lg z-50 min-w-48">
                  <div className="py-2">
                    {isAdmin && (
                      <button
                        className="w-full text-left px-4 py-2 text-[#6d6d6d] hover:bg-gray-50 hover:text-[#8c1a10] transition-colors flex items-center gap-2"
                        onClick={() => {
                          setShowAreaDropdown(false)
                          _router.push('/admin/dashboard')
                        }}
                      >
                        <Shield className="w-4 h-4" />
                        Área de Admin
                      </button>
                    )}
                    <button
                      className="w-full text-left px-4 py-2 text-[#6d6d6d] hover:bg-gray-50 hover:text-[#8c1a10] transition-colors flex items-center gap-2"
                      onClick={() => {
                        setShowAreaDropdown(false)
                        _router.push('/member/dashboard')
                      }}
                    >
                      <Users className="w-4 h-4" />
                      Área de Miembros
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div
            className="w-8 h-8 bg-[#8c1a10] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6d1410] transition-colors"
            onClick={() => _router.push('/scout/profile')}
          >
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}