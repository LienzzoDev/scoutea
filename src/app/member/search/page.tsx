'use client'

import { Search } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import MemberNavbar from "@/components/layout/member-navbar"
import { Input } from "@/components/ui/input"
import PlayerAvatar from "@/components/ui/player-avatar"
import ScoutAvatar from "@/components/ui/scout-avatar"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [results, setResults] = useState<{
    players: any[]
    scouts: any[]
  }>({ players: [], scouts: [] })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'players' | 'scouts'>('all')

  // Realizar búsqueda
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults({ players: [], scouts: [] })
      return
    }

    setLoading(true)
    try {
      const [playersResponse, scoutsResponse] = await Promise.all([
        fetch(`/api/players?page=1&limit=50&filters[player_name]=${encodeURIComponent(term)}`),
        fetch(`/api/scouts?page=1&limit=50&search=${encodeURIComponent(term)}`)
      ])

      const playersData = playersResponse.ok ? await playersResponse.json() : { players: [] }
      const scoutsData = scoutsResponse.ok ? await scoutsResponse.json() : { scouts: [] }

      setResults({
        players: playersData.players || [],
        scouts: scoutsData.scouts || []
      })
    } catch (error) {
      console.error('Error searching:', error)
      setResults({ players: [], scouts: [] })
    } finally {
      setLoading(false)
    }
  }

  // Buscar al cargar la página
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  // Buscar cuando cambie el término
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(searchTerm)
    // Actualizar URL
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('q', searchTerm)
    window.history.pushState({}, '', newUrl.toString())
  }

  const totalResults = results.players.length + results.scouts.length
  const filteredPlayers = activeTab === 'scouts' ? [] : results.players
  const filteredScouts = activeTab === 'players' ? [] : results.scouts

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <MemberNavbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#000000] mb-4">Search Results</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-5 h-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Players & Scouts..."
                className="pl-12 pr-4 py-3 text-lg bg-white border-[#e7e7e7]"
              />
            </div>
          </form>

          {/* Results Summary */}
          {searchTerm && (
            <div className="text-[#6d6d6d] mb-6">
              {loading ? (
                <p>Searching for "{searchTerm}"...</p>
              ) : (
                <p>
                  Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchTerm}"
                  {results.players.length > 0 && ` (${results.players.length} player${results.players.length !== 1 ? 's' : ''})`}
                  {results.players.length > 0 && results.scouts.length > 0 && ', '}
                  {results.scouts.length > 0 && `${results.scouts.length} scout${results.scouts.length !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 mb-8 border-b border-[#e7e7e7]">
          <button 
            className={`pb-2 font-medium transition-colors ${
              activeTab === 'all' 
                ? 'text-[#000000] border-b-2 border-[#000000]' 
                : 'text-[#6d6d6d] hover:text-[#000000]'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All ({totalResults})
          </button>
          <button 
            className={`pb-2 font-medium transition-colors ${
              activeTab === 'players' 
                ? 'text-[#000000] border-b-2 border-[#000000]' 
                : 'text-[#6d6d6d] hover:text-[#000000]'
            }`}
            onClick={() => setActiveTab('players')}
          >
            Players ({results.players.length})
          </button>
          <button 
            className={`pb-2 font-medium transition-colors ${
              activeTab === 'scouts' 
                ? 'text-[#000000] border-b-2 border-[#000000]' 
                : 'text-[#6d6d6d] hover:text-[#000000]'
            }`}
            onClick={() => setActiveTab('scouts')}
          >
            Scouts ({results.scouts.length})
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10]"></div>
            <span className="ml-3 text-[#6d6d6d]">Searching...</span>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <div className="space-y-6">
            {/* Players */}
            {filteredPlayers.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[#000000] mb-4">Players</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayers.map((player) => (
                    <div
                      key={player.id_player}
                      className="bg-white rounded-lg p-4 border border-[#e7e7e7] cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/member/player/${player.id_player}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <PlayerAvatar player={player} size="md" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#000000]">{player.player_name}</h3>
                          <p className="text-sm text-[#6d6d6d]">
                            {player.position_player && `${player.position_player} • `}
                            {player.nationality_1 || 'Unknown'}
                          </p>
                        </div>
                        {player.player_rating && (
                          <div className="text-lg font-bold text-[#8c1a10]">
                            {player.player_rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-[#6d6d6d]">
                        <p>{player.team_name || 'No team'}</p>
                        {player.age && <p>{player.age} years old</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scouts */}
            {filteredScouts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[#000000] mb-4">Scouts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredScouts.map((scout) => (
                    <div
                      key={scout.id_scout}
                      className="bg-white rounded-lg p-4 border border-[#e7e7e7] cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/member/scout/${scout.id_scout}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <ScoutAvatar scout={scout} size="md" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#000000]">{scout.scout_name || scout.name}</h3>
                          <p className="text-sm text-[#6d6d6d]">
                            {scout.nationality || 'Unknown nationality'}
                          </p>
                        </div>
                        {scout.scout_elo && (
                          <div className="text-lg font-bold text-[#8c1a10]">
                            {scout.scout_elo.toFixed(0)}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-[#6d6d6d]">
                        {scout.total_reports && <p>{scout.total_reports} reports</p>}
                        {scout.country && <p>{scout.country}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && totalResults === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-[#6d6d6d] text-lg mb-2">No results found for "{searchTerm}"</p>
                <p className="text-[#6d6d6d] text-sm">Try searching with different keywords</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}