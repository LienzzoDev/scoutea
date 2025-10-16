'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

import ScoutNavbar from '@/components/layout/scout-navbar'
import { QualitativeDashboard } from '@/components/scout/qualitative-dashboard'
import { QuantitativeDashboard } from '@/components/scout/quantitative-dashboard'

export default function ScoutStatsPage() {
  const { user } = useUser()
  const [scoutProfile, setScoutProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStatsTab, setActiveStatsTab] = useState('qualitative')

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
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mx-auto mb-4"></div>
            <p className="text-[#6d6d6d]">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Scout</span>
          <span>›</span>
          <span className="text-[#000000]">Stats</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-8">
          Statistics
        </h1>

        {/* Stats Dashboard - Duplicated from member scout page */}
        <div className="bg-white rounded-lg">
          {/* Stats Sub-tabs */}
          <div className="flex gap-6 border-b border-[#e7e7e7] px-6 pt-6">
            <button 
              className={`pb-3 font-medium ${activeStatsTab === 'qualitative' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
              onClick={() => setActiveStatsTab('qualitative')}
            >
              Qualitative
            </button>
            <button 
              className={`pb-3 font-medium ${activeStatsTab === 'quantitative' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
              onClick={() => setActiveStatsTab('quantitative')}
            >
              Quantitative
            </button>
          </div>

          {/* Stats Content */}
          {activeStatsTab === 'qualitative' && (
            <div className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#8B4513] mb-4">Qualidades de Scout</h2>
                <p className="text-[#6d6d6d] mb-6">Dashboard cualitativo con análisis de datos del scout</p>
                <QualitativeDashboard scoutId={scoutProfile?.id_scout} />
              </div>
            </div>
          )}

          {activeStatsTab === 'quantitative' && (
            <div className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#8B4513] mb-4">Análisis Cuantitativo</h2>
                <p className="text-[#6d6d6d] mb-6">Dashboard cuantitativo con métricas comparativas del scout</p>
                <QuantitativeDashboard scoutId={scoutProfile?.id_scout} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}