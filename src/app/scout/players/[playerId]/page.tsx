'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import ScoutNavbar from '@/components/layout/scout-navbar'
import PlayerSidebar from '@/components/player/PlayerSidebar'
import ScoutPlayerInfo from '@/components/scout/ScoutPlayerInfo'
import ScoutPlayerReports from '@/components/scout/ScoutPlayerReports'
import ScoutPlayerTransferPts from '@/components/scout/ScoutPlayerTransferPts'
import ScoutPlayerValue from '@/components/scout/ScoutPlayerValue'
import { Button } from '@/components/ui/button'
import type { Player } from '@/types/player'

// Tabs para la página de detalle del jugador en scouts
const SCOUT_PLAYER_TABS = [
  { id: 'info', label: 'Info' },
  { id: 'reports', label: 'Reports' },
  { id: 'transfer-pts', label: 'Transfer Pts' },
  { id: 'value', label: 'Value' },
]

export default function ScoutPlayerDetailPage() {
  const params = useParams()
  const playerId = params.playerId as string

  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        const response = await fetch(`/api/players/${playerId}`)
        const result = await response.json()

        // La API devuelve el player directamente, no envuelto en {success, player}
        if (result.id_player) {
          setPlayer(result)
        } else if (result.error || result.__error) {
          throw new Error(result.error || result.__error || 'Error al cargar jugador')
        } else {
          throw new Error('Jugador no encontrado')
        }
      } catch (err) {
        console.error('Error loading player:', err)
        setError('Error al cargar los datos del jugador')
      } finally {
        setIsLoading(false)
      }
    }

    if (playerId) {
      loadPlayer()
    }
  }, [playerId])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: '55px' }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#6d6d6d]">Cargando jugador...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: '55px' }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center max-w-md">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <p className="text-[#6d6d6d] text-lg mb-2">Error al cargar el jugador</p>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <p className="text-xs text-gray-500 mb-4">Player ID: {playerId}</p>
              <Link href="/scout/portfolio">
                <Button className="bg-[#8c1a10] hover:bg-[#a01e12] text-white">
                  Volver a Portfolio
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Player not found state
  if (!player) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: '55px' }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-[#6d6d6d] text-lg">Jugador no encontrado</p>
              <p className="text-sm text-gray-500 mt-2">Player ID: {playerId}</p>
              <Link href="/scout/portfolio" className="mt-4 inline-block">
                <Button className="bg-[#8c1a10] hover:bg-[#a01e12] text-white">
                  Volver a Portfolio
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />

      <main className="max-w-7xl mx-auto px-6" style={{ marginTop: '55px' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6 pt-4">
          <Link href="/scout/portfolio" className="hover:text-[#8c1a10]">
            Scout
          </Link>
          <span>›</span>
          <Link href="/scout/portfolio" className="hover:text-[#8c1a10]">
            Portfolio
          </Link>
          <span>›</span>
          <span className="text-[#000000]">{player.player_name}</span>
        </div>

        {/* Main Content: Sidebar + Content */}
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <PlayerSidebar player={player} />

          {/* Right Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex gap-8 border-b border-[#e7e7e7] mb-6">
              {SCOUT_PLAYER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`pb-3 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-[#8c1a10] text-[#8c1a10]'
                      : 'text-[#6d6d6d] hover:text-[#8c1a10]'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && <ScoutPlayerInfo player={player} />}

            {activeTab === 'reports' && (
              <ScoutPlayerReports
                playerId={playerId}
                playerName={player.player_name || 'Jugador'}
              />
            )}

            {activeTab === 'transfer-pts' && (
              <ScoutPlayerTransferPts
                playerId={playerId}
                playerTeamLevel={player.team_level || null}
                playerCompetitionLevel={player.competition_level || null}
              />
            )}

            {activeTab === 'value' && (
              <ScoutPlayerValue
                playerId={playerId}
                playerCurrentValue={player.player_trfm_value || null}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
