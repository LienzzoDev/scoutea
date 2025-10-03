'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

import ScoutNavbar from '@/components/layout/scout-navbar'
import ScoutReportsSection from '@/components/scout/scout-reports-section'

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

export default function ScoutReportsPage() {
  const { user } = useUser()
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadScoutData = async () => {
      if (!user) {
        setError('Usuario no autenticado')
        setIsLoading(false)
        return
      }

      try {
        // Obtener el perfil del scout
        const profileResponse = await fetch('/api/scout/profile')
        const profileResult = await profileResponse.json()
        
        if (!profileResult.success) {
          throw new Error(profileResult.error || 'Error al obtener perfil de scout')
        }

        // Luego obtener los jugadores del scout
        const playersResponse = await fetch(`/api/scout/players?scoutId=${profileResult.scout.id_scout}`)
        const playersResult = await playersResponse.json()
        
        if (playersResult.success) {
          setPlayers(playersResult.data)
        } else {
          console.log('No players found for scout:', playersResult.error)
          setPlayers([])
        }
      } catch (err) {
        console.error('Error loading scout data:', err)
        setError('Error al cargar los datos del scout')
      } finally {
        setIsLoading(false)
      }
    }

    loadScoutData()
  }, [user])

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Scout</span>
          <span>›</span>
          <span className="text-[#000000]">Reports</span>
        </div>

        <ScoutReportsSection
          players={players}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  )
}