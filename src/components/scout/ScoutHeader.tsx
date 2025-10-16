"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import type { Scout } from "@/types/scout";

interface ScoutHeaderProps {
  scout: Scout;
  isScoutInList: boolean;
  isSaving: boolean;
  listLoading: boolean;
  onToggleList: () => void;
}

export default function ScoutHeader({
  scout,
  isScoutInList,
  isSaving,
  listLoading,
  onToggleList,
}: ScoutHeaderProps) {
  // Debug: Log scout data in header only when it changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ScoutHeader: received scout data:', scout);
      console.log('ScoutHeader: scout name:', scout?.name);
    }
  }, [scout]);

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6d6d6d] mb-6">
        <Link href="/member/dashboard" className="hover:text-[#8c1a10] transition-colors cursor-pointer">
          Wonderkids
        </Link>
        <span>›</span>
        <Link href="/member/scouts" className="hover:text-[#8c1a10] transition-colors cursor-pointer">
          Scouts
        </Link>
        <span>›</span>
        <span className="text-[#2e3138]">{scout.scout_name || scout.name || "Scout Name"}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#2e3138]">{scout.scout_name || scout.name || "Scout Name"}
        </h1>
        <Button
          onClick={onToggleList}
          disabled={isSaving || listLoading}
          className={`${
            isScoutInList
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-[#8c1a10] hover:bg-[#8c1a10]/90 text-white"
          } flex items-center gap-2`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isScoutInList ? "Removing..." : "Adding..."}
            </>
          ) : (
            <>
              {isScoutInList ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  In My List
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Add to List
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </>
  );
}