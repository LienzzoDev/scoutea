"use client";

interface PlayerTabsProps {
  activeTab: string;
  onTabChange: (tab: string) =>void;
}

export default function PlayerTabs({ activeTab, onTabChange }: PlayerTabsProps) {
  const tabs = [
    { id: "info", label: "Info" },
    { id: "reports", label: "Reports" },
    { id: "stats", label: "Stats"},
    { id: "features", label: "Features"},
  ];

  return (
    <div className="flex gap-8 border-b border-[#e7e7e7] mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`pb-3 font-medium ${
            activeTab === tab.id
              ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}