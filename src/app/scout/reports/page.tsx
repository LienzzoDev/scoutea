'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

import ScoutNavbar from '@/components/layout/scout-navbar'
import ScoutReportsSection from '@/components/scout/scout-reports-section'

interface ReportData {
  id_report: string
  report_date: Date | null
  report_type: string | null
  form_text_report: string | null
  form_url_report: string | null
  form_url_video: string | null
  form_potential: string | null
  roi: number | null
  profit: number | null
  potential: number | null
  player: {
    id_player: string
    player_name: string
    position_player: string | null
    nationality_1: string | null
    team_name: string | null
    age: number | null
  }
}

export default function ScoutReportsPage() {
  const { user } = useUser()
  const [reports, setReports] = useState<ReportData[]>([])
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
      // Obtener el perfil del scout
      const profileResponse = await fetch('/api/scout/profile')
      const profileResult = await profileResponse.json()
      
      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Error al obtener perfil de scout')
      }

      // Luego obtener los reportes del scout
      const reportsResponse = await fetch(`/api/scout/reports?scoutId=${profileResult.scout.id_scout}`)
      const reportsResult = await reportsResponse.json()
      
      console.log('Reports API response:', reportsResult)
      console.log('Reports data:', reportsResult.data)
      console.log('Reports count:', reportsResult.data?.length)
      
      if (reportsResult.success) {
        setReports(reportsResult.data || [])
      } else {
        console.log('No reports found for scout:', reportsResult.error)
        setReports([])
      }
    } catch (err) {
      console.error('Error loading scout data:', err)
      setError('Error al cargar los datos del scout')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportDeleted = (reportId: string) => {
    // Actualización optimista: remover el reporte de la lista inmediatamente
    setReports(prevReports => prevReports.filter(report => report.id_report !== reportId))
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
          <span className="text-[#000000]">Reports</span>
        </div>

        <ScoutReportsSection
          reports={reports}
          isLoading={isLoading}
          error={error}
          onReportDeleted={handleReportDeleted}
        />
      </main>
    </div>
  )
}