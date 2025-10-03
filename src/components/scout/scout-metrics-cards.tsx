'use client'

import { TrendingUp, TrendingDown, Users, Target, Award, Globe, BarChart3, Calendar } from 'lucide-react'

interface ScoutMetricsCardsProps {
  scout: {
    scout_name: string | null
    name: string | null
    nationality: string | null
    total_reports: number | null
    original_reports: number | null
    avg_potential: number | null
    avg_initial_age: number | null
    roi: number | null
    net_profits: number | null
    scout_level: string | null
    scout_ranking: number | null
    nationality_expertise: string | null
    competition_expertise: string | null
  } | null
}

export function ScoutMetricsCards({ scout }: ScoutMetricsCardsProps) {
  if (!scout) return null

  const formatCurrency = (value: number | null) => {
    if (!value) return '€0'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number | null) => {
    if (!value) return '0%'
    return `${value.toFixed(1)}%`
  }

  const getROIColor = (roi: number | null) => {
    if (!roi) return 'text-gray-600'
    return roi >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getROIIcon = (roi: number | null) => {
    if (!roi) return TrendingUp
    return roi >= 0 ? TrendingUp : TrendingDown
  }

  const getProfitColor = (profit: number | null) => {
    if (!profit) return 'text-gray-600'
    return profit >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const metrics = [
    {
      title: 'Total Reportes',
      value: scout.total_reports || 0,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'Reportes totales realizados'
    },
    {
      title: 'Reportes Originales',
      value: scout.original_reports || 0,
      icon: Target,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      description: 'Reportes únicos y originales'
    },
    {
      title: 'ROI',
      value: formatPercentage(scout.roi),
      icon: getROIIcon(scout.roi),
      color: scout.roi && scout.roi >= 0 ? 'green' : 'red',
      bgColor: scout.roi && scout.roi >= 0 ? 'bg-green-50' : 'bg-red-50',
      iconColor: getROIColor(scout.roi),
      description: 'Retorno de inversión promedio'
    },
    {
      title: 'Beneficios Netos',
      value: formatCurrency(scout.net_profits),
      icon: Award,
      color: scout.net_profits && scout.net_profits >= 0 ? 'green' : 'red',
      bgColor: scout.net_profits && scout.net_profits >= 0 ? 'bg-green-50' : 'bg-red-50',
      iconColor: getProfitColor(scout.net_profits),
      description: 'Beneficios totales generados'
    },
    {
      title: 'Nivel Scout',
      value: scout.scout_level || 'N/A',
      icon: BarChart3,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Nivel actual del scout'
    },
    {
      title: 'Ranking',
      value: scout.scout_ranking ? `#${scout.scout_ranking}` : 'N/A',
      icon: Award,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      description: 'Posición en el ranking'
    },
    {
      title: 'Edad Promedio',
      value: scout.avg_initial_age ? `${scout.avg_initial_age.toFixed(1)} años` : 'N/A',
      icon: Calendar,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      description: 'Edad promedio de jugadores reportados'
    },
    {
      title: 'Potencial Promedio',
      value: scout.avg_potential ? scout.avg_potential.toFixed(1) : 'N/A',
      icon: TrendingUp,
      color: 'pink',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      description: 'Potencial promedio identificado'
    }
  ]

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon
        return (
          <div
            key={index}
            className='bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200'
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                  <div className='text-sm font-medium text-gray-600'>
                    {metric.title}
                  </div>
                </div>
                <div className='text-2xl font-bold text-gray-900 mb-1'>
                  {metric.value}
                </div>
                <div className='text-xs text-gray-500'>
                  {metric.description}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}