'use client'

import { FileText, BarChart3, Briefcase, Users } from 'lucide-react'

interface ScoutDashboardTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  tabCounts?: {
    players: number
    reports: number
    stats: number
    jobs: number
  }
}

export default function ScoutDashboardTabs({
  activeTab,
  onTabChange,
  tabCounts = { players: 0, reports: 0, stats: 0, jobs: 0 }
}: ScoutDashboardTabsProps) {
  const tabs = [
    {
      id: 'players',
      label: 'Players',
      icon: Users,
      count: tabCounts.players,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      count: tabCounts.reports,
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: BarChart3,
      count: tabCounts.stats,
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: Briefcase,
      count: tabCounts.jobs,
    },
  ]

  return (
    <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-[#e7e7e7]">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-[#8B0000] text-white shadow-sm' 
                : 'text-[#6d6d6d] hover:text-[#000000] hover:bg-gray-50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-[#f0f0f0] text-[#6d6d6d]'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}