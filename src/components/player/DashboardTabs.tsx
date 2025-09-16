"use client";

interface TabCounts {
  all: number;
  news: number;
  list: number;
}

interface DashboardTabsProps {
  activeTab: string;
  tabCounts: TabCounts;
  onTabChange: (tab: string) => void;
}

export default function DashboardTabs({
  activeTab,
  tabCounts,
  onTabChange,
}: DashboardTabsProps) {
  return (
    <div className="flex items-center gap-8">
      <button
        className={`pb-2 flex items-center gap-2 ${
          activeTab === "all"
            ? "text-[#000000] font-medium border-b-2 border-[#000000]"
            : "text-[#6d6d6d]"
        }`}
        onClick={() => onTabChange("all")}
      >
        All
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            activeTab === "all"
              ? "bg-[#000000] text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {tabCounts.all}
        </span>
      </button>
      <button
        className={`pb-2 flex items-center gap-2 ${
          activeTab === "news"
            ? "text-[#000000] font-medium border-b-2 border-[#000000]"
            : "text-[#6d6d6d]"
        }`}
        onClick={() => onTabChange("news")}
      >
        New players
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            activeTab === "news"
              ? "bg-[#000000] text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {tabCounts.news}
        </span>
      </button>
      <button
        className={`pb-2 flex items-center gap-2 ${
          activeTab === "list"
            ? "text-[#000000] font-medium border-b-2 border-[#000000]"
            : "text-[#6d6d6d]"
        }`}
        onClick={() => onTabChange("list")}
      >
        Your list
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            activeTab === "list"
              ? "bg-[#000000] text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {tabCounts.list}
        </span>
      </button>
    </div>
  );
}