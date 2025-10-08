'use client'

import { Facebook, Twitter, Linkedin, Globe, Search, Filter, Bookmark, ArrowRight, X, Play } from "lucide-react"
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import MemberNavbar from "@/components/layout/member-navbar"
import ScoutHeader from "@/components/scout/ScoutHeader"
import ScoutEconomicInfo from "@/components/scout/ScoutEconomicInfo"
import { QualitativeDashboard } from "@/components/scout/qualitative-dashboard"
import { QuantitativeDashboard } from "@/components/scout/quantitative-dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useScoutProfile } from "@/hooks/scout/useScoutProfile"
import ScoutContactForm from "@/components/scout/ScoutContactForm"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PortfolioPlayer {
  id_player: string
  name: string
  age: string
  nationality: string
  competition: string
  position: string
  rating: number
  image: string
}

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
  const [showFilters, setShowFilters] = useState(false)
  const [_activeReportsTab, _setActiveReportsTab] = useState('qualitative')
  const [activeStatsTab, setActiveStatsTab] = useState('qualitative')
  const [message, setMessage] = useState('')
  
  // Portfolio filters state
  const [portfolioSearchTerm, setPortfolioSearchTerm] = useState('')
  const [portfolioFilters, setPortfolioFilters] = useState({
    nationality: '',
    competition: '',
    position: '',
    ageRange: '',
    rating: ''
  })
  const [filteredPortfolioPlayers, setFilteredPortfolioPlayers] = useState<PortfolioPlayer[]>([])
  const [portfolioPlayers, setPortfolioPlayers] = useState<PortfolioPlayer[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [reportsData, setReportsData] = useState<any[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)

  // Filter and search functions
  const handlePortfolioSearch = (searchTerm: string) => {
    setPortfolioSearchTerm(searchTerm)
    filterPortfolioPlayers(searchTerm, portfolioFilters)
  }

  const handlePortfolioFilter = (filterType: string, value: string) => {
    const newFilters = { ...portfolioFilters, [filterType]: value }
    setPortfolioFilters(newFilters)
    filterPortfolioPlayers(portfolioSearchTerm, newFilters)
  }

  const filterPortfolioPlayers = (searchTerm: string, filters: typeof portfolioFilters) => {
    let filtered = portfolioPlayers

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.id_player.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply other filters
    if (filters.nationality) {
      filtered = filtered.filter(player => player.nationality === filters.nationality)
    }
    if (filters.competition) {
      filtered = filtered.filter(player => player.competition === filters.competition)
    }
    if (filters.position) {
      filtered = filtered.filter(player => player.position === filters.position)
    }

    setFilteredPortfolioPlayers(filtered)
  }

  const clearPortfolioFilters = () => {
    setPortfolioSearchTerm('')
    setPortfolioFilters({
      nationality: '',
      competition: '',
      position: '',
      ageRange: '',
      rating: ''
    })
    setFilteredPortfolioPlayers(portfolioPlayers)
  }

  // Load portfolio and reports data
  useEffect(() => {
    const loadPortfolioAndReports = async () => {
      if (!scoutId) return

      // Load portfolio
      setPortfolioLoading(true)
      try {
        const portfolioResponse = await fetch(`/api/scout/${scoutId}/portfolio`)
        if (portfolioResponse.ok) {
          const portfolioResult = await portfolioResponse.json()
          if (portfolioResult.success) {
            setPortfolioPlayers(portfolioResult.data)
            setFilteredPortfolioPlayers(portfolioResult.data)
          }
        }
      } catch (error) {
        console.error('Error loading portfolio:', error)
      } finally {
        setPortfolioLoading(false)
      }

      // Load reports
      setReportsLoading(true)
      try {
        const reportsResponse = await fetch(`/api/scout/${scoutId}/reports-detail`)
        if (reportsResponse.ok) {
          const reportsResult = await reportsResponse.json()
          if (reportsResult.success) {
            setReportsData(reportsResult.data)
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

            {/* Social Media */}
            <div>
              <p className="text-[#6d6d6d] text-sm mb-3">On social media</p>
              <div className="flex gap-3">
                <Facebook className="w-5 h-5 text-[#6d6d6d]" />
                <Twitter className="w-5 h-5 text-[#6d6d6d]" />
                <Linkedin className="w-5 h-5 text-[#6d6d6d]" />
                <Globe className="w-5 h-5 text-[#6d6d6d]" />
                <div className="w-5 h-5 bg-[#6d6d6d] rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
              </div>
            </div>

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
                {portfolioLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
                      <p className="text-[#6d6d6d]">Loading portfolio...</p>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Search and Filters */}
                <div className="flex items-center justify-between mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
                    <Input 
                      placeholder="Search by name or ID..." 
                      className="pl-10 w-80 bg-[#ffffff] border-[#e7e7e7]"
                      value={portfolioSearchTerm}
                      onChange={(e) => handlePortfolioSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-[#e7e7e7] text-[#6d6d6d] bg-transparent"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 text-[#8c1a10]" />
                    Filters
                    {(portfolioFilters.nationality || portfolioFilters.competition || portfolioFilters.position) && (
                      <span className="ml-1 bg-[#8c1a10] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {Object.values(portfolioFilters).filter(Boolean).length}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mb-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[#000000]">Filters</h3>
                        <button 
                          onClick={clearPortfolioFilters}
                          className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                        >
                          <span className="text-red-600 text-sm">Clean Filters</span>
                          <X className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Filter Options */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                        <Select
                          value={portfolioFilters.nationality || ''}
                          onValueChange={(value) => handlePortfolioFilter('nationality', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Nationalities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Argentina">Argentina</SelectItem>
                            <SelectItem value="Norway">Norway</SelectItem>
                            <SelectItem value="Croatia">Croatia</SelectItem>
                            <SelectItem value="Belgium">Belgium</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                            <SelectItem value="Netherlands">Netherlands</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Competition</label>
                        <Select
                          value={portfolioFilters.competition || ''}
                          onValueChange={(value) => handlePortfolioFilter('competition', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Competitions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Premier League">Premier League</SelectItem>
                            <SelectItem value="La Liga">La Liga</SelectItem>
                            <SelectItem value="MLS">MLS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                        <Select
                          value={portfolioFilters.position || ''}
                          onValueChange={(value) => handlePortfolioFilter('position', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Positions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ST">Striker</SelectItem>
                            <SelectItem value="LW">Left Wing</SelectItem>
                            <SelectItem value="RW">Right Wing</SelectItem>
                            <SelectItem value="CAM">Attacking Mid</SelectItem>
                            <SelectItem value="CM">Central Mid</SelectItem>
                            <SelectItem value="CB">Center Back</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <Select
                          value={portfolioFilters.rating || ''}
                          onValueChange={(value) => handlePortfolioFilter('rating', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Ratings" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9+">9.0+</SelectItem>
                            <SelectItem value="8+">8.0+</SelectItem>
                            <SelectItem value="7+">7.0+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Count */}
                <div className="mb-4">
                  <p className="text-sm text-[#6d6d6d]">
                    Showing {filteredPortfolioPlayers.length} of {portfolioPlayers.length} players
                  </p>
                </div>

                {/* Portfolio Players List */}
                <div className="space-y-4">
                  {filteredPortfolioPlayers.length > 0 ? (
                    filteredPortfolioPlayers.map((player) => (
                      <div
                        key={player.id_player}
                        className="bg-[#ffffff] rounded-lg p-6 flex items-center justify-between border border-[#e7e7e7] cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => _router.push(`/member/player/${player.id_player}`)}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={player.image || "/placeholder.svg"}
                            alt={player.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-semibold text-[#000000]">{player.name}</h3>
                            <p className="text-[#6d6d6d] text-sm">
                              {player.position} • {player.age} • {player.nationality}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-16">
                          <div>
                            <p className="text-[#6d6d6d] text-sm mb-1">Competition</p>
                            <p className="font-medium text-[#000000]">{player.competition}</p>
                          </div>

                          <div>
                            <p className="text-[#6d6d6d] text-sm mb-1">Rating</p>
                            <p className="font-medium text-[#8c1a10]">{player.rating}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <Bookmark className="w-5 h-5 text-[#8c1a10] fill-current" />
                            <ArrowRight 
                              className="w-5 h-5 text-[#6d6d6d] cursor-pointer hover:text-[#8c1a10] transition-colors" 
                              onClick={(e) => {
                                e.stopPropagation()
                                _router.push(`/member/player/${player.id_player}`)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-[#6d6d6d] mb-4">No players found matching your criteria</p>
                      <Button 
                        onClick={clearPortfolioFilters}
                        variant="outline"
                        className="border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
                  </>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="bg-white p-6">
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c1a10] mx-auto mb-4"></div>
                      <p className="text-[#6d6d6d]">Loading reports...</p>
                    </div>
                  </div>
                ) : reportsData.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#6d6d6d]">No reports available yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportsData.map((report) => (
                      <div
                        key={report.id_report}
                        className="bg-[#ffffff] rounded-lg p-6 border border-[#e7e7e7] hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => _router.push(`/member/player/${report.id_player}`)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Player Image */}
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                            <Image
                              src="/player-detail-placeholder.svg"
                              alt={report.playerName}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          </div>

                          {/* Report Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-[#000000] text-lg">{report.playerName}</h3>
                                <p className="text-[#6d6d6d] text-sm">
                                  {report.position} • {report.age} • {report.nationality} • {report.team}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {report.hasVideo && (
                                  <div className="bg-red-100 p-2 rounded">
                                    <Play className="w-4 h-4 text-red-600" />
                                  </div>
                                )}
                                <div className="text-right">
                                  <p className="text-[#6d6d6d] text-xs">Rating</p>
                                  <p className="text-[#8c1a10] font-bold">{report.rating}/5</p>
                                </div>
                              </div>
                            </div>

                            <div className="mb-3">
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {report.profileType}
                              </span>
                            </div>

                            <p className="text-[#6d6d6d] text-sm mb-3 line-clamp-2">
                              {report.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-[#6d6d6d]">
                              <p>Report by {report.scoutName}</p>
                              <p>{report.date}</p>
                            </div>

                            {/* Métricas adicionales */}
                            {(report.roi || report.profit || report.potential) && (
                              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4">
                                {report.roi && (
                                  <div>
                                    <p className="text-[#6d6d6d] text-xs">ROI</p>
                                    <p className="text-sm font-medium">{report.roi.toFixed(1)}%</p>
                                  </div>
                                )}
                                {report.profit && (
                                  <div>
                                    <p className="text-[#6d6d6d] text-xs">Profit</p>
                                    <p className="text-sm font-medium">€{report.profit.toFixed(2)}M</p>
                                  </div>
                                )}
                                {report.potential && (
                                  <div>
                                    <p className="text-[#6d6d6d] text-xs">Potential</p>
                                    <p className="text-sm font-medium">{report.potential.toFixed(1)}%</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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