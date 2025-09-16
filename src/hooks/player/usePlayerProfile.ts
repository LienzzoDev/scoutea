"use client";

import { useState, useEffect } from "react";

import { usePlayerList } from "@/hooks/player/usePlayerList";
import { usePlayers } from "@/hooks/player/usePlayers";
import type { Player } from "@/types/player";

export function usePlayerProfile(playerId: string) {
  const [activeTab, setActiveTab] = useState("info");
  const [activeStatsTab, setActiveStatsTab] = useState("period");
  const [activeFeaturesTab, setActiveFeaturesTab] = useState("on-the-pitch");
  const [isSaving, setIsSaving] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    isInList,
    addToList,
    removeFromList,
    loading: listLoading,
  } = usePlayerList();
  const { getPlayer } = usePlayers();
  const isPlayerInList = isInList(playerId);

  // Helper function to get stat value from new JSON structure
  const getStatValue = (
    metricName: string,
    field: "totalValue" | "p90Value" | "averageValue" | "maximumValue"
  ) => {
    // Try new structure first (PlayerStatsV2)
    const statsV2 = player?.playerStatsV2?.[0]; // Get first period for now
    if (statsV2) {
      // Check core metrics first
      if (metricName === "matches") return statsV2.matches?.toString() || "-";
      if (metricName === "minutes") return statsV2.minutes?.toString() || "-";
      if (metricName === "goals") return statsV2.goals?.toString() || "-";
      if (metricName === "assists") return statsV2.assists?.toString() || "-";
      if (metricName === "shots") return statsV2.shots?.toString() || "-";
      if (metricName === "shots_on_target")
        return statsV2.shots_on_target?.toString() || "-";

      // Check JSON categories
      const categories = [
        "general",
        "attacking",
        "defending",
        "passing",
        "goalkeeping",
        "physical",
        "dribbling",
        "finishing",
        "duels",
      ];
      for (const category of categories) {
        const categoryData = statsV2[category] as any;
        if (categoryData && categoryData[metricName]) {
          const value = categoryData[metricName][field];
          return value
            ? value.toFixed(
                field === "totalValue" || field === "maximumValue" ? 0 : 1
              )
            : "-";
        }
      }
    }

    // Fallback to old structure
    const stat = player?.playerStats?.find(
      (s: any) => s.metricName.toLowerCase() === metricName.toLowerCase()
    );
    return (
      stat?.[field]?.toFixed(
        field === "totalValue" || field === "maximumValue" ? 0 : 1
      ) || "-"
    );
  };

  // Cargar datos del jugador
  useEffect(() => {
    const loadPlayer = async () => {
      if (!playerId) {
        console.log('usePlayerProfile: No playerId provided');
        return;
      }

      console.log('usePlayerProfile: Loading player with ID:', playerId);
      setLoading(true);
      try {
        const playerData = await getPlayer(playerId);
        console.log('usePlayerProfile: Player data received:', playerData ? 'Success' : 'No data');
        setPlayer(playerData);
      } catch (error) {
        console.error("usePlayerProfile: Error loading player:", error);
      } finally {
        console.log('usePlayerProfile: Setting loading to false');
        setLoading(false);
      }
    };

    loadPlayer();
  }, [playerId, getPlayer]); // getPlayer should be stable now

  const handleToggleList = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (isPlayerInList) {
        await removeFromList(playerId);
      } else {
        await addToList(playerId);
      }
    } catch (error) {
      console.error("Error toggling player list:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // State
    activeTab,
    setActiveTab,
    activeStatsTab,
    setActiveStatsTab,
    activeFeaturesTab,
    setActiveFeaturesTab,
    isSaving,
    player,
    loading,
    
    // Derived state
    isPlayerInList,
    listLoading,
    
    // Functions
    handleToggleList,
    getStatValue,
  };
}