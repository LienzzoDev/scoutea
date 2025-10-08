'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

import { Button } from '@/components/ui/button'

import ScoutPlayersSection from './scout-players-section'


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

export default function ScoutPlayersDashboard() {
  const { user } = useUser()
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scoutProfile, setScoutProfile] = useState<any>(null)


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

        setScoutProfile(profileResult.scout)

        // Luego obtener los jugadores del scout
        const playersResponse = await fetch(`/api/scout/players?scoutId=${profileResult.scout.id_scout}`)
        const playersResult = await playersResponse.json()

        if (playersResult.success && playersResult.data) {
          // Transformar los datos del API al formato esperado por el componente
          const transformedPlayers: PlayerData[] = playersResult.data.map((item: any) => {
            const latestReport = item.reportes?.[0]

            // Calcular edad si hay fecha de nacimiento
            let age = null
            if (item.date_of_birth) {
              const today = new Date()
              const birthDate = new Date(item.date_of_birth)
              age = today.getFullYear() - birthDate.getFullYear()
              const monthDiff = today.getMonth() - birthDate.getMonth()
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--
              }
            }

            return {
              player: {
                id_player: item.id_player,
                player_name: item.player_name,
                position_player: item.position_player,
                nationality_1: item.nationality_1,
                team_name: item.team_name,
                player_rating: item.player_rating,
                age: age
              },
              latestReport: latestReport ? {
                id_report: latestReport.id_report,
                report_date: latestReport.report_date,
                report_type: latestReport.report_type,
                roi: latestReport.roi,
                profit: latestReport.profit,
                potential: latestReport.potential
              } : {
                id_report: '',
                report_date: null,
                report_type: null,
                roi: null,
                profit: null,
                potential: null
              },
              totalReports: item.reportes?.length || 0
            }
          })

          setPlayers(transformedPlayers)
        } else {
          // Si no hay jugadores, no es un error crítico
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





  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Cargando jugadores...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Scout</span>
          <span>›</span>
          <span className="text-[#000000]">Players</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">
          Mis Jugadores Reportados
        </h1>

        {/* Players Section */}
        <ScoutPlayersSection
          players={players}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  )
}