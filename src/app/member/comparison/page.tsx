'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MemberNavbar from "@/components/member-navbar"

interface Player {
  id: number
  name: string
}

export default function ComparisonPage() {
  const router = useRouter()
  const [activeComparisonTab, setActiveComparisonTab] = useState('info')
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null)
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null)

  // Check if both players are selected
  const bothPlayersSelected = selectedPlayer1 && selectedPlayer2

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Wonderkids</span>
          <span>›</span>
          <span className="text-[#000000]">Comparison</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">Comparison</h1>

        {/* Comparison Tabs */}
        <div className="flex gap-8 border-b border-[#e7e7e7] mb-8">
          <button 
            className={`pb-3 font-medium ${activeComparisonTab === 'info' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'} ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => bothPlayersSelected && setActiveComparisonTab('info')}
            disabled={!bothPlayersSelected}
          >
            Info
          </button>
          <button 
            className={`pb-3 font-medium ${activeComparisonTab === 'stats' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'} ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => bothPlayersSelected && setActiveComparisonTab('stats')}
            disabled={!bothPlayersSelected}
          >
            Stats
          </button>
          <button 
            className={`pb-3 font-medium ${activeComparisonTab === 'on-the-pitch' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'} ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => bothPlayersSelected && setActiveComparisonTab('on-the-pitch')}
            disabled={!bothPlayersSelected}
          >
            On The Pitch
          </button>
          <button 
            className={`pb-3 font-medium ${activeComparisonTab === 'player-role' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'} ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => bothPlayersSelected && setActiveComparisonTab('player-role')}
            disabled={!bothPlayersSelected}
          >
            Player Role
          </button>
          <button 
            className={`pb-3 font-medium ${activeComparisonTab === 'physical' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'} ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => bothPlayersSelected && setActiveComparisonTab('physical')}
            disabled={!bothPlayersSelected}
          >
            Physical
          </button>
          <button 
            className={`pb-3 font-medium ${activeComparisonTab === 'performance' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'} ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => bothPlayersSelected && setActiveComparisonTab('performance')}
            disabled={!bothPlayersSelected}
          >
            Performance
          </button>
          <button 
            className={`pb-3 font-medium ${activeComparisonTab === 'in-play' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'} ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => bothPlayersSelected && setActiveComparisonTab('in-play')}
            disabled={!bothPlayersSelected}
          >
            In Play
          </button>
          <button 
            className={`pb-3 font-medium ${activeComparisonTab === 'attacking-mode' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'} ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => bothPlayersSelected && setActiveComparisonTab('attacking-mode')}
            disabled={!bothPlayersSelected}
          >
            Attacking Mode
          </button>
          <button 
            className={`pb-3 font-medium ${activeComparisonTab === 'defending' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'} ${!bothPlayersSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => bothPlayersSelected && setActiveComparisonTab('defending')}
            disabled={!bothPlayersSelected}
          >
            Defending
          </button>
        </div>

        {/* Player Selection Cards */}
        <div className="grid grid-cols-2 gap-8">
          {/* Player 1 Selection */}
          <div className="bg-white rounded-lg p-8 border border-[#e7e7e7] text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                {selectedPlayer1 ? (
                  <div className="text-2xl font-bold text-[#8c1a10]">P1</div>
                ) : (
                  <div className="text-4xl text-gray-400">[ ]</div>
                )}
              </div>
              <h3 className="text-lg font-medium text-[#000000] mb-2">
                {selectedPlayer1 ? selectedPlayer1.name : "Select player 1"}
              </h3>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
              <Input 
                placeholder="Search player" 
                className="pl-10 w-full bg-[#f8f7f4] border-[#e7e7e7] text-[#6d6d6d]"
              />
            </div>
            
            {/* Demo buttons for player selection */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setSelectedPlayer1({ id: 1, name: "Lionel Messi" })}
              >
                Select Messi
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setSelectedPlayer1({ id: 2, name: "Cristiano Ronaldo" })}
              >
                Select Ronaldo
              </Button>
              {selectedPlayer1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-red-600 border-red-300"
                  onClick={() => setSelectedPlayer1(null)}
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>

          {/* Player 2 Selection */}
          <div className="bg-white rounded-lg p-8 border border-[#e7e7e7] text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                {selectedPlayer2 ? (
                  <div className="text-2xl font-bold text-[#8c1a10]">P2</div>
                ) : (
                  <div className="text-4xl text-gray-400">[ ]</div>
                )}
              </div>
              <h3 className="text-lg font-medium text-[#000000] mb-2">
                {selectedPlayer2 ? selectedPlayer2.name : "Select player 2"}
              </h3>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
              <Input 
                placeholder="Search player" 
                className="pl-10 w-full bg-[#f8f7f4] border-[#e7e7e7] text-[#6d6d6d]"
              />
            </div>
            
            {/* Demo buttons for player selection */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setSelectedPlayer2({ id: 3, name: "Kylian Mbappé" })}
              >
                Select Mbappé
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setSelectedPlayer2({ id: 4, name: "Erling Haaland" })}
              >
                Select Haaland
              </Button>
              {selectedPlayer2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-red-600 border-red-300"
                  onClick={() => setSelectedPlayer2(null)}
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Content - Only show when both players are selected */}
        {bothPlayersSelected && (
          <div className="mt-8 bg-white rounded-lg p-6 border border-[#e7e7e7]">
            <h2 className="text-2xl font-bold text-[#000000] mb-4">
              Comparing {selectedPlayer1?.name} vs {selectedPlayer2?.name}
            </h2>
            <p className="text-[#6d6d6d]">
              Comparison content will be displayed here based on the selected tab.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
