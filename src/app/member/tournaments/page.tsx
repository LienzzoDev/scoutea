'use client'

import { Search, Filter, X } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import MemberNavbar from "@/components/layout/member-navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Tournament {
  id: number
  name: string
  fullName: string
  number: string
  color: string
}

export default function TournamentsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  // Mock tournaments data
  const tournaments: Tournament[] = [
    {
      id: 1,
      name: "Tournament Name",
      fullName: "Concacaf UNDER-20 CHAMPIONSHIP",
      number: "20",
      color: "purple"
    },
    {
      id: 2,
      name: "Tournament Name",
      fullName: "UEFA Champions League",
      number: "CL",
      color: "blue"
    },
    {
      id: 3,
      name: "Tournament Name",
      fullName: "Copa Libertadores",
      number: "CL",
      color: "yellow"
    },
    {
      id: 4,
      name: "Tournament Name",
      fullName: "Premier League",
      number: "PL",
      color: "red"
    },
    {
      id: 5,
      name: "Tournament Name",
      fullName: "La Liga",
      number: "LL",
      color: "orange"
    },
    {
      id: 6,
      name: "Tournament Name",
      fullName: "Bundesliga",
      number: "BL",
      color: "green"
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-600'
      case 'blue':
        return 'bg-blue-600'
      case 'yellow':
        return 'bg-yellow-500'
      case 'red':
        return 'bg-red-600'
      case 'orange':
        return 'bg-orange-500'
      case 'green':
        return 'bg-green-600'
      default:
        return 'bg-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-[#6d6d6d]">
            <span className="text-[#000000]">Tournaments</span>
            <span className="mx-2">›</span>
            <span className="text-[#000000]">Tournaments</span>
          </nav>
        </div>

        {/* Title and Search */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#000000]">Tournaments</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
              <Input
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[#000000]">Filters</h3>
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                <span className="text-red-600 text-sm">Clean Filters</span>
                <X className="w-3 h-3 text-red-600" />
              </div>
            </div>

            {/* Filter Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
              >
                <span>Date</span>
                <span className="text-xs">▼</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
              >
                <span>Mode</span>
                <span className="text-xs">▼</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
              >
                <span>Region</span>
                <span className="text-xs">▼</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-between border-black text-gray-700 bg-white hover:bg-gray-50"
              >
                <span>Category</span>
                <span className="text-xs">▼</span>
              </Button>
            </div>
          </div>
        )}

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white rounded-lg p-6 border border-[#e7e7e7] cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/member/tournament/${tournament.id}`)}
            >
              <div className="text-center">
                {/* Tournament Emblem */}
                <div className={`w-20 h-20 ${getColorClasses(tournament.color)} rounded-full mx-auto mb-4 flex items-center justify-center relative`}>
                  {/* Spiky outer edge effect */}
                  <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                  <div className="absolute inset-1 rounded-full border-2 border-white/10"></div>
                  <span className="text-white font-bold text-lg relative z-10">
                    {tournament.number}
                  </span>
                </div>
                
                {/* Tournament Name */}
                <h3 className="text-lg font-bold text-[#000000] mb-2">
                  {tournament.fullName}
                </h3>
                
                {/* Placeholder */}
                <p className="text-[#6d6d6d] text-sm">
                  {tournament.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
