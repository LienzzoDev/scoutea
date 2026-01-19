'use client'

import { Loader2, Search, User, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import ScoutComparisonStats from '@/components/comparison/ScoutComparisonStats'
import MemberNavbar from '@/components/layout/member-navbar'
import { Button } from '@/components/ui/button'
import FlagIcon from '@/components/ui/flag-icon'
import { Input } from '@/components/ui/input'
import { getValidImageUrl } from '@/lib/utils/image-utils'

// Tipo para los datos de scout en la comparación
interface ComparisonScout {
  id_scout: string
  name: string | null
  nationality: string | null
  photo_url: string | null
  total_reports: number | null
  scout_rating: number | null
  scout_ranking: number | null
  scout_level: string | null
  roi: number | null
}

// Componente de tarjeta de selección de scout
function ScoutSelectionCard({
  selectedScout,
  setSelectedScout,
  search,
  setSearch,
  searchResults,
  isSearching,
  scoutNumber,
}: {
  selectedScout: ComparisonScout | null
  setSelectedScout: (scout: ComparisonScout | null) => void
  search: string
  setSearch: (search: string) => void
  searchResults: ComparisonScout[]
  isSearching: boolean
  scoutNumber: number
}) {
  return (
    <div className="bg-white rounded-lg p-8 border border-[#e7e7e7]">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center overflow-hidden">
          {selectedScout ? (
            selectedScout.photo_url && getValidImageUrl(selectedScout.photo_url) ? (
              <Image
                src={getValidImageUrl(selectedScout.photo_url)!}
                alt={selectedScout.name || ''}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                <User className="w-12 h-12 text-gray-600" />
              </div>
            )
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-[#000000] mb-2">
          {selectedScout ? selectedScout.name : `Select scout ${scoutNumber}`}
        </h3>

        {selectedScout && (
          <div className="text-sm text-[#6d6d6d] mb-4">
            <p>{selectedScout.nationality || 'Unknown'}</p>
            <p>Reports: {selectedScout.total_reports || 0}</p>
            <p>Rating: {selectedScout.scout_rating?.toFixed(2) || '-'}</p>
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-4 h-4" />
          <Input
            placeholder="Search scout..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
            disabled={!!selectedScout}
          />
        </div>

        <div className="space-y-2">
          {selectedScout ? (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedScout(null)
                setSearch('')
              }}
              className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white"
            >
              Clear Selection
            </Button>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#8c1a10]" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((scout) => (
                  <Button
                    key={scout.id_scout}
                    variant="outline"
                    onClick={() => {
                      setSelectedScout(scout)
                      setSearch(scout.name || '')
                    }}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 justify-start gap-3"
                  >
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      {scout.photo_url && getValidImageUrl(scout.photo_url) ? (
                        <Image
                          src={getValidImageUrl(scout.photo_url)!}
                          alt={scout.name || ''}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="text-left truncate">
                      <div className="font-medium truncate">{scout.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {scout.nationality} • {scout.total_reports || 0} reports
                      </div>
                    </div>
                  </Button>
                ))
              ) : search.length >= 2 ? (
                <p className="text-[#6d6d6d] text-sm text-center py-2">
                  No scouts found
                </p>
              ) : search.length > 0 ? (
                <p className="text-[#6d6d6d] text-sm text-center py-2">
                  Type at least 2 characters
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente de resumen de scout seleccionado
function ScoutSummaryCard({
  scout,
  onClear,
}: {
  scout: ComparisonScout
  onClear: () => void
}) {
  return (
    <div className="bg-white rounded-lg p-6 border border-[#e7e7e7] relative">
      <button
        onClick={onClear}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-4">
        {scout.photo_url && getValidImageUrl(scout.photo_url) ? (
          <Image
            src={getValidImageUrl(scout.photo_url)!}
            alt={scout.name || ''}
            width={64}
            height={64}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
            <User className="w-8 h-8 text-gray-600" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-[#000000]">{scout.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {scout.nationality && (
              <FlagIcon nationality={scout.nationality} size="sm" />
            )}
            <span className="text-[#6d6d6d] text-sm">{scout.nationality}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {scout.scout_level || '-'}
              </span>
            </div>
            <span className="text-sm text-[#000000]">
              Rating: {scout.scout_rating?.toFixed(2) || '-'} | Rank #{scout.scout_ranking || '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ScoutComparisonPage() {
  const _router = useRouter()
  const [activeTab, setActiveTab] = useState('info')
  const [selectedScout1, setSelectedScout1] = useState<ComparisonScout | null>(null)
  const [selectedScout2, setSelectedScout2] = useState<ComparisonScout | null>(null)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')
  const [searchResults1, setSearchResults1] = useState<ComparisonScout[]>([])
  const [searchResults2, setSearchResults2] = useState<ComparisonScout[]>([])
  const [isSearching1, setIsSearching1] = useState(false)
  const [isSearching2, setIsSearching2] = useState(false)

  // Función de búsqueda de scouts
  const searchScouts = async (
    query: string,
    setResults: (results: ComparisonScout[]) => void,
    setLoading: (loading: boolean) => void
  ) => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/scouts/search?search=${encodeURIComponent(query)}&limit=10`
      )
      const data = await response.json()
      setResults(data.data || [])
    } catch (error) {
      console.error('Error searching scouts:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce para búsqueda 1
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedScout1) {
        searchScouts(search1, setSearchResults1, setIsSearching1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search1, selectedScout1])

  // Debounce para búsqueda 2
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedScout2) {
        searchScouts(search2, setSearchResults2, setIsSearching2)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search2, selectedScout2])

  const bothScoutsSelected = selectedScout1 && selectedScout2

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <MemberNavbar />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-[#6d6d6d]">
            <button
              type="button"
              className="hover:text-[#8c1a10] cursor-pointer bg-transparent border-none p-0"
              onClick={() => _router.push('/member/scouts')}
            >
              Wonderscouts
            </button>
            <span className="mx-2">›</span>
            <span className="text-[#000000]">Comparison</span>
          </nav>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#000000] mb-8">Scout Comparison</h1>

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
            onClick={() => bothScoutsSelected && setActiveTab('stats')}
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
            <ScoutSelectionCard
              selectedScout={selectedScout1}
              setSelectedScout={setSelectedScout1}
              search={search1}
              setSearch={setSearch1}
              searchResults={searchResults1}
              isSearching={isSearching1}
              scoutNumber={1}
            />
            <ScoutSelectionCard
              selectedScout={selectedScout2}
              setSelectedScout={setSelectedScout2}
              search={search2}
              setSearch={setSearch2}
              searchResults={searchResults2}
              isSearching={isSearching2}
              scoutNumber={2}
            />
          </div>
        ) : (
          /* Comparison View */
          <div>
            {/* Scout Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <ScoutSummaryCard
                scout={selectedScout1}
                onClear={() => {
                  setSelectedScout1(null)
                  setSearch1('')
                }}
              />
              <ScoutSummaryCard
                scout={selectedScout2}
                onClear={() => {
                  setSelectedScout2(null)
                  setSearch2('')
                }}
              />
            </div>

            {/* Detailed Comparison */}
            <div className="bg-white rounded-lg border border-[#e7e7e7]">
              {activeTab === 'info' && (
                <div className="p-6">
                  {/* Header Row */}
                  <div className="grid grid-cols-3 gap-8 py-3 border-b-2 border-gray-200 mb-4">
                    <div className="text-[#6d6d6d] font-medium">Metric</div>
                    <div className="text-[#000000] font-semibold text-center">
                      {selectedScout1?.name}
                    </div>
                    <div className="text-[#000000] font-semibold text-center">
                      {selectedScout2?.name}
                    </div>
                  </div>

                  {/* Comparison Rows */}
                  <div className="space-y-0">
                    {[
                      {
                        label: 'Nationality',
                        value1: selectedScout1?.nationality || 'N/A',
                        value2: selectedScout2?.nationality || 'N/A',
                      },
                      {
                        label: 'Total Reports',
                        value1: selectedScout1?.total_reports || 'N/A',
                        value2: selectedScout2?.total_reports || 'N/A',
                      },
                      {
                        label: 'Scout Rating',
                        value1: selectedScout1?.scout_rating?.toFixed(2) || 'N/A',
                        value2: selectedScout2?.scout_rating?.toFixed(2) || 'N/A',
                      },
                      {
                        label: 'Scout Level',
                        value1: selectedScout1?.scout_level || 'N/A',
                        value2: selectedScout2?.scout_level || 'N/A',
                      },
                      {
                        label: 'Scout Ranking',
                        value1: selectedScout1?.scout_ranking ? `#${selectedScout1.scout_ranking}` : 'N/A',
                        value2: selectedScout2?.scout_ranking ? `#${selectedScout2.scout_ranking}` : 'N/A',
                      },
                      {
                        label: 'ROI',
                        value1: selectedScout1?.roi ? `${selectedScout1.roi.toFixed(1)}%` : 'N/A',
                        value2: selectedScout2?.roi ? `${selectedScout2.roi.toFixed(1)}%` : 'N/A',
                      },
                    ].map((row, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-3 gap-8 py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-[#6d6d6d] font-medium">{row.label}</div>
                        <div className="text-[#000000] text-center">{row.value1}</div>
                        <div className="text-[#000000] text-center">{row.value2}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <ScoutComparisonStats
                  scout1Id={selectedScout1.id_scout}
                  scout2Id={selectedScout2.id_scout}
                  scout1Name={selectedScout1.name || 'Scout 1'}
                  scout2Name={selectedScout2.name || 'Scout 2'}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
