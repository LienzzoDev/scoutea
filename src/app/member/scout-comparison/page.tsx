'use client'

import { Search, User, X } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import MemberNavbar from "@/components/layout/member-navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Scout {
  id: number
  name: string
  age: number
  nationality: string
  experience: string
  specialization: string
  rating: number
  rank: number
  image?: string
}

export default function ScoutComparisonPage() {
  const _router = useRouter()
  const [activeTab, setActiveTab] = useState('info')
  const [selectedScout1, setSelectedScout1] = useState<Scout | null>(null)
  const [selectedScout2, setSelectedScout2] = useState<Scout | null>(null)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')

  // Mock scouts data
  const mockScouts: Scout[] = [
    {
      id: 1,
      name: "Carlos Mendoza",
      age: 35,
      nationality: "Spain",
      experience: "10+ years",
      specialization: "Youth Development",
      rating: 4.8,
      rank: 495,
      image: "/placeholder.svg?height=48&width=48&query=scout 1"
    },
    {
      id: 2,
      name: "James Wilson",
      age: 42,
      nationality: "England",
      experience: "15+ years",
      specialization: "First Team",
      rating: 4.9,
      rank: 234,
      image: "/placeholder.svg?height=48&width=48&query=scout 2"
    },
    {
      id: 3,
      name: "Marco Rossi",
      age: 38,
      nationality: "Italy",
      experience: "12+ years",
      specialization: "Defensive Analysis",
      rating: 4.7,
      rank: 567,
      image: "/placeholder.svg?height=48&width=48&query=scout 3"}
  ]

  const bothScoutsSelected = selectedScout1 && selectedScout2

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-[#6d6d6d]">
            <span className="hover:text-[#8c1a10] cursor-pointer" onClick={() => _router.push('/member/scouts')}>
              Wonderscouts
            </span>
            <span className="mx-2">›</span>
            <span className="text-[#000000]">Comparison</span>
          </nav>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#000000] mb-8">Comparison</h1>

        {/* Tabs */}
        <div className="flex space-x-8 mb-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'text-[#000000] border-[#8c1a10]'
                : 'text-[#6d6d6d] border-transparent hover:text-[#000000]'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'text-[#000000] border-[#8c1a10]'
                : 'text-[#6d6d6d] border-transparent hover:text-[#000000]'
            } ${!bothScoutsSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!bothScoutsSelected}
          >
            Stats
          </button>
        </div>

        {!bothScoutsSelected ? (
          /* Scout Selection Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Scout 1 Card */}
            <div className="bg-white rounded-lg p-8 border border-[#e7e7e7]">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  {selectedScout1 ? (
                    <img
                      src={selectedScout1.image || "/placeholder.svg"}
                      alt={selectedScout1.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-[#000000] mb-2">{selectedScout1 ? selectedScout1.name : "Select scout 1"}
                </h3>
                
                {selectedScout1 && (
                  <div className="text-sm text-[#6d6d6d] mb-4">
                    <p>{selectedScout1.age} years • {selectedScout1.nationality}</p>
                    <p>{selectedScout1.experience} • {selectedScout1.specialization}</p>
                    <p>Rating: {selectedScout1.rating}/5.0</p>
                  </div>
                )}

                <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
                  <Input
                    placeholder="Search scout..."
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    className="pr-10" />
                </div>

                <div className="space-y-2">
                  {selectedScout1 ? (
                    <Button
                      variant="outline"
                      onClick={() =>setSelectedScout1(null)}
                      className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white">
                      Clear Selection
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {search1 && mockScouts
                        .filter(scout => scout.name.toLowerCase().includes(search1.toLowerCase()))
                        .map((scout) => (
                          <Button
                            key={scout.id}
                            variant="outline"
                            onClick={() =>setSelectedScout1(scout)}
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                            {scout.name}
                          </Button>
                        ))}
                      {search1 && mockScouts.filter(scout => scout.name.toLowerCase().includes(search1.toLowerCase())).length === 0 && (
                        <p className="text-[#6d6d6d] text-sm text-center py-2">No scouts found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scout 2 Card */}
            <div className="bg-white rounded-lg p-8 border border-[#e7e7e7]">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  {selectedScout2 ? (
                    <img
                      src={selectedScout2.image || "/placeholder.svg"}
                      alt={selectedScout2.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-[#000000] mb-2">{selectedScout2 ? selectedScout2.name : "Select scout 2"}
                </h3>
                
                {selectedScout2 && (
                  <div className="text-sm text-[#6d6d6d] mb-4">
                    <p>{selectedScout2.age} years • {selectedScout2.nationality}</p>
                    <p>{selectedScout2.experience} • {selectedScout2.specialization}</p>
                    <p>Rating: {selectedScout2.rating}/5.0</p>
                  </div>
                )}

                <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
                  <Input
                    placeholder="Search scout..."
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                    className="pr-10" />
                </div>

                <div className="space-y-2">
                  {selectedScout2 ? (
                    <Button
                      variant="outline"
                      onClick={() =>setSelectedScout2(null)}
                      className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white">
                      Clear Selection
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {search2 && mockScouts
                        .filter(scout => scout.name.toLowerCase().includes(search2.toLowerCase()))
                        .map((scout) => (
                          <Button
                            key={scout.id}
                            variant="outline"
                            onClick={() =>setSelectedScout2(scout)}
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                            {scout.name}
                          </Button>
                        ))}
                      {search2 && mockScouts.filter(scout => scout.name.toLowerCase().includes(search2.toLowerCase())).length === 0 && (
                        <p className="text-[#6d6d6d] text-sm text-center py-2">No scouts found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Comparison View */
          <div>
            {/* Scout Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Scout 1 Summary */}
              <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] relative">
                <button
                  onClick={() =>setSelectedScout1(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  <img
                    src={selectedScout1?.image || "/placeholder.svg"}
                    alt={selectedScout1?.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-[#000000]">{selectedScout1?.name}</h3>
                    <p className="text-[#6d6d6d] text-sm">{selectedScout1?.age} Años</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs">🇪🇸</span>
                      <span className="text-[#6d6d6d] text-sm">Nacionality</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <span className="text-sm text-[#000000]">A (7,75) | Rank {selectedScout1?.rank}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scout 2 Summary */}
              <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] relative">
                <button
                  onClick={() =>setSelectedScout2(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4">
                  <img
                    src={selectedScout2?.image || "/placeholder.svg"}
                    alt={selectedScout2?.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-[#000000]">{selectedScout2?.name}</h3>
                    <p className="text-[#6d6d6d] text-sm">{selectedScout2?.age} Años</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs">🇬🇧</span>
                      <span className="text-[#6d6d6d] text-sm">Nacionality</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <span className="text-sm text-[#000000]">A (7,75) | Rank {selectedScout2?.rank}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Comparison */}
            <div className="bg-white rounded-lg border border-[#e7e7e7]">
              {activeTab === 'info' && (
                <div className="p-6">
                  {/* Header Row */}
                  <div className="grid grid-cols-3 gap-8 py-3 border-b-2 border-gray-200 mb-4">
                    <div className="text-[#6d6d6d] font-medium">Metric</div>
                    <div className="text-[#000000] font-semibold text-center">{selectedScout1?.name}</div>
                    <div className="text-[#000000] font-semibold text-center">{selectedScout2?.name}</div>
                  </div>

                  {/* Comparison Rows */}
                  <div className="space-y-0">{[
                      { label: "Age", value1: "XX", value2: "XX" },
                      { label: "Total Reports", value1: "Loren Ipsum Dolor", value2: "Loren Ipsum Dolor" },
                      { label: "Original Reports", value1: "Loren Ipsum Dolor", value2: "Loren Ipsum Dolor" },
                      { label: "Nationality Expertise", value1: "Loren Ipsum Dolor", value2: "Loren Ipsum Dolor" },
                      { label: "Competition Expertise", value1: "Loren Ipsum Dolor", value2: "Loren Ipsum Dolor" },
                      { label: "Avg Potential", value1: "⭐⭐⭐⭐⭐", value2: "⭐⭐⭐⭐⭐" },
                      { label: "Avg Initial Age", value1: "XX", value2: "XX" },
                      { label: "Total Investment", value1: "XX", value2: "XX" },
                      { label: "Net Profit", value1: "XX", value2: "XX" },
                      { label: "ROI", value1: "XX", value2: "XX" },
                      { label: "Avg Initial TRFM Value", value1: "XX", value2: "XX" },
                      { label: "Max Report Profit", value1: "XX", value2: "XX" },
                      { label: "Min Report Profit", value1: "XX", value2: "XX" },
                      { label: "Avg Profit per Report", value1: "XX", value2: "XX" },
                      { label: "Avg Profit per Report", value1: "XX", value2: "XX" },
                      { label: "Transfer Team Pts", value1: "XX", value2: "XX" },
                      { label: "Avg Initial Team Level", value1: "XX", value2: "XX" },
                      { label: "Transfer Competition Pts", value1: "XX", value2: "XX" },
                      { label: "Avg Initial Competition Level", value1: "XX", value2: "XX" },
                      { label: "Scout ELO", value1: "XX", value2: "XX" },
                      { label: "Scout Level", value1: "XX", value2: "XX" },
                      { label: "Scout Ranking", value1: "XX", value2: "XX"}
                    ].map((row, index) => (
                      <div key={index} className="grid grid-cols-3 gap-8 py-3 border-b border-gray-100 last:border-b-0">
                        <div className="text-[#6d6d6d] font-medium">{row.label}</div>
                        <div className="text-[#000000] text-center">{row.value1}</div>
                        <div className="text-[#000000] text-center">{row.value2}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="p-6">
                  <p className="text-[#6d6d6d]">Stats comparison coming soon...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
