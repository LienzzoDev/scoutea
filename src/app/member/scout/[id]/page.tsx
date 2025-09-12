'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Facebook, Twitter, Linkedin, Send, Globe, Search, Filter, Bookmark, ArrowRight, X, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MemberNavbar from "@/components/member-navbar"

export default function ScoutProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('info')
  const [showFilters, setShowFilters] = useState(false)
  const [activeReportsTab, setActiveReportsTab] = useState('qualitative')
  const [activeStatsTab, setActiveStatsTab] = useState('qualitative')
  const [message, setMessage] = useState('')
  
  // Portfolio players data
  const portfolioPlayers = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: "Player Name",
    age: "XX Años",
    nationality: "Nationality",
    competition: "Loren Ipsum Do...",
    image: `/placeholder.svg?height=48&width=48&query=player portrait ${i + 1}`,
  }))

  // Reports data
  const reports = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    scoutName: "Gines Mesas",
    profileType: "Tipo de perfil",
    playerName: "Player Name",
    age: "XX Años",
    nationality: "Notinal",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,",
    rating: 4, // Number of filled stars
    date: "XX/XX/XXXX",
    hasVideo: i === 1, // Second report has video
    playerImage: `/placeholder.svg?height=48&width=48&query=player portrait ${i + 1}`,
    mainImage: `/placeholder.svg?height=200&width=300&query=stadium player ${i + 1}`,
  }))
  
  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6" style={{ marginTop: '55px' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Wonderkids</span>
          <span>›</span>
          <span>Scouts</span>
          <span>›</span>
          <span className="text-[#000000]">Scout Name</span>
        </div>

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
                <span className="text-gray-800 font-medium">Scout Name</span>
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
                Elite Scout
              </p>
              <p className="text-sm text-[#6d6d6d]">Rank</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3cc500] rounded-full"></div>
                <span className="text-sm font-medium">A (7,75) | Rank 495</span>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1">
            {/* Scout Name */}
            <h1 className="text-4xl font-bold text-[#000000] mb-8">Scout Name</h1>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-[#e7e7e7] mb-6">
              <button 
                className={`pb-3 font-medium ${activeTab === 'info' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
              <button 
                className={`pb-3 font-medium ${activeTab === 'portfolio' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
                onClick={() => setActiveTab('portfolio')}
              >
                Portfolio
              </button>
              <button 
                className={`pb-3 font-medium ${activeTab === 'reports' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
                onClick={() => setActiveTab('reports')}
              >
                Reports
              </button>
              <button 
                className={`pb-3 font-medium ${activeTab === 'stats' ? 'border-b-2 border-[#8c1a10] text-[#2e3138]' : 'text-[#6d6d6d]'}`}
                onClick={() => setActiveTab('stats')}
              >
                Stats
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
              <div className="bg-white p-6">
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">User:</span>
                      <span className="text-[#2e3138] font-medium">Loren Ipsum Dolor</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Name:</span>
                      <span className="text-[#2e3138] font-medium">Loren Ipsum Dolor</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Date of Birth:</span>
                      <span className="text-[#2e3138] font-medium">Loren Ipsum Dolor</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Age:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Country:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Joining Date:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Favourite Club:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Open to Work:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Professional Experience:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Total Reports:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Original Reports:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Nationality Expertise:</span>
                      <span className="text-[#2e3138] font-medium">Loren Ipsum</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Competition Expertise:</span>
                      <span className="text-[#2e3138] font-medium">Loren Ipsum</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Potential:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`w-4 h-4 rounded-full ${
                              star <= 3 ? 'bg-red-500' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[#6d6d6d] text-sm">Avg Initial Age:</span>
                      <span className="text-[#2e3138] font-medium">XXX</span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Total Investment:</span>
                      <span className="text-[#2e3138] font-medium">1.200.000 €</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Net Profit:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#2e3138] font-medium">1.200.000 €</span>
                        <span className="text-green-600 text-sm">(+82%)</span>
                        <span className="text-green-600">↗</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">ROI:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#2e3138] font-medium">XX%</span>
                        <span className="text-green-600 text-sm">(+82%)</span>
                        <span className="text-green-600">↗</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Initial TRFM Value:</span>
                      <span className="text-[#2e3138] font-medium">1.200.000 €</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Max Report Profit:</span>
                      <span className="text-[#2e3138] font-medium">1.200.000 €</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Min Report Profit:</span>
                      <span className="text-[#2e3138] font-medium">1.200.000 €</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Profit per Report:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">↗</span>
                        <span className="text-[#2e3138] font-medium">1.200.000 €</span>
                        <span className="text-green-600 text-sm">(+82%)</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Transfer Team Pts:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#2e3138] font-medium">XX</span>
                        <span className="text-green-600 text-sm">(+82%)</span>
                        <span className="text-green-600">↗</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Initial Team Level:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Transfer Competition Pts:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">↗</span>
                        <span className="text-[#2e3138] font-medium">XX</span>
                        <span className="text-green-600 text-sm">(+82%)</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Initial Competition Level:</span>
                      <span className="text-[#2e3138] font-medium">XXX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Scout ELO:</span>
                      <span className="text-[#2e3138] font-medium">XX</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Scout Level:</span>
                      <span className="text-[#2e3138] font-medium">XXX</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[#6d6d6d] text-sm">Scout Ranking:</span>
                      <span className="text-[#2e3138] font-medium">XXX</span>
                    </div>
                  </div>
                </div>
              </div>
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
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-[#e7e7e7] text-[#6d6d6d] bg-transparent"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 text-[#8c1a10]" />
                    Filters
                  </Button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mb-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[#000000]">Filters</h3>
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                          <span className="text-red-600 text-sm">Clean Filters</span>
                          <X className="w-3 h-3 text-red-600" />
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Filter Options */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Reports</span>
                        <span className="text-xs">▼</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Contact</span>
                        <span className="text-xs">▼</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Stats</span>
                        <span className="text-xs">▼</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Passport</span>
                        <span className="text-xs">▼</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Initial info</span>
                        <span className="text-xs">▼</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Portfolio Players List */}
                <div className="space-y-4">
                  {portfolioPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="bg-[#ffffff] rounded-lg p-6 flex items-center justify-between border border-[#e7e7e7] cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/member/player/${player.id}`)}
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
                            {player.age} • {player.nationality}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-16">
                        <div>
                          <p className="text-[#6d6d6d] text-sm mb-1">Competition</p>
                          <p className="font-medium text-[#000000]">{player.competition}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Bookmark className="w-5 h-5 text-[#8c1a10] fill-current" />
                          <ArrowRight 
                            className="w-5 h-5 text-[#6d6d6d] cursor-pointer hover:text-[#8c1a10] transition-colors" 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/member/player/${player.id}`)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white p-6">
                {/* Search and Filters */}
                <div className="flex items-center justify-between mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
                    <Input 
                      placeholder="Search by name or ID..." 
                      className="pl-10 w-80 bg-[#ffffff] border-[#e7e7e7]" 
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-[#e7e7e7] text-[#6d6d6d] bg-transparent"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 text-[#8c1a10]" />
                    Filters
                  </Button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mb-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[#000000]">Filters</h3>
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                          <span className="text-red-600 text-sm">Clean Filters</span>
                          <X className="w-3 h-3 text-red-600" />
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowFilters(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Filter Options */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Reports</span>
                        <span className="text-xs">▼</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Contact</span>
                        <span className="text-xs">▼</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Stats</span>
                        <span className="text-xs">▼</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Passport</span>
                        <span className="text-xs">▼</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span>Initial info</span>
                        <span className="text-xs">▼</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reports Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white rounded-lg border border-[#e7e7e7] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/member/player/${report.id}`)}
                    >
                      {/* Header */}
                      <div className="p-4 border-b border-[#e7e7e7]">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-[#000000]">{report.scoutName}</h3>
                          <span className="text-[#6d6d6d] text-sm">{report.profileType}</span>
                        </div>
                      </div>

                      {/* Player Info */}
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <img
                            src={report.playerImage || "/placeholder.svg"}
                            alt={report.playerName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-medium text-[#000000]">{report.playerName}</h4>
                            <p className="text-[#6d6d6d] text-sm">
                              {report.age} • {report.nationality}
                            </p>
                          </div>
                        </div>

                        {/* Main Image */}
                        <div className="relative mb-4">
                          <img
                            src={report.mainImage || "/placeholder.svg"}
                            alt="Player in action"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          {report.hasVideo && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                                <Play className="w-6 h-6 text-white ml-1" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-[#6d6d6d] text-sm mb-4 leading-relaxed">
                          {report.description}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-4 h-4 rounded-full ${
                                star <= report.rating ? 'bg-red-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Date */}
                        <div className="text-[#6d6d6d] text-sm">
                          {report.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="bg-white">
                {/* Stats Sub-navigation */}
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setActiveStatsTab('qualitative')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeStatsTab === 'qualitative'
                          ? 'text-black border-[#8c1a10]'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Qualitative
                    </button>
                    <button
                      onClick={() => setActiveStatsTab('quantitative')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeStatsTab === 'quantitative'
                          ? 'text-black border-[#8c1a10]'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Quantitative
                    </button>
                    <button
                      onClick={() => setActiveStatsTab('awards')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeStatsTab === 'awards'
                          ? 'text-black border-[#8c1a10]'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Awards
                    </button>
                  </div>
                </div>

                {/* Stats Content */}
                <div className="p-6">
                  {activeStatsTab === 'qualitative' && (
                    <div>
                      <h3 className="text-lg font-semibold text-[#000000] mb-4">Qualitative Analysis</h3>
                      <p className="text-[#6d6d6d]">Qualitative stats content coming soon...</p>
                    </div>
                  )}

                  {activeStatsTab === 'quantitative' && (
                    <div>
                      <h3 className="text-lg font-semibold text-[#000000] mb-4">Quantitative Analysis</h3>
                      <p className="text-[#6d6d6d]">Quantitative stats content coming soon...</p>
                    </div>
                  )}

                  {activeStatsTab === 'awards' && (
                    <div>
                      <h3 className="text-lg font-semibold text-[#000000] mb-4">Awards & Recognition</h3>
                      <p className="text-[#6d6d6d]">Awards content coming soon...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contacto' && (
              <div className="bg-white p-6">
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-[#000000] mb-4">Send message</h3>
                    
                    <div className="mb-6">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Send message to Scout Name..."
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#8c1a10] focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          // Handle send message logic here
                          console.log('Sending message:', message)
                          setMessage('')
                        }}
                        className="bg-[#8c1a10] hover:bg-[#6d1410] text-white"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>


    </div>
  )
}
