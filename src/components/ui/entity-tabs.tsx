'use client'

interface Tab {
  _key: string
  label: string
  count?: number
}

interface EntityTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabKey: string) => void
  className?: string
}

export default function EntityTabs({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}: EntityTabsProps) {
  return (
    <div className={`flex items-center gap-8 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`pb-2 font-medium transition-colors ${
            activeTab === tab.key
              ? 'text-[#000000] border-b-2 border-[#000000]'
              : 'text-[#6d6d6d] hover:text-[#000000]'
          }`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
          {typeof tab.count === 'number' && tab.count > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-[#8c1a10] text-white text-xs rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}