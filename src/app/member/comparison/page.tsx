'use client'

import { Loader2, Search, User, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import ComparisonStats from '@/components/comparison/ComparisonStats'
import MemberNavbar from '@/components/layout/member-navbar'
import { Button } from '@/components/ui/button'
import FlagIcon from '@/components/ui/flag-icon'
import { Input } from '@/components/ui/input'
import { formatMoneyCompact } from '@/lib/utils/format-money'
import { getValidImageUrl } from '@/lib/utils/image-utils'

// Tipo para los datos de jugador en la comparación
interface ComparisonPlayer {
  id_player: number
  player_name: string | null
  position_player: string | null
  nationality_1: string | null
  nationality_2: string | null
  national_tier: string | null
  team_name: string | null
  team_country: string | null
  team_level: string | null
  date_of_birth: string | Date | null
  photo_coverage: string | null
  player_trfm_value: number | null
  player_rating: number | null
  height: number | null
  foot: string | null
  contract_end: string | Date | null
  team_competition: string | null
  competition_country: string | null
  competition_tier: string | null
  competition_level: string | null
  on_loan: boolean | null
  owner_club: string | null
  agency: string | null
}

// Calcular edad desde fecha de nacimiento
const calculateAge = (dateOfBirth: Date | string | null): number | null => {
  if (!dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Formatear valor de mercado
const formatMarketValue = (value: number | null | undefined) => {
  if (!value) return '-'
  return formatMoneyCompact(value)
}

const formatDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('es-ES') : '-'

interface InfoRow {
  label: string
  display1: string
  display2: string
  color1: string
  color2: string
}

// Valores superiores se pintan verdes, inferiores rojos, empates/guiones negros.
// Sólo tiene sentido comparar valores numéricos — para textos dejamos todo negro.
const compareNumeric = (
  n1: number | null | undefined,
  n2: number | null | undefined,
  higherIsBetter = true,
): { color1: string; color2: string } => {
  const BLACK = 'text-[#000000]'
  const GREEN = 'text-green-600'
  const RED = 'text-red-600'
  if (n1 == null || n2 == null) return { color1: BLACK, color2: BLACK }
  if (n1 === n2) return { color1: BLACK, color2: BLACK }
  const p1Better = higherIsBetter ? n1 > n2 : n1 < n2
  return {
    color1: p1Better ? GREEN : RED,
    color2: p1Better ? RED : GREEN,
  }
}

const buildInfoRows = (
  p1: ComparisonPlayer | null,
  p2: ComparisonPlayer | null,
): InfoRow[] => {
  if (!p1 || !p2) return []
  const BLACK = 'text-[#000000]'
  const text = (v: unknown): string =>
    v === null || v === undefined || v === '' ? '-' : String(v)
  const row = (
    label: string,
    display1: string,
    display2: string,
    colors: { color1: string; color2: string } = { color1: BLACK, color2: BLACK },
  ): InfoRow => ({ label, display1, display2, ...colors })

  const contract1 = p1.contract_end ? new Date(p1.contract_end).getTime() : null
  const contract2 = p2.contract_end ? new Date(p2.contract_end).getTime() : null

  return [
    row(
      'Fecha de nacimiento',
      p1.date_of_birth
        ? `${formatDate(p1.date_of_birth)} (${calculateAge(p1.date_of_birth)})`
        : '-',
      p2.date_of_birth
        ? `${formatDate(p2.date_of_birth)} (${calculateAge(p2.date_of_birth)})`
        : '-',
      // Más joven es mejor → higherIsBetter=false
      compareNumeric(calculateAge(p1.date_of_birth), calculateAge(p2.date_of_birth), false),
    ),
    row('Position', text(p1.position_player), text(p2.position_player)),
    row('Foot', text(p1.foot), text(p2.foot)),
    row(
      'Height',
      p1.height ? `${p1.height} cm` : '-',
      p2.height ? `${p2.height} cm` : '-',
      compareNumeric(p1.height, p2.height),
    ),
    row('Nationality 1', text(p1.nationality_1), text(p2.nationality_1)),
    row('Nationality 2', text(p1.nationality_2), text(p2.nationality_2)),
    row('International', text(p1.national_tier), text(p2.national_tier)),
    row('Team', text(p1.team_name), text(p2.team_name)),
    row('Team Level', text(p1.team_level), text(p2.team_level)),
    row('Competition', text(p1.team_competition), text(p2.team_competition)),
    row('Competition Country', text(p1.competition_country), text(p2.competition_country)),
    row('Competition Tier', text(p1.competition_tier), text(p2.competition_tier)),
    row('Competition Level', text(p1.competition_level), text(p2.competition_level)),
    row(
      'On Loan',
      p1.on_loan === true ? 'Yes' : p1.on_loan === false ? 'No' : '-',
      p2.on_loan === true ? 'Yes' : p2.on_loan === false ? 'No' : '-',
    ),
    row('Owner Club', text(p1.owner_club), text(p2.owner_club)),
    row(
      'Contract End',
      formatDate(p1.contract_end),
      formatDate(p2.contract_end),
      compareNumeric(contract1, contract2),
    ),
    row(
      'TRFM Value',
      formatMarketValue(p1.player_trfm_value),
      formatMarketValue(p2.player_trfm_value),
      compareNumeric(p1.player_trfm_value, p2.player_trfm_value),
    ),
    row('Agent', text(p1.agency), text(p2.agency)),
  ]
}

// Componente de tarjeta de selección de jugador (extraído para evitar re-renders)
function PlayerSelectionCard({
  selectedPlayer,
  setSelectedPlayer,
  search,
  setSearch,
  searchResults,
  isSearching,
  playerNumber,
}: {
  selectedPlayer: ComparisonPlayer | null
  setSelectedPlayer: (player: ComparisonPlayer | null) => void
  search: string
  setSearch: (search: string) => void
  searchResults: ComparisonPlayer[]
  isSearching: boolean
  playerNumber: number
}) {
  return (
    <div className="bg-white rounded-lg p-8 border border-[#e7e7e7]">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center overflow-hidden">
          {selectedPlayer ? (
            selectedPlayer.photo_coverage && getValidImageUrl(selectedPlayer.photo_coverage) ? (
              <Image
                src={getValidImageUrl(selectedPlayer.photo_coverage)!}
                alt={selectedPlayer.player_name || ''}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                <User className="w-12 h-12 text-gray-600" />
              </div>
            )
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-[#000000] mb-2">
          {selectedPlayer ? selectedPlayer.player_name : `Select player ${playerNumber}`}
        </h3>

        {selectedPlayer && (
          <div className="text-sm text-[#6d6d6d] mb-4">
            <p>
              {calculateAge(selectedPlayer.date_of_birth)} years •{' '}
              {selectedPlayer.nationality_1 || 'Unknown'}
            </p>
            <p>
              {selectedPlayer.position_player || 'Unknown'} •{' '}
              {selectedPlayer.team_name || 'Unknown'}
            </p>
            <p>Rating: {selectedPlayer.player_rating || '-'}/100</p>
            <p>Value: {formatMarketValue(selectedPlayer.player_trfm_value)}</p>
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
          <Input
            placeholder="Search player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
            disabled={!!selectedPlayer}
          />
        </div>

        <div className="space-y-2">
          {selectedPlayer ? (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPlayer(null)
                setSearch('')
              }}
              className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white"
            >
              Clear Selection
            </Button>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#8c1a10]" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((player) => (
                  <Button
                    key={player.id_player}
                    variant="outline"
                    onClick={() => {
                      setSelectedPlayer(player)
                      setSearch(player.player_name || '')
                    }}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 justify-start gap-3"
                  >
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      {player.photo_coverage && getValidImageUrl(player.photo_coverage) ? (
                        <Image
                          src={getValidImageUrl(player.photo_coverage)!}
                          alt={player.player_name || ''}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="text-left truncate">
                      <div className="font-medium truncate">{player.player_name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {player.team_name} • {player.position_player}
                      </div>
                    </div>
                  </Button>
                ))
              ) : search.length >= 2 ? (
                <p className="text-[#6d6d6d] text-sm text-center py-2">
                  No players found
                </p>
              ) : search.length > 0 ? (
                <p className="text-[#6d6d6d] text-sm text-center py-2">
                  Type at least 2 characters
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente de resumen de jugador seleccionado (extraído para evitar re-renders)
function PlayerSummaryCard({
  player,
  onClear,
}: {
  player: ComparisonPlayer
  onClear: () => void
}) {
  return (
    <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] relative">
      <button
        onClick={onClear}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-stretch gap-6">
        {player.photo_coverage && getValidImageUrl(player.photo_coverage) ? (
          <Image
            src={getValidImageUrl(player.photo_coverage)!}
            alt={player.player_name || ''}
            width={144}
            height={144}
            className="w-36 h-36 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-36 h-36 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-16 h-16 text-gray-600" />
          </div>
        )}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-[#000000] truncate">{player.player_name}</h3>
          <p className="text-[#6d6d6d] text-sm mt-1">
            {calculateAge(player.date_of_birth)} Years
          </p>
          <div className="flex items-center gap-2 mt-2">
            {player.nationality_1 && (
              <FlagIcon nationality={player.nationality_1} size="sm" />
            )}
            <span className="text-[#6d6d6d] text-sm truncate">{player.nationality_1}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {player.player_rating || '-'}
              </span>
            </div>
            <span className="text-sm text-[#000000] truncate">
              {player.position_player} | {formatMarketValue(player.player_trfm_value)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlayerComparisonPage() {
  const _router = useRouter()
  const [activeTab, setActiveTab] = useState('info')
  const [selectedPlayer1, setSelectedPlayer1] = useState<ComparisonPlayer | null>(null)
  const [selectedPlayer2, setSelectedPlayer2] = useState<ComparisonPlayer | null>(null)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')
  const [searchResults1, setSearchResults1] = useState<ComparisonPlayer[]>([])
  const [searchResults2, setSearchResults2] = useState<ComparisonPlayer[]>([])
  const [isSearching1, setIsSearching1] = useState(false)
  const [isSearching2, setIsSearching2] = useState(false)

  // Función de búsqueda de jugadores
  const searchPlayers = async (
    query: string,
    setResults: (results: ComparisonPlayer[]) => void,
    setLoading: (loading: boolean) => void
  ) => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/players/search-simple?search=${encodeURIComponent(query)}&limit=10`
      )
      const data = await response.json()
      setResults(data.data || [])
    } catch (error) {
      console.error('Error searching players:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce para búsqueda 1
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedPlayer1) {
        searchPlayers(search1, setSearchResults1, setIsSearching1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search1, selectedPlayer1])

  // Debounce para búsqueda 2
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedPlayer2) {
        searchPlayers(search2, setSearchResults2, setIsSearching2)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search2, selectedPlayer2])

  const bothPlayersSelected = selectedPlayer1 && selectedPlayer2

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <MemberNavbar />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-[#6d6d6d]">
            <span
              className="hover:text-[#8c1a10] cursor-pointer"
              onClick={() => _router.push('/member/dashboard')}
            >
              Wonderkids
            </span>
            <span className="mx-2">›</span>
            <span className="text-[#000000]">Comparison</span>
          </nav>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#000000] mb-8">Comparison</h1>

        {/* Tabs */}
        <div className="flex space-x-8 mb-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'text-[#000000] border-[#8c1a10]'
                : 'text-[#6d6d6d] border-transparent hover:text-[#000000]'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => bothPlayersSelected && setActiveTab('stats')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'text-[#000000] border-[#8c1a10]'
                : 'text-[#6d6d6d] border-transparent hover:text-[#000000]'
            } ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!bothPlayersSelected}
          >
            Stats
          </button>
        </div>

        {!bothPlayersSelected ? (
          /* Player Selection Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <PlayerSelectionCard
              selectedPlayer={selectedPlayer1}
              setSelectedPlayer={setSelectedPlayer1}
              search={search1}
              setSearch={setSearch1}
              searchResults={searchResults1}
              isSearching={isSearching1}
              playerNumber={1}
            />
            <PlayerSelectionCard
              selectedPlayer={selectedPlayer2}
              setSelectedPlayer={setSelectedPlayer2}
              search={search2}
              setSearch={setSearch2}
              searchResults={searchResults2}
              isSearching={isSearching2}
              playerNumber={2}
            />
          </div>
        ) : (
          /* Comparison View */
          <div>
            {/* Player Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <PlayerSummaryCard
                player={selectedPlayer1}
                onClear={() => {
                  setSelectedPlayer1(null)
                  setSearch1('')
                }}
              />
              <PlayerSummaryCard
                player={selectedPlayer2}
                onClear={() => {
                  setSelectedPlayer2(null)
                  setSearch2('')
                }}
              />
            </div>

            {/* Detailed Comparison */}
            <div className="bg-white rounded-lg border border-[#e7e7e7]">
              {activeTab === 'info' && (
                <div className="p-6">
                  {/* Header Row */}
                  <div className="grid grid-cols-3 gap-8 py-3 border-b-2 border-gray-200 mb-4">
                    <div className="text-[#6d6d6d] font-medium">Player Info</div>
                    <div className="text-[#000000] font-semibold text-center">
                      {selectedPlayer1?.player_name}
                    </div>
                    <div className="text-[#000000] font-semibold text-center">
                      {selectedPlayer2?.player_name}
                    </div>
                  </div>

                  {/* Comparison Rows */}
                  <div className="space-y-0">
                    {buildInfoRows(selectedPlayer1, selectedPlayer2).map((row, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-3 gap-8 py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-[#6d6d6d] font-medium">{row.label}</div>
                        <div className={`text-center ${row.color1} ${row.color1 !== 'text-[#000000]' ? 'font-semibold' : ''}`}>
                          {row.display1}
                        </div>
                        <div className={`text-center ${row.color2} ${row.color2 !== 'text-[#000000]' ? 'font-semibold' : ''}`}>
                          {row.display2}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && selectedPlayer1 && selectedPlayer2 && (
                <ComparisonStats
                  player1Id={String(selectedPlayer1.id_player)}
                  player2Id={String(selectedPlayer2.id_player)}
                  player1Name={selectedPlayer1.player_name || 'Player 1'}
                  player2Name={selectedPlayer2.player_name || 'Player 2'}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
