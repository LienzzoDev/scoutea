'use client'

import { Facebook, Twitter, Linkedin, Globe, Search, Filter, Bookmark, ArrowRight, X, Play } from "lucide-react"
import Image from 'next/image'
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

export default function ScoutProfilePage() {
  const _router = useRouter()
  const params = useParams()
  const scoutId = params.id as string
  
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
  const [filteredPortfolioPlayers, setFilteredPortfolioPlayers] = useState([])

  // Portfolio players data - Using real player IDs from database
  const portfolioPlayers = [
    {
      id_player: "cmfnrkrmq0000zwoo8yafzumb", // Lionel Messi (real ID)
      name: "Lionel Messi",
      age: "36 Años",
      nationality: "Argentina",
      competition: "MLS",
      position: "RW",
      rating: 9.5,
      image: `/placeholder.svg?height=48&width=48&query=messi`,
    },
    {
      id_player: "cmfnrks3n0003zwooeq01yf4u", // Erling Haaland (real ID)
      name: "Erling Haaland",
      age: "23 Años",
      nationality: "Norway",
      competition: "Premier League",
      position: "ST",
      rating: 9.2,
      image: `/placeholder.svg?height=48&width=48&query=haaland`,
    },
    {
      id_player: "cmfnrw2nc0002zw6k058yeyr5", // Luka Modric (real ID)
      name: "Luka Modric",
      age: "38 Años",
      nationality: "Croatia",
      competition: "La Liga",
      position: "CM",
      rating: 8.8,
      image: `/placeholder.svg?height=48&width=48&query=modric`,
    },
    {
      id_player: "cmfnrks080002zwoore7ta0q9", // Kevin De Bruyne (real ID)
      name: "Kevin De Bruyne",
      age: "32 Años",
      nationality: "Belgium",
      competition: "Premier League",
      position: "CAM",
      rating: 9.1,
      image: `/placeholder.svg?height=48&width=48&query=debruyne`,
    },
    {
      id_player: "cmfnrw2di0000zw6krkw3f124", // Kylian Mbappé (real ID)
      name: "Kylian Mbappé",
      age: "25 Años",
      nationality: "France",
      competition: "La Liga",
      position: "LW",
      rating: 9.3,
      image: `/placeholder.svg?height=48&width=48&query=mbappe`,
    },
    {
      id_player: "cmfnrkrwv0001zwooihwhxh1m", // Virgil van Dijk (real ID)
      name: "Virgil van Dijk",
      age: "32 Años",
      nationality: "Netherlands",
      competition: "Premier League",
      position: "CB",
      rating: 8.9,
      image: `/placeholder.svg?height=48&width=48&query=vandijk`,
    }
  ]

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

  // Initialize filtered players when component mounts
  useEffect(() => {
    setFilteredPortfolioPlayers(portfolioPlayers)
  }, [])

  // Reports data - Using real player IDs from database
  const reports = [
    {
      id_player: "cmfnrkrmq0000zwoo8yafzumb", // Lionel Messi (real ID)
      scoutName: "Gines Mesas",
      profileType: "Extremo Derecho",
      playerName: "Lionel Messi",
      age: "36 Años",
      nationality: "Argentina",
      description: "Exceptional technical ability and vision. One of the greatest players of all time with incredible dribbling skills and playmaking ability.",
      rating: 5,
      date: "15/12/2023",
      hasVideo: true,
      playerImage: `/placeholder.svg?height=48&width=48&query=messi`,
      mainImage: `/placeholder.svg?height=200&width=300&query=messi action`,
    },
    {
      id_player: "cmfnrks3n0003zwooeq01yf4u", // Erling Haaland (real ID)
      scoutName: "Gines Mesas",
      profileType: "Delantero Centro",
      playerName: "Erling Haaland",
      age: "23 Años",
      nationality: "Norway",
      description: "Clinical finisher with exceptional pace and physical presence. Perfect striker for modern football with great positioning.",
      rating: 5,
      date: "10/12/2023",
      hasVideo: false,
      playerImage: `/placeholder.svg?height=48&width=48&query=haaland`,
      mainImage: `/placeholder.svg?height=200&width=300&query=haaland action`,
    },
    {
      id_player: "cmfnrw2nc0002zw6k058yeyr5", // Luka Modric (real ID)
      scoutName: "Gines Mesas",
      profileType: "Mediocentro",
      playerName: "Luka Modric",
      age: "38 Años",
      nationality: "Croatia",
      description: "Master of midfield with incredible passing range and game intelligence. Still performing at the highest level despite his age.",
      rating: 4,
      date: "05/12/2023",
      hasVideo: true,
      playerImage: `/placeholder.svg?height=48&width=48&query=modric`,
      mainImage: `/placeholder.svg?height=200&width=300&query=modric action`,
    },
    {
      id_player: "cmfnrks080002zwoore7ta0q9", // Kevin De Bruyne (real ID)
      scoutName: "Gines Mesas",
      profileType: "Mediapunta",
      playerName: "Kevin De Bruyne",
      age: "32 Años",
      nationality: "Belgium",
      description: "Outstanding playmaker with exceptional crossing and long-range shooting ability. Key player for both club and country.",
      rating: 5,
      date: "01/12/2023",
      hasVideo: false,
      playerImage: `/placeholder.svg?height=48&width=48&query=debruyne`,
      mainImage: `/placeholder.svg?height=200&width=300&query=debruyne action`,
    }
  ]  

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
                {scout.rating}
              </p>
              <p className="text-sm text-[#6d6d6d]">Rank</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3cc500] rounded-full"></div>
                <span className="text-sm font-medium">{scout.rank}</span>
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
                        <select
                          value={portfolioFilters.nationality}
                          onChange={(e) => handlePortfolioFilter('nationality', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent"
                        >
                          <option value="">All Nationalities</option>
                          <option value="Argentina">Argentina</option>
                          <option value="Norway">Norway</option>
                          <option value="Croatia">Croatia</option>
                          <option value="Belgium">Belgium</option>
                          <option value="France">France</option>
                          <option value="Netherlands">Netherlands</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Competition</label>
                        <select
                          value={portfolioFilters.competition}
                          onChange={(e) => handlePortfolioFilter('competition', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent"
                        >
                          <option value="">All Competitions</option>
                          <option value="Premier League">Premier League</option>
                          <option value="La Liga">La Liga</option>
                          <option value="MLS">MLS</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                        <select
                          value={portfolioFilters.position}
                          onChange={(e) => handlePortfolioFilter('position', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent"
                        >
                          <option value="">All Positions</option>
                          <option value="ST">Striker</option>
                          <option value="LW">Left Wing</option>
                          <option value="RW">Right Wing</option>
                          <option value="CAM">Attacking Mid</option>
                          <option value="CM">Central Mid</option>
                          <option value="CB">Center Back</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <select
                          value={portfolioFilters.rating}
                          onChange={(e) => handlePortfolioFilter('rating', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent"
                        >
                          <option value="">All Ratings</option>
                          <option value="9+">9.0+</option>
                          <option value="8+">8.0+</option>
                          <option value="7+">7.0+</option>
                        </select>
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
              </div>
            )}

            {/* Other tabs content would go here */}
            {activeTab === 'reports' && (
              <div className="bg-white p-6">
                <p className="text-[#6d6d6d]">Reports content coming soon...</p>
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