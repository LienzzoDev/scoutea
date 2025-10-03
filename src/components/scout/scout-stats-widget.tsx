'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { TrendingUp, Users, FileText, Target } from 'lucide-react'

import { Card } from '@/components/ui/card'

interface ScoutStats {
  totalReports: number
  uniquePlayersReported: number
  averageROI: number
  averageProfit: number
  playersByPosition: Record<string, number>
}

export default function ScoutStatsWidget() {
  const { user } = useUser()
  const [stats, setStats] = useState<ScoutStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Obtener el perfil del scout
        const profileResponse = await fetch('/api/scout/profile')
        const profileResult = await profileResponse.json()
        
        if (!profileResult.success) {
          setIsLoading(false)
          return
        }

        // Luego obtener las estadísticas
        const response = await fetch(`/api/scout/stats?scoutId=${profileResult.scout.id_scout}`)
        const result = await response.json()
        
        if (result.success) {
          setStats(result.data)
        }
      } catch (error) {
        console.error('Error loading scout stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [user])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-white border-[#e7e7e7]">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="p-6 bg-white border-[#e7e7e7]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-[#6d6d6d]">Total Reportes</p>
            <p className="text-2xl font-bold text-[#000000]">{stats.totalReports}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white border-[#e7e7e7]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-[#6d6d6d]">Jugadores Únicos</p>
            <p className="text-2xl font-bold text-[#000000]">{stats.uniquePlayersReported}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white border-[#e7e7e7]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-[#6d6d6d]">ROI Promedio</p>
            <p className="text-2xl font-bold text-[#000000]">
              {stats.averageROI ? `${stats.averageROI.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white border-[#e7e7e7]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-[#6d6d6d]">Beneficio Promedio</p>
            <p className="text-2xl font-bold text-[#000000]">
              {formatCurrency(stats.averageProfit)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}