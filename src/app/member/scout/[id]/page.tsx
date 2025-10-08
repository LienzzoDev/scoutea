'use client'

import { Facebook, Twitter, Linkedin, Globe } from "lucide-react"
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import MemberNavbar from "@/components/layout/member-navbar"
import ScoutHeader from "@/components/scout/ScoutHeader"
import ScoutEconomicInfo from "@/components/scout/ScoutEconomicInfo"
import { QualitativeDashboard } from "@/components/scout/qualitative-dashboard"
import { QuantitativeDashboard } from "@/components/scout/quantitative-dashboard"
import { Button } from "@/components/ui/button"
import { useScoutProfile } from "@/hooks/scout/useScoutProfile"
import ScoutContactForm from "@/components/scout/ScoutContactForm"
import ScoutPlayersSection from "@/components/scout/scout-players-section"
import ScoutReportsSection from "@/components/scout/scout-reports-section"

export default function ScoutProfilePage() {
  const _router = useRouter()
  const params = useParams()
  const scoutId = params?.id as string
  
  const {
    scout,
    loading,
    error,
    isScoutInList,
    listLoading,
    isSaving,
    handleToggleList,
    refetch
  } = useScoutProfile(scoutId)
  
  const [activeTab, setActiveTab] = useState('info')
  const [_activeReportsTab, _setActiveReportsTab] = useState('qualitative')
  const [activeStatsTab, setActiveStatsTab] = useState('qualitative')

  // Portfolio state - new format
  const [portfolioPlayers, setPortfolioPlayers] = useState<any[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [reportsData, setReportsData] = useState<any[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)


  // Load portfolio and reports data
  useEffect(() => {
    const loadPortfolioAndReports = async () => {
      if (!scoutId) return

      // Load portfolio - need to fetch both basic data and reports details
      setPortfolioLoading(true)
      setPortfolioError(null)
      try {
        // First get the basic portfolio data (players reported by this scout)
        const portfolioResponse = await fetch(`/api/scout/${scoutId}/portfolio`)

        if (!portfolioResponse.ok) {
          throw new Error('Failed to fetch portfolio data')
        }

        const portfolioResult = await portfolioResponse.json()

        if (!portfolioResult.success) {
          throw new Error(portfolioResult.error || 'Error loading portfolio')
        }

        // Now fetch detailed report data for each player
        const reportsDetailResponse = await fetch(`/api/scout/${scoutId}/reports-detail`)
        let reportsDetailData: any[] = []

        if (reportsDetailResponse.ok) {
          const reportsDetailResult = await reportsDetailResponse.json()
          if (reportsDetailResult.success) {
            reportsDetailData = reportsDetailResult.data
          }
        }

        // Transform to the format expected by ScoutPlayersSection
        const transformedPlayers = portfolioResult.data.map((player: any) => {
          // Find the latest report for this player
          const playerReports = reportsDetailData.filter(
            (report: any) => report.id_player === player.id_player
          )
          const latestReport = playerReports[0] || null

          // Parse age from the portfolio data (format: "X Años" or "N/A")
          let age = null
          if (player.age && player.age !== 'N/A') {
            const ageMatch = player.age.match(/(\d+)/)
            if (ageMatch) {
              age = parseInt(ageMatch[1], 10)
            }
          }

          return {
            player: {
              id_player: player.id_player,
              player_name: player.name || player.player_name,
              position_player: player.position,
              nationality_1: player.nationality,
              team_name: player.team,
              player_rating: player.rating,
              age: age
            },
            latestReport: latestReport ? {
              id_report: latestReport.id_report,
              report_date: latestReport.date ? new Date(latestReport.date) : null,
              report_type: latestReport.profileType || latestReport.report_type,
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
            totalReports: player.totalReports || playerReports.length || 0
          }
        })

        setPortfolioPlayers(transformedPlayers)
        console.log('✅ Portfolio loaded:', transformedPlayers.length, 'players')
      } catch (error) {
        console.error('Error loading portfolio:', error)
        setPortfolioError(error instanceof Error ? error.message : 'Error loading portfolio')
      } finally {
        setPortfolioLoading(false)
      }

      // Load reports using the same endpoint as the scout area
      setReportsLoading(true)
      try {
        const reportsResponse = await fetch(`/api/scout/reports?scoutId=${scoutId}`)
        if (reportsResponse.ok) {
          const reportsResult = await reportsResponse.json()
          if (reportsResult.success && reportsResult.data) {
            // No transformation needed - use the same format as scout area
            setReportsData(reportsResult.data)
            console.log('✅ Reports loaded from unified endpoint:', reportsResult.data.length)
          }
        }
      } catch (error) {
        console.error('Error loading reports:', error)
      } finally {
        setReportsLoading(false)
      }
    }

    loadPortfolioAndReports()
  }, [scoutId])  

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <MemberNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: '55px' }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
              <p className="text-[#6d6d6d]">Loading scout profile...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Mostrar error si hay algún problema
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <MemberNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: '55px' }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading scout profile: {error}</p>
              <Button onClick={refetch} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Si no hay scout, mostrar not found
  if (!scout) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <MemberNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: '55px' }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-[#6d6d6d] mb-4">Scout not found</p>
              <Button onClick={() => _router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6" style={{ marginTop: '55px' }}>
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-80 h-fit bg-white rounded-lg p-6 space-y-6">
            {/* Scout Card */}
            <div className="relative">
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                <Image
                  src="/logo-member.svg"
                  alt="Scoutea Member Logo"
                  width={140}
                  height={140}
                  className="object-contain opacity-50"
                  priority
                />
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-2 py-1 rounded text-sm">
                {/* Flag */}
                <div className="w-6 h-4 rounded-sm overflow-hidden flex-shrink-0">
                  <Image
                    src="https://flagcdn.com/w80/es.png"
                    alt="Spain flag"
                    width={24}
                    height={16}
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Scout Name */}
                <span className="text-gray-800 font-medium">{scout.name}</span>
              </div>
            </div>

            {/* Social Media - Only show if there are social links */}
            {(scout.twitter_profile || scout.instagram_profile || scout.linkedin_profile || scout.url_profile) && (
              <div>
                <p className="text-[#6d6d6d] text-sm mb-3">On social media</p>
                <div className="flex gap-3">
                  {scout.twitter_profile && (
                    <a href={scout.twitter_profile} target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-5 h-5 text-[#6d6d6d] hover:text-[#1DA1F2] transition-colors cursor-pointer" />
                    </a>
                  )}
                  {scout.instagram_profile && (
                    <a href={scout.instagram_profile} target="_blank" rel="noopener noreferrer">
                      <div className="w-5 h-5 bg-[#6d6d6d] hover:bg-[#E4405F] rounded-sm flex items-center justify-center transition-colors cursor-pointer">
                        <span className="text-white text-xs font-bold">I</span>
                      </div>
                    </a>
                  )}
                  {scout.linkedin_profile && (
                    <a href={scout.linkedin_profile} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-5 h-5 text-[#6d6d6d] hover:text-[#0A66C2] transition-colors cursor-pointer" />
                    </a>
                  )}
                  {scout.url_profile && (
                    <a href={scout.url_profile} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-5 h-5 text-[#6d6d6d] hover:text-[#8c1a10] transition-colors cursor-pointer" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Rating */}
            <div>
              <p className="text-[#6d6d6d] text-sm mb-2">
                Scout rating
              </p>
              <p className="text-2xl font-bold text-[#8c1a10] mb-2">
                {scout.scout_elo || 'N/A'}
              </p>
              <p className="text-sm text-[#6d6d6d]">Rank</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3cc500] rounded-full"></div>
                <span className="text-sm font-medium">#{scout.scout_ranking || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1">
            {/* Scout Header with Add to List Button */}
            <ScoutHeader
              scout={scout}
              isScoutInList={isScoutInList}
              isSaving={isSaving}
              listLoading={listLoading}
              onToggleList={handleToggleList}
            />

            {/* Tabs */}
            <div className="flex gap-8 border-b border-[#e7e7e7] mb-6">
              <button 
                className={`pb-3 font-medium ${activeTab === 'info' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
                onClick={() => setActiveTab('info')}
              >
                Información
              </button>
              <button 
                className={`pb-3 font-medium ${activeTab === 'portfolio' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
                onClick={() => setActiveTab('portfolio')}
              >
                Portafolio
              </button>
              <button 
                className={`pb-3 font-medium ${activeTab === 'reports' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
                onClick={() => setActiveTab('reports')}
              >
                Reportes
              </button>
              <button 
                className={`pb-3 font-medium ${activeTab === 'stats' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
                onClick={() => setActiveTab('stats')}
              >
                Estadísticas
              </button>
              <button 
                className={`pb-3 font-medium ${activeTab === 'contacto' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
                onClick={() => setActiveTab('contacto')}
              >
                Contacto
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && (
              <ScoutEconomicInfo scout={scout} />
            )}

            {activeTab === 'portfolio' && (
              <div className="bg-white p-6">
                <ScoutPlayersSection
                  players={portfolioPlayers}
                  isLoading={portfolioLoading}
                  error={portfolioError}
                />
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="bg-white p-6">
                <ScoutReportsSection
                  reports={reportsData}
                  isLoading={reportsLoading}
                  error={null}
                  readOnly={true}
                />
              </div>
            )}

            {activeTab === 'stats' && (
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
                      <QualitativeDashboard scoutId={scoutId} />
                    </div>
                  </div>
                )}

                {activeStatsTab === 'quantitative' && (
                  <div className="p-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-[#8B4513] mb-4">Análisis Cuantitativo</h2>
                      <p className="text-[#6d6d6d] mb-6">Dashboard cuantitativo con métricas comparativas del scout</p>
                      <QuantitativeDashboard scoutId={scoutId} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contacto' && (
              <div className="max-w-4xl mx-auto">
                <ScoutContactForm 
                  scoutId={scoutId} 
                  scoutName={scout.name || scout.scout_name || 'Scout'} 
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}