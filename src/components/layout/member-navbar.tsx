'use client'

import { useUser } from '@clerk/nextjs'
import { Search, ChevronDown, User, Shield, X, Users, Lock } from "lucide-react"
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import { useSubscriptionPlan } from '@/components/auth/feature-guard'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PlayerAvatar from "@/components/ui/player-avatar"
import ScoutAvatar from "@/components/ui/scout-avatar"
import { TesterBadge } from '@/components/ui/tester-badge'
import { getUserRole, isTester } from '@/lib/auth/user-role'


interface NavSearchPlayer {
  id_player: number
  player_name: string
  position_player?: string | null
  nationality_1?: string | null
  team_name?: string | null
  photo_url?: string | null
  player_rating?: number | null
  id?: string
  createdAt?: Date
  updatedAt?: Date
}

interface NavSearchScout {
  id_scout: string
  scout_name?: string | null
  name?: string | null
  nationality?: string | null
  country?: string | null
  photo_url?: string | null
  total_reports?: number | null
  scout_elo?: number | null
}

export default function MemberNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [showWonderkidsDropdown, setShowWonderkidsDropdown] = useState(false)
  const [showWonderscoutsDropdown, setShowWonderscoutsDropdown] = useState(false)
  const [showAreaDropdown, setShowAreaDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const wonderscoutsDropdownRef = useRef<HTMLDivElement>(null)
  const areaDropdownRef = useRef<HTMLDivElement>(null)

  // 🔍 ESTADO PARA BÚSQUEDA GLOBAL
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<{
    players: NavSearchPlayer[]
    scouts: NavSearchScout[]
  }>({ players: [], scouts: [] })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Obtener el rol del usuario
  const userRole = getUserRole(user)
  const isAdmin = userRole === 'admin'
  const isUserTester = isTester(user)

  // Obtener el plan de suscripción
  const { plan: subscriptionPlan } = useSubscriptionPlan()
  const isPremiumUser = subscriptionPlan === 'premium' || isAdmin || isUserTester

  // 🔍 FUNCIÓN DE BÚSQUEDA GLOBAL
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults({ players: [], scouts: [] })
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    try {
      // Buscar jugadores y scouts en paralelo
      const [playersResponse, scoutsResponse] = await Promise.all([
        fetch(`/api/simple-players-search?filters[player_name]=${encodeURIComponent(term)}`),
        fetch(`/api/scouts?page=1&limit=5&search=${encodeURIComponent(term)}`)
      ])

      const playersData = playersResponse.ok ? await playersResponse.json() : { players: [] }
      const scoutsData = scoutsResponse.ok ? await scoutsResponse.json() : { scouts: [] }

      setSearchResults({
        players: playersData.players || [],
        scouts: scoutsData.scouts || []
      })
      setShowSearchResults(true)
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults({ players: [], scouts: [] })
    } finally {
      setSearchLoading(false)
    }
  }

  // 🔍 DEBOUNCE PARA LA BÚSQUEDA
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])



  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWonderkidsDropdown(false)
      }
      if (wonderscoutsDropdownRef.current && !wonderscoutsDropdownRef.current.contains(event.target as Node)) {
        setShowWonderscoutsDropdown(false)
      }
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setShowAreaDropdown(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Determine current page
  const isDashboardPage = pathname === '/member/dashboard'
  const isComparisonPage = pathname === '/member/comparison'
  const isPlayerPage = pathname.startsWith('/member/player/')
  const isScoutsPage = pathname === '/member/scouts'
  const isScoutComparisonPage = pathname === '/member/scout-comparison'
  const isScoutPage = pathname.startsWith('/member/scout/')
  const isTournamentsPage = pathname === '/member/torneos'
  const isOnDemandPage = pathname === '/member/on-demand'
  
  // Determine if we're in Wonderkids section (players related pages)
  const isWonderkidsSection = isDashboardPage || isComparisonPage || isPlayerPage
  
  // Determine if we're in Wonderscouts section (scouts related pages)
  const isWonderscoutsSection = isScoutsPage || isScoutComparisonPage || isScoutPage

  return (
    <header className="bg-[#f8f7f4] border-b border-[#e7e7e7] px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Search */}
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => router.push('/member/dashboard')}
          >
            <img src="/logo-member.svg" alt="Scouted Logo" className="h-10 w-auto" />
          </div>

          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
            <Input
              placeholder="Search players and scouts..."
              className="pl-10 pr-10 w-80 bg-[#f8f7f4] border-[#e7e7e7] text-[#6d6d6d]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (searchTerm.trim()) {
                  setShowSearchResults(true)
                }
              }}
            />
            {searchTerm && (
              <button
                onClick={() =>{
                  setSearchTerm('')
                  setShowSearchResults(false)
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] hover:text-[#000000]">                <X className="w-4 h-4" />
              </button>
            )}

            {/* 🔍 RESULTADOS DE BÚSQUEDA */}
            {showSearchResults && (searchResults.players.length > 0 || searchResults.scouts.length > 0 || searchLoading) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e7e7e7] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8c1a10] mx-auto"></div>
                    <p className="text-[#6d6d6d] text-sm mt-2">Buscando...</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {/* JUGADORES */}
                    {searchResults.players.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <h4 className="text-sm font-medium text-[#6d6d6d]">Players</h4>
                        </div>
                        {searchResults.players.map((player) => (
                          <button
                            key={player.id_player}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                            onClick={() => {
                              router.push(`/member/player/${player.id_player}`)
                              setShowSearchResults(false)
                              setSearchTerm('')
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <PlayerAvatar player={player as Parameters<typeof PlayerAvatar>[0]['player']} size="sm" />
                              <div className="flex-1">
                                <p className="font-medium text-[#000000]">{player.player_name}</p>
                                <p className="text-sm text-[#6d6d6d]">
                                  {player.position_player && `${player.position_player} • `}
                                  {player.team_name || 'Sin equipo'} • {player.nationality_1 || 'Desconocido'}
                                </p>
                              </div>
                              {player.player_rating && (
                                <div className="text-sm font-medium text-[#8c1a10]">
                                  {Number(player.player_rating).toFixed(1)}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* SCOUTS — ocultos mientras Wonderscouts está deshabilitado */}
                    {false && searchResults.scouts.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <h4 className="text-sm font-medium text-[#6d6d6d]">Scouts</h4>
                        </div>
                        {searchResults.scouts.map((scout) => (
                          <button
                            key={scout.id_scout}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                            onClick={() => {
                              router.push(`/member/scout/${scout.id_scout}`)
                              setShowSearchResults(false)
                              setSearchTerm('')
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <ScoutAvatar scout={scout as Parameters<typeof ScoutAvatar>[0]['scout']} size="sm" />
                              <div className="flex-1">
                                <p className="font-medium text-[#000000]">{scout.scout_name || scout.name}</p>
                                <p className="text-sm text-[#6d6d6d]">
                                  {scout.nationality && `${scout.nationality} • `}
                                  {scout.total_reports ? `${scout.total_reports} reportes` : 'Scout'}
                                </p>
                              </div>
                              {scout.scout_elo && (
                                <div className="text-sm font-medium text-[#8c1a10]">
                                  {Number(scout.scout_elo).toFixed(0)}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* NO RESULTS */}
                    {searchResults.players.length === 0 && searchResults.scouts.length === 0 && searchTerm.trim() && (
                      <div className="p-4 text-center">
                        <p className="text-[#6d6d6d] text-sm">No se encontraron resultados para &quot;{searchTerm}&quot;</p>
                        <p className="text-[#6d6d6d] text-xs mt-1">Try searching with different keywords</p>
                      </div>
                    )}

                    {/* VER MÁS RESULTADOS */}
                    {(searchResults.players.length > 0 || searchResults.scouts.length > 0) && (
                      <div className="border-t border-gray-100 p-2">
                        <button
                          className="w-full text-center py-2 text-sm text-[#8c1a10] hover:bg-gray-50 rounded"
                          onClick={() =>{
                            // Navegar a una página de resultados completos
                            router.push(`/member/search?q=${encodeURIComponent(searchTerm)}`)
                            setShowSearchResults(false)
                          }}
                        >
                          Ver todos los resultados para &quot;{searchTerm}&quot;</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
          <div className="relative" ref={dropdownRef}>
            <div 
              className={`flex items-center gap-1 cursor-pointer ${
                isWonderkidsSection ? 'text-[#000000] font-medium' : 'text-[#6d6d6d]'
              }`}
              onClick={() => setShowWonderkidsDropdown(!showWonderkidsDropdown)}
            >
              <span>Wonderkids</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            
            {/* Dropdown Menu */}
            {showWonderkidsDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-[#e7e7e7] rounded-lg shadow-lg z-50 min-w-48">
                <div className="py-2">
                  <button
                    className={`w-full text-left px-4 py-2 transition-colors flex items-center justify-between ${
                      pathname === '/member/dashboard'
                        ? 'text-[#000000] bg-gray-50 font-medium'
                        : 'text-[#6d6d6d] hover:bg-gray-50 hover:text-[#000000]'
                    }`}
                    onClick={() => {
                      setShowWonderkidsDropdown(false)
                      router.push('/member/dashboard')
                    }}
                  >
                    <span>Players</span>
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 transition-colors flex items-center justify-between ${
                      pathname === '/member/comparison'
                        ? 'text-[#000000] bg-gray-50 font-medium'
                        : isPremiumUser
                        ? 'text-[#6d6d6d] hover:bg-gray-50 hover:text-[#000000]'
                        : 'text-[#9ca3af] cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (isPremiumUser) {
                        setShowWonderkidsDropdown(false)
                        router.push('/member/comparison')
                      } else {
                        setShowWonderkidsDropdown(false)
                        router.push('/member/upgrade-required')
                      }
                    }}
                  >
                    <span>Comparison</span>
                    {!isPremiumUser && <Lock className="w-3 h-3 text-orange-500" />}
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Wonderscouts oculto: preservamos el código para reactivarlo fácilmente. */}
          {false && <div className="relative" ref={wonderscoutsDropdownRef}>
            <div
              className={`flex items-center gap-1 cursor-pointer ${
                isWonderscoutsSection ? 'text-[#000000] font-medium' : 'text-[#6d6d6d]'
              }`}
              onClick={() => setShowWonderscoutsDropdown(!showWonderscoutsDropdown)}
            >
              <span>Wonderscouts</span>
              <ChevronDown className="w-4 h-4" />
            </div>

            {/* Wonderscouts Dropdown Menu */}
            {showWonderscoutsDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-[#e7e7e7] rounded-lg shadow-lg z-50 min-w-48">
                <div className="py-2">
                  <button
                    className={`w-full text-left px-4 py-2 transition-colors flex items-center justify-between ${
                      pathname === '/member/scouts'
                        ? 'text-[#000000] bg-gray-50 font-medium'
                        : isPremiumUser
                        ? 'text-[#6d6d6d] hover:bg-gray-50 hover:text-[#000000]'
                        : 'text-[#9ca3af] cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (isPremiumUser) {
                        setShowWonderscoutsDropdown(false)
                        router.push('/member/scouts')
                      } else {
                        setShowWonderscoutsDropdown(false)
                        router.push('/member/upgrade-required')
                      }
                    }}
                  >
                    <span>Scouts</span>
                    {!isPremiumUser && <Lock className="w-3 h-3 text-orange-500" />}
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 transition-colors flex items-center justify-between ${
                      pathname === '/member/scout-comparison'
                        ? 'text-[#000000] bg-gray-50 font-medium'
                        : isPremiumUser
                        ? 'text-[#6d6d6d] hover:bg-gray-50 hover:text-[#000000]'
                        : 'text-[#9ca3af] cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (isPremiumUser) {
                        setShowWonderscoutsDropdown(false)
                        router.push('/member/scout-comparison')
                      } else {
                        setShowWonderscoutsDropdown(false)
                        router.push('/member/upgrade-required')
                      }
                    }}
                  >
                    <span>Comparison</span>
                    {!isPremiumUser && <Lock className="w-3 h-3 text-orange-500" />}
                  </button>
                </div>
              </div>
            )}
          </div>}

          <span
            className={`cursor-pointer ${isTournamentsPage ? 'text-[#000000] font-medium' : 'text-[#6d6d6d]'}`}
            onClick={() => router.push('/member/torneos')}
          >
            Tournaments
          </span>
          <span
            className={`cursor-pointer flex items-center gap-1 ${
              isOnDemandPage
                ? 'text-[#000000] font-medium'
                : isPremiumUser
                ? 'text-[#6d6d6d]'
                : 'text-[#9ca3af]'
            }`}
            onClick={() => {
              if (isPremiumUser) {
                router.push('/member/on-demand')
              } else {
                router.push('/member/upgrade-required')
              }
            }}
          >
            <span>On Demand</span>
            {!isPremiumUser && <Lock className="w-3 h-3 text-orange-500" />}
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
                {isAdmin ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
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
                          router.push('/admin/dashboard')
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
                        router.push('/scout/dashboard')
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
          
          <div
            className="w-8 h-8 bg-[#8c1a10] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6d1410] transition-colors"
            onClick={() => router.push('/member/profile')}
          >
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}
