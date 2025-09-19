'use client'

import { Search, User, X } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import MemberNavbar from "@/components/layout/member-navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Player {
  id: number
  name: string
  age: number
  nationality: string
  position: string
  team: string
  rating: number
  marketValue: number
  image?: string
}

export default function PlayerComparisonPage() {
  const _router = useRouter()
  const [activeTab, setActiveTab] = useState('info')
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null)
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')

  // Mock players data
  const mockPlayers: Player[] = [
    {
      id: 1,
      name: "Lionel Messi",
      age: 36,
      nationality: "Argentina",
      position: "RW",
      team: "Inter Miami",
      rating: 93,
      marketValue: 25000000,
      image: "/placeholder.svg?height=48&width=48&query=messi"
    },
    {
      id: 2,
      name: "Cristiano Ronaldo",
      age: 39,
      nationality: "Portugal",
      position: "ST",
      team: "Al Nassr",
      rating: 91,
      marketValue: 15000000
      // No image property - will show placeholder
    },
    {
      id: 3,
      name: "Kylian Mbappé",
      age: 25,
      nationality: "France",
      position: "LW",
      team: "Real Madrid",
      rating: 91,
      marketValue: 180000000,
      image: "/placeholder.svg?height=48&width=48&query=mbappe"
    },
    {
      id: 4,
      name: "Erling Haaland",
      age: 24,
      nationality: "Norway",
      position: "ST",
      team: "Manchester City",
      rating: 91,
      marketValue: 170000000,
      image: "/placeholder.svg?height=48&width=48&query=haaland"
    },
    {
      id: 5,
      name: "Vinicius Jr.",
      age: 24,
      nationality: "Brazil",
      position: "LW",
      team: "Real Madrid",
      rating: 89,
      marketValue: 150000000
      // No image property - will show placeholder
    }
  ]

  const bothPlayersSelected = selectedPlayer1 && selectedPlayer2

  const formatMarketValue = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`
    return `€${value}`
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-[#6d6d6d]">
            <span className="hover:text-[#8c1a10] cursor-pointer" onClick={() => _router.push('/member/dashboard')}>
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
            onClick={() => setActiveTab('stats')}
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
            {/* Player 1 Card */}
            <div className="bg-white rounded-lg p-8 border border-[#e7e7e7]">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  {selectedPlayer1 ? (
                    selectedPlayer1.image ? (
                      <img
                        src={selectedPlayer1.image}
                        alt={selectedPlayer1.name}
                        className="w-full h-full object-cover rounded-lg"
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
                
                <h3 className="text-lg font-semibold text-[#000000] mb-2">{selectedPlayer1 ? selectedPlayer1.name : "Select player 1"}
                </h3>
                
                {selectedPlayer1 && (
                  <div className="text-sm text-[#6d6d6d] mb-4">
                    <p>{selectedPlayer1.age} years • {selectedPlayer1.nationality}</p>
                    <p>{selectedPlayer1.position} • {selectedPlayer1.team}</p>
                    <p>Rating: {selectedPlayer1.rating}/100</p>
                    <p>Value: {formatMarketValue(selectedPlayer1.marketValue)}</p>
                  </div>
                )}

                <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
                  <Input
                    placeholder="Search player..."
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    className="pr-10" />
                </div>

                <div className="space-y-2">
                  {selectedPlayer1 ? (
                    <Button
                      variant="outline"
                      onClick={() =>setSelectedPlayer1(null)}
                      className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white">
                      Clear Selection
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {search1 && mockPlayers
                        .filter(player => player.name.toLowerCase().includes(search1.toLowerCase()))
                        .map((player) => (
                          <Button
                            key={player.id}
                            variant="outline"
                            onClick={() =>setSelectedPlayer1(player)}
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                            {player.name}
                          </Button>
                        ))}
                      {search1 && mockPlayers.filter(player => player.name.toLowerCase().includes(search1.toLowerCase())).length === 0 && (
                        <p className="text-[#6d6d6d] text-sm text-center py-2">No players found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Player 2 Card */}
            <div className="bg-white rounded-lg p-8 border border-[#e7e7e7]">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  {selectedPlayer2 ? (
                    selectedPlayer2.image ? (
                      <img
                        src={selectedPlayer2.image}
                        alt={selectedPlayer2.name}
                        className="w-full h-full object-cover rounded-lg"
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
                
                <h3 className="text-lg font-semibold text-[#000000] mb-2">{selectedPlayer2 ? selectedPlayer2.name : "Select player 2"}
                </h3>
                
                {selectedPlayer2 && (
                  <div className="text-sm text-[#6d6d6d] mb-4">
                    <p>{selectedPlayer2.age} years • {selectedPlayer2.nationality}</p>
                    <p>{selectedPlayer2.position} • {selectedPlayer2.team}</p>
                    <p>Rating: {selectedPlayer2.rating}/100</p>
                    <p>Value: {formatMarketValue(selectedPlayer2.marketValue)}</p>
                  </div>
                )}

                <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
                  <Input
                    placeholder="Search player..."
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                    className="pr-10" />
                </div>

                <div className="space-y-2">
                  {selectedPlayer2 ? (
                    <Button
                      variant="outline"
                      onClick={() =>setSelectedPlayer2(null)}
                      className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white">
                      Clear Selection
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {search2 && mockPlayers
                        .filter(player => player.name.toLowerCase().includes(search2.toLowerCase()))
                        .map((player) => (
                          <Button
                            key={player.id}
                            variant="outline"
                            onClick={() =>setSelectedPlayer2(player)}
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                            {player.name}
                          </Button>
                        ))}
                      {search2 && mockPlayers.filter(player => player.name.toLowerCase().includes(search2.toLowerCase())).length === 0 && (
                        <p className="text-[#6d6d6d] text-sm text-center py-2">No players found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Comparison View */
          <div>
            {/* Player Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Player 1 Summary */}
              <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] relative">
                <button
                  onClick={() =>setSelectedPlayer1(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  {selectedPlayer1?.image ? (
                    <img
                      src={selectedPlayer1.image}
                      alt={selectedPlayer1.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-[#000000]">{selectedPlayer1?.name}</h3>
                    <p className="text-[#6d6d6d] text-sm">{selectedPlayer1?.age} Years</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs">🏳️</span>
                      <span className="text-[#6d6d6d] text-sm">{selectedPlayer1?.nationality}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{selectedPlayer1?.rating}</span>
                      </div>
                      <span className="text-sm text-[#000000]">{selectedPlayer1?.position} | {formatMarketValue(selectedPlayer1?.marketValue || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player 2 Summary */}
              <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] relative">
                <button
                  onClick={() =>setSelectedPlayer2(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  {selectedPlayer2?.image ? (
                    <img
                      src={selectedPlayer2.image}
                      alt={selectedPlayer2.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-[#000000]">{selectedPlayer2?.name}</h3>
                    <p className="text-[#6d6d6d] text-sm">{selectedPlayer2?.age} Years</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs">🏳️</span>
                      <span className="text-[#6d6d6d] text-sm">{selectedPlayer2?.nationality}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{selectedPlayer2?.rating}</span>
                      </div>
                      <span className="text-sm text-[#000000]">{selectedPlayer2?.position} | {formatMarketValue(selectedPlayer2?.marketValue || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Comparison */}
            <div className="bg-white rounded-lg border border-[#e7e7e7]">
              {activeTab === 'info' && (
                <div className="p-6">
                  {/* Header Row */}
                  <div className="grid grid-cols-3 gap-8 py-3 border-b-2 border-gray-200 mb-4">
                    <div className="text-[#6d6d6d] font-medium">Metric</div>
                    <div className="text-[#000000] font-semibold text-center">{selectedPlayer1?.name}</div>
                    <div className="text-[#000000] font-semibold text-center">{selectedPlayer2?.name}</div>
                  </div>

                  {/* Comparison Rows */}
                  <div className="space-y-0">{[
                      { label: "Age", value1: selectedPlayer1?.age || "N/A", value2: selectedPlayer2?.age || "N/A" },
                      { label: "Position", value1: selectedPlayer1?.position || "N/A", value2: selectedPlayer2?.position || "N/A" },
                      { label: "Team", value1: selectedPlayer1?.team || "N/A", value2: selectedPlayer2?.team || "N/A" },
                      { label: "Nationality", value1: selectedPlayer1?.nationality || "N/A", value2: selectedPlayer2?.nationality || "N/A" },
                      { label: "Overall Rating", value1: selectedPlayer1?.rating || "N/A", value2: selectedPlayer2?.rating || "N/A" },
                      { label: "Market Value", value1: formatMarketValue(selectedPlayer1?.marketValue || 0), value2: formatMarketValue(selectedPlayer2?.marketValue || 0) },
                      { label: "Height", value1: "185 cm", value2: "187 cm" },
                      { label: "Weight", value1: "72 kg", value2: "88 kg" },
                      { label: "Preferred Foot", value1: "Left", value2: "Right" },
                      { label: "Contract Until", value1: "2025", value2: "2028" },
                      { label: "Goals This Season", value1: "12", value2: "27" },
                      { label: "Assists This Season", value1: "8", value2: "5" },
                      { label: "Minutes Played", value1: "1,890", value2: "2,340" },
                      { label: "Yellow Cards", value1: "3", value2: "7" },
                      { label: "Red Cards", value1: "0", value2: "1" },
                      { label: "Pass Accuracy", value1: "89%", value2: "82%" },
                      { label: "Shot Accuracy", value1: "67%", value2: "71%" },
                      { label: "Dribbles per Game", value1: "4.2", value2: "2.8" },
                      { label: "Tackles per Game", value1: "1.1", value2: "0.7" },
                      { label: "Aerial Duels Won", value1: "45%", value2: "78%" },
                      { label: "International Caps", value1: "180", value2: "212" },
                      { label: "International Goals", value1: "106", value2: "130"}
                    ].map((row, index) => (
                      <div key={index} className="grid grid-cols-3 gap-8 py-3 border-b border-gray-100 last:border-b-0">
                        <div className="text-[#6d6d6d] font-medium">{row.label}</div>
                        <div className="text-[#000000] text-center">{row.value1}</div>
                        <div className="text-[#000000] text-center">{row.value2}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="p-6">
                  <p className="text-[#6d6d6d]">Advanced stats comparison coming soon...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
