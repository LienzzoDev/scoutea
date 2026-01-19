'use client'

import { useUser } from '@clerk/nextjs'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import ScoutNavbar from '@/components/layout/scout-navbar'
import ScoutPlayersSection from '@/components/scout/scout-players-section'
import { Button } from '@/components/ui/button'

interface PlayerData {
  player: {
    id_player: string
    player_name: string
    position_player: string | null
    nationality_1: string | null
    team_name: string | null
    player_rating: number | null
    age: number | null
  }
  latestReport: {
    id_report: string
    report_date: Date | null
    report_type: string | null
    roi: number | null
    profit: number | null
    potential: number | null
  }
  totalReports: number
}

export default function ScoutPortfolioPage() {
  const { user } = useUser()
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadScoutData = async () => {
    if (!user) {
      setError('Usuario no autenticado')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const profileResponse = await fetch('/api/scout/profile')
      const profileResult = await profileResponse.json()

      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Error al obtener perfil')
      }

      const reportsResponse = await fetch(
        `/api/scout/reports?scoutId=${profileResult.scout.id_scout}`
      )
      const reportsResult = await reportsResponse.json()

      if (!reportsResult.success) {
        setPlayers([])
        return
      }

      const playerMap = new Map<string, PlayerData>()

      for (const report of reportsResult.data || []) {
        const playerId = report.player.id_player

        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            player: {
              id_player: report.player.id_player,
              player_name: report.player.player_name,
              position_player: report.player.position_player,
              nationality_1: report.player.nationality_1,
              team_name: report.player.team_name,
              player_rating: null,
              age: report.player.age
            },
            latestReport: {
              id_report: report.id_report,
              report_date: report.report_date,
              report_type: report.report_type,
              roi: report.roi,
              profit: report.profit,
              potential: report.potential
            },
            totalReports: 1
          })
        } else {
          const existing = playerMap.get(playerId)!
          existing.totalReports++

          const existingDate = existing.latestReport.report_date
            ? new Date(existing.latestReport.report_date)
            : new Date(0)
          const newDate = report.report_date
            ? new Date(report.report_date)
            : new Date(0)

          if (newDate > existingDate) {
            existing.latestReport = {
              id_report: report.id_report,
              report_date: report.report_date,
              report_type: report.report_type,
              roi: report.roi,
              profit: report.profit,
              potential: report.potential
            }
          }
        }
      }

      setPlayers(Array.from(playerMap.values()))
    } catch (err) {
      console.error('Error loading scout data:', err)
      setError('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadScoutData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Scout</span>
          <span>›</span>
          <span className="text-[#000000]">Portfolio</span>
        </div>

        {/* Header con botón New Report */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#000000]">
            Jugadores Reportados
          </h1>
          <Link href="/scout/portfolio/new">
            <Button className="bg-[#8B0000] hover:bg-[#660000] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </Link>
        </div>

        {/* Tabla con Customize Display y filtros */}
        <ScoutPlayersSection
          players={players}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  )
}
