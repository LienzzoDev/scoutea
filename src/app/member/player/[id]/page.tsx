"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Facebook,
  Twitter,
  Linkedin,
  Send,
  Play,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MemberNavbar from "@/components/member-navbar";
import { usePlayerList } from "@/hooks/usePlayerList";
import { usePlayers } from "@/hooks/usePlayers";

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.id as string;
  const [activeTab, setActiveTab] = useState("info");
  const [activeStatsTab, setActiveStatsTab] = useState("period");
  const [activeFeaturesTab, setActiveFeaturesTab] = useState("on-the-pitch");
  const [isSaving, setIsSaving] = useState(false);
  const [player, setPlayer] = useState<any>(null);
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
      if (!playerId) return;

      setLoading(true);
      try {
        const playerData = await getPlayer(playerId);
        setPlayer(playerData);
      } catch (error) {
        console.error("Error loading player:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();
  }, [playerId, getPlayer]);

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

  // Mostrar loading si está cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <MemberNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: "55px" }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#6d6d6d]">Cargando jugador...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Mostrar error si no se encuentra el jugador
  if (!player) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <MemberNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: "55px" }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-[#6d6d6d] text-lg">Jugador no encontrado</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6" style={{ marginTop: "55px" }}>
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-80 bg-white rounded-lg p-6 space-y-6 self-start">
            {/* Player Card */}
            <div className="relative">
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <Image
                  src="/logo-member.svg"
                  alt="Scoutea Member Logo"
                  width={120}
                  height={120}
                  className="object-contain opacity-40"
                />
              </div>
              
              {/* Team badge overlay - Top */}
              <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/80 text-white px-3 py-2 rounded-full">
                <span className="text-lg">⚽</span>
                <span className="text-sm font-medium">
                  {player.team_name || "FC Barcelona"}
                </span>
              </div>
              
              {/* Player name and nationality overlay - Bottom */}
              <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-black/80 text-white px-3 py-2 rounded-full">
                <span className="text-lg">🇪🇸</span>
                <span className="text-sm font-medium">
                  {player.player_name || "Player Name"}
                </span>
              </div>
            </div>

            {/* Social Media - Solo mostrar si hay al menos una red social */}
            {(player.facebook_profile ||
              player.twitter_profile ||
              player.linkedin_profile ||
              player.telegram_profile ||
              player.instagram_profile) && (
              <div>
                <p className="text-[#6d6d6d] text-sm mb-3">On social media</p>
                <div className="flex gap-3">
                  {/* Facebook - Solo mostrar si hay datos */}
                  {player.facebook_profile && (
                    <a
                      href={player.facebook_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Facebook className="w-5 h-5 text-[#6d6d6d] hover:text-[#1877f2]" />
                    </a>
                  )}

                  {/* Twitter - Solo mostrar si hay datos */}
                  {player.twitter_profile && (
                    <a
                      href={player.twitter_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Twitter className="w-5 h-5 text-[#6d6d6d] hover:text-[#1da1f2]" />
                    </a>
                  )}

                  {/* LinkedIn - Solo mostrar si hay datos */}
                  {player.linkedin_profile && (
                    <a
                      href={player.linkedin_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Linkedin className="w-5 h-5 text-[#6d6d6d] hover:text-[#0077b5]" />
                    </a>
                  )}

                  {/* Telegram - Solo mostrar si hay datos */}
                  {player.telegram_profile && (
                    <a
                      href={player.telegram_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Send className="w-5 h-5 text-[#6d6d6d] hover:text-[#0088cc]" />
                    </a>
                  )}

                  {/* Instagram - Solo mostrar si hay datos */}
                  {player.instagram_profile && (
                    <a
                      href={player.instagram_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <div className="w-5 h-5 bg-gradient-to-r from-[#f09433] to-[#e6683c] to-[#dc2743] to-[#cc2366] to-[#bc1888] rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Transfer Market Button */}
            <Button
              variant="outline"
              className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white bg-transparent flex items-center justify-center gap-2"
            >
              Transfer market
              <span className="ml-2">↗</span>
            </Button>

            {/* Rating */}
            <div>
              <p className="text-[#6d6d6d] text-sm mb-2">
                Soccer player rating
              </p>
              <p className="text-2xl font-bold text-[#8c1a10] mb-2">
                9.000.000 €
              </p>
              <p className="text-sm text-[#6d6d6d]">Rank</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3cc500] rounded-full"></div>
                <span className="text-sm font-medium">A (7,75) | Rank 495</span>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#6d6d6d] mb-6">
              <span>Wonderkids</span>
              <span>›</span>
              <span>Players</span>
              <span>›</span>
              <span className="text-[#2e3138]">
                {player.player_name || "Player Name"}
              </span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-[#2e3138]">
                {player.player_name || "Player Name"}
              </h1>
              <Button
                onClick={handleToggleList}
                disabled={isSaving || listLoading}
                className={`${
                  isPlayerInList
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-[#8c1a10] hover:bg-[#8c1a10]/90 text-white"
                } flex items-center gap-2`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isPlayerInList ? "Removing..." : "Adding..."}
                  </>
                ) : (
                  <>
                    {isPlayerInList ? (
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

            {/* Tabs */}
            <div className="flex gap-8 border-b border-[#e7e7e7] mb-8">
              <button
                className={`pb-3 font-medium ${
                  activeTab === "info"
                    ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                    : "text-[#6d6d6d]"
                }`}
                onClick={() => setActiveTab("info")}
              >
                Info
              </button>
              <button
                className={`pb-3 font-medium ${
                  activeTab === "reports"
                    ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                    : "text-[#6d6d6d]"
                }`}
                onClick={() => setActiveTab("reports")}
              >
                Reports
              </button>
              <button
                className={`pb-3 font-medium ${
                  activeTab === "highlights"
                    ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                    : "text-[#6d6d6d]"
                }`}
                onClick={() => setActiveTab("highlights")}
              >
                Highlights
              </button>
              <button
                className={`pb-3 font-medium ${
                  activeTab === "stats"
                    ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                    : "text-[#6d6d6d]"
                }`}
                onClick={() => setActiveTab("stats")}
              >
                Stats
              </button>
              <button
                className={`pb-3 font-medium ${
                  activeTab === "features"
                    ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                    : "text-[#6d6d6d]"
                }`}
                onClick={() => setActiveTab("features")}
              >
                Features
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "info" && (
              <div className="bg-white p-6">
                <div className="grid grid-cols-2 gap-x-16">
                  {/* Left Column */}
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Name:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.player_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">
                        Date of Birth:
                      </span>
                      <span className="font-medium text-[#2e3138]">
                        {player.date_of_birth
                          ? new Date(player.date_of_birth).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Age:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.age || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2e3138]">
                          1.200.000 € (+82%)
                        </span>
                        <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                          ↑
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Position:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.position_player || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2e3138]">
                          1.200.000 € (+82%)
                        </span>
                        <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                          ↑
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Foot:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.foot || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Height:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.height ? `${player.height} cm` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">
                        Nationality:
                      </span>
                      <span className="font-medium text-[#2e3138]">
                        {player.nationality_1 || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2e3138]">
                          900.000 € (+82%)
                        </span>
                        <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                          ↑
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">
                        Nationality 2:
                      </span>
                      <span className="font-medium text-[#2e3138]">
                        {player.nationality_2 || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">
                        International:
                      </span>
                      <span className="font-medium text-[#2e3138]">
                        Loren Ipsum Dolor
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[#6d6d6d] text-sm">Agent:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.agency || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-0">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Team:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.team_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Country:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.team_country || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">
                        Team Level:
                      </span>
                      <span className="font-medium text-[#2e3138]">
                        {player.team_level || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2e3138]">
                          1.200.000 € (+82%)
                        </span>
                        <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                          ↑
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">On Loan:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.on_loan ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">
                        Owner Club:
                      </span>
                      <span className="font-medium text-[#2e3138]">
                        {player.owner_club || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2e3138]">
                          1.200.000 € (+82%)
                        </span>
                        <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                          ↑
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Country:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.owner_club_country || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">
                        Contract End:
                      </span>
                      <span className="font-medium text-[#2e3138]">
                        {player.contract_end
                          ? new Date(player.contract_end).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">
                        Competition:
                      </span>
                      <span className="font-medium text-[#2e3138]">
                        {player.team_competition || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2e3138]">
                          1.200.000 € (+82%)
                        </span>
                        <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                          ↑
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Country:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.competition_country || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">Tier:</span>
                      <span className="font-medium text-[#2e3138]">
                        {player.competition_tier || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-[#6d6d6d] text-sm">
                        Competition Level:
                      </span>
                      <span className="font-medium text-[#2e3138]">
                        {player.competition_level || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2e3138]">
                          1.200.000 € (+82%)
                        </span>
                        <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                          ↑
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div>
                {/* Overall Rating */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <span className="text-2xl font-bold text-[#2e3138]">5.0</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 bg-[#8c1a10] rounded-full flex items-center justify-center"
                      >
                        <span className="text-white text-xs">⚽</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reports Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Report Card 1 */}
                  <div className="bg-white rounded-lg border border-[#e7e7e7] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#2e3138]">
                          Gines Mesas
                        </h3>
                        <p className="text-sm text-[#6d6d6d]">Tipo de perfil</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 bg-[#8c1a10] rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs">⚽</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <img
                      src="/player-detail-placeholder.svg"
                      alt="Player"
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <p className="text-sm text-[#6d6d6d] mb-3">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </p>
                    <p className="text-xs text-[#6d6d6d]">XX/XX/XXXX</p>
                  </div>

                  {/* Report Card 2 */}
                  <div className="bg-white rounded-lg border border-[#e7e7e7] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#2e3138]">
                          Gines Mesas
                        </h3>
                        <p className="text-sm text-[#6d6d6d]">Tipo de perfil</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-[#2e3138]">
                          5.0
                        </span>
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 bg-[#8c1a10] rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs">⚽</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-[#6d6d6d] mb-3">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                      ullamco laboris.
                    </p>
                    <p className="text-xs text-[#6d6d6d]">XX/XX/XXXX</p>
                  </div>

                  {/* Report Card 3 */}
                  <div className="bg-white rounded-lg border border-[#e7e7e7] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#2e3138]">
                          Gines Mesas
                        </h3>
                        <p className="text-sm text-[#6d6d6d]">Tipo de perfil</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 bg-[#8c1a10] rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs">⚽</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative mb-3">
                      <img
                        src="/player-detail-placeholder.svg"
                        alt="Player"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button className="absolute bottom-2 right-2 bg-[#8c1a10] text-white px-3 py-1 rounded-lg flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        <span className="text-xs">Play</span>
                      </button>
                    </div>
                    <p className="text-sm text-[#6d6d6d]">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </p>
                  </div>

                  {/* Report Card 4 */}
                  <div className="bg-white rounded-lg border border-[#e7e7e7] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#2e3138]">
                          Gines Mesas
                        </h3>
                        <p className="text-sm text-[#6d6d6d]">Tipo de perfil</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 bg-[#8c1a10] rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-xs">⚽</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative mb-3">
                      <img
                        src="/player-detail-placeholder.svg"
                        alt="Player"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-[#6d6d6d]">
                      Lorem ipsum dolor sit amet...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "highlights" && (
              <div className="bg-white p-6">
                {/* Video Player */}
                <div className="relative mb-6">
                  <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src="/player-detail-placeholder.svg"
                      alt="Player Highlights"
                      className="w-full h-full object-cover"
                    />
                    {/* Play Button Overlay */}
                    <button className="absolute bottom-4 right-4 bg-[#8c1a10] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#8c1a10]/90 transition-colors">
                      <Play className="w-4 h-4" />
                      <span className="text-sm font-medium">Play</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[#6d6d6d] text-sm">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>
            )}

            {activeTab === "stats" && (
              <div>
                {/* Secondary Tabs */}
                <div className="flex gap-8 border-b border-[#e7e7e7] mb-6">
                  <button
                    className={`pb-3 font-medium ${
                      activeStatsTab === "period"
                        ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                        : "text-[#6d6d6d]"
                    }`}
                    onClick={() => setActiveStatsTab("period")}
                  >
                    Período
                  </button>
                  <button
                    className={`pb-3 font-medium ${
                      activeStatsTab === "radar"
                        ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                        : "text-[#6d6d6d]"
                    }`}
                    onClick={() => setActiveStatsTab("radar")}
                  >
                    Radar
                  </button>
                  <button
                    className={`pb-3 font-medium ${
                      activeStatsTab === "beeswarm"
                        ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                        : "text-[#6d6d6d]"
                    }`}
                    onClick={() => setActiveStatsTab("beeswarm")}
                  >
                    Enjambre
                  </button>
                  <button
                    className={`pb-3 font-medium ${
                      activeStatsTab === "lollipop"
                        ? "border-b-2 border-[#8c1a10] text-[#8c1a10]"
                        : "text-[#6d6d6d]"
                    }`}
                    onClick={() => setActiveStatsTab("lollipop")}
                  >
                    Paleta
                  </button>
                </div>

                {/* Stats Content */}
                {activeStatsTab === "period" && (
                  <div className="bg-white p-6">
                    {/* Column Headers */}
                    <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-200 mb-6">
                      <span className="font-medium text-[#2e3138]">Metric</span>
                      <span className="font-medium text-[#2e3138]">Total</span>
                      <span className="font-medium text-[#2e3138]">P90</span>
                      <span className="font-medium text-[#2e3138]">Avg</span>
                      <span className="font-medium text-[#2e3138]">Max</span>
                    </div>
                    {/* General */}
                    <div className="mb-8">
                      <h3 className="font-bold text-[#8c1a10] mb-4">General</h3>
                      <div className="space-y-0">
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Matches
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("matches", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("matches", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("matches", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("matches", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Minutes
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("minutes", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("minutes", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("minutes", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("minutes", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Yellow Cards
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Yellow Cards", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Yellow Cards", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Yellow Cards", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Yellow Cards", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3">
                          <span className="font-medium text-[#2e3138]">
                            Red Cards
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Red Cards", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Red Cards", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Red Cards", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Red Cards", "maximumValue")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Goalkeeping */}
                    <div className="mb-8">
                      <h3 className="font-bold text-[#8c1a10] mb-4">
                        Goalkeeping
                      </h3>
                      <div className="space-y-0">
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Conceded Goals
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("concededGoals", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("concededGoals", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("concededGoals", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("concededGoals", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Prevented Goals
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("preventedGoals", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("preventedGoals", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("preventedGoals", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("preventedGoals", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Shots Against
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("shotsAgainst", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("shotsAgainst", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("shotsAgainst", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("shotsAgainst", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Clean Sheets (%)
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "cleanSheetsPercentage",
                              "totalValue"
                            )}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("cleanSheetsPercentage", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "cleanSheetsPercentage",
                              "averageValue"
                            )}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "cleanSheetsPercentage",
                              "maximumValue"
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3">
                          <span className="font-medium text-[#2e3138]">
                            Save Rate (%)
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("saveRate", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("saveRate", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("saveRate", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("saveRate", "maximumValue")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Defending */}
                    <div className="mb-8">
                      <h3 className="font-bold text-[#8c1a10] mb-4">
                        Defending
                      </h3>
                      <div className="space-y-0">
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Tackles
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("tackles", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("tackles", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("tackles", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("tackles", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Interceptions
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("interceptions", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("interceptions", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("interceptions", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("interceptions", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3">
                          <span className="font-medium text-[#2e3138]">
                            Fouls
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("fouls", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("fouls", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("fouls", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("fouls", "maximumValue")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Passing */}
                    <div className="mb-8">
                      <h3 className="font-bold text-[#8c1a10] mb-4">Passing</h3>
                      <div className="space-y-0">
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Passes
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Passes", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Passes", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Passes", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Passes", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Forward Passes
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Forward Passes", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Forward Passes", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Forward Passes", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Forward Passes", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Crosses
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Crosses", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Crosses", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Crosses", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Crosses", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Assists
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Assists", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Assists", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Assists", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Assists", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3">
                          <span className="font-medium text-[#2e3138]">
                            Accurate Passes (%)
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Pass Accuracy", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Pass Accuracy", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Pass Accuracy", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Pass Accuracy", "maximumValue")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Finishing */}
                    <div className="mb-8">
                      <h3 className="font-bold text-[#8c1a10] mb-4">
                        Finishing
                      </h3>
                      <div className="space-y-0">
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Shots
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Shots", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Shots", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Shots", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Shots", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Goals
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Goals", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Goals", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Goals", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("Goals", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3">
                          <span className="font-medium text-[#2e3138]">
                            Effectiveness (%)
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("effectiveness", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("effectiveness", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("effectiveness", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("effectiveness", "maximumValue")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 1vs1 */}
                    <div className="mb-8">
                      <h3 className="font-bold text-[#8c1a10] mb-4">1vs1</h3>
                      <div className="space-y-0">
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Off Duels
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("offDuels", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("offDuels", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("offDuels", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("offDuels", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Def Duels
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("defDuels", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("defDuels", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("defDuels", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("defDuels", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Aer Duels
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("aerDuels", "totalValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("aerDuels", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("aerDuels", "averageValue")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("aerDuels", "maximumValue")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Off Duels Won (%)
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "offDuelsWonPercentage",
                              "totalValue"
                            )}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("offDuelsWonPercentage", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "offDuelsWonPercentage",
                              "averageValue"
                            )}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "offDuelsWonPercentage",
                              "maximumValue"
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100">
                          <span className="font-medium text-[#2e3138]">
                            Def Duels Won (%)
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "defDuelsWonPercentage",
                              "totalValue"
                            )}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("defDuelsWonPercentage", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "defDuelsWonPercentage",
                              "averageValue"
                            )}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "defDuelsWonPercentage",
                              "maximumValue"
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 py-3">
                          <span className="font-medium text-[#2e3138]">
                            Aer Duels Won (%)
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "aerDuelsWonPercentage",
                              "totalValue"
                            )}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue("aerDuelsWonPercentage", "p90Value")}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "aerDuelsWonPercentage",
                              "averageValue"
                            )}
                          </span>
                          <span className="text-[#6d6d6d]">
                            {getStatValue(
                              "aerDuelsWonPercentage",
                              "maximumValue"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStatsTab === "radar" && (
                  <div className="bg-white p-6">
                    {/* Radar Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-[#8c1a10]">
                          RADAR
                        </h3>
                        <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
                      </div>
                    </div>

                    {/* Filters and Options */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Período
                          </label>
                          <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                            <option>Select Period</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Estadísticas
                          </label>
                          <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                            <option>Select Stats</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="max"
                              className="rounded"
                            />
                            <label
                              htmlFor="max"
                              className="text-sm text-[#2e3138]"
                            >
                              Max
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="min"
                              className="rounded"
                            />
                            <label
                              htmlFor="min"
                              className="text-sm text-[#2e3138]"
                            >
                              Min
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="avg"
                              className="rounded"
                            />
                            <label
                              htmlFor="avg"
                              className="text-sm text-[#2e3138]"
                            >
                              AVG
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="norm"
                              className="rounded"
                            />
                            <label
                              htmlFor="norm"
                              className="text-sm text-[#2e3138]"
                            >
                              Norm
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="raw"
                              className="rounded"
                            />
                            <label
                              htmlFor="raw"
                              className="text-sm text-[#2e3138]"
                            >
                              Raw
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Posición
                          </label>
                          <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                            <option>Select Position</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Edad
                          </label>
                          <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                            <option>Select Age</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Nacionalidad
                          </label>
                          <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                            <option>Select Nationality</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Competición
                          </label>
                          <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                            <option>Select Competition</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            TRFM Value
                          </label>
                          <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                            <option>Select TRFM Value</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="border-2 border-[#8c1a10] rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-[#2e3138] mb-4 text-center">
                        In Play
                      </h4>

                      {/* Radar Chart Placeholder */}
                      <div className="relative w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-4xl mb-4">📊</div>
                          <h5 className="text-lg font-semibold text-[#2e3138] mb-2">
                            Radar Chart
                          </h5>
                          <p className="text-sm text-[#6d6d6d]">
                            Interactive radar visualization
                          </p>
                          <p className="text-xs text-[#6d6d6d] mt-2">
                            Categories: Off Transition, Maintenance,
                            Progression,
                            <br />
                            Finishing, Off Stopped Ball, Def Transition,
                            Recovery,
                            <br />
                            Evitation, Def Stopped Ball
                          </p>
                        </div>
                      </div>

                      {/* Scale labels */}
                      <div className="flex justify-center gap-8 mt-4 text-xs text-gray-600">
                        <span>9.2</span>
                        <span>9.4</span>
                        <span>9.6</span>
                        <span>9.8</span>
                        <span>10.0</span>
                        <span>10.2</span>
                        <span>10.4</span>
                        <span>10.6</span>
                        <span>10.8</span>
                        <span>11.0</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStatsTab === "beeswarm" && (
                  <div className="bg-white p-6">
                    {/* Beeswarm Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-[#8c1a10]">
                          ENJAMBRE
                        </h3>
                        <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
                      </div>
                    </div>

                    {/* Filters and Options */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Período
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Period</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Estadísticas
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Stats</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="max-beeswarm"
                              className="rounded"
                            />
                            <label
                              htmlFor="max-beeswarm"
                              className="text-sm text-[#2e3138]"
                            >
                              Max
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="min-beeswarm"
                              className="rounded"
                            />
                            <label
                              htmlFor="min-beeswarm"
                              className="text-sm text-[#2e3138]"
                            >
                              Min
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="avg-beeswarm"
                              className="rounded"
                            />
                            <label
                              htmlFor="avg-beeswarm"
                              className="text-sm text-[#2e3138]"
                            >
                              AVG
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="norm-beeswarm"
                              className="rounded"
                            />
                            <label
                              htmlFor="norm-beeswarm"
                              className="text-sm text-[#2e3138]"
                            >
                              Norm
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="raw-beeswarm"
                              className="rounded"
                            />
                            <label
                              htmlFor="raw-beeswarm"
                              className="text-sm text-[#2e3138]"
                            >
                              Raw
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Posición
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Position</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Edad
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Age</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Nacionalidad
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Nationality</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Competición
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Competition</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            TRFM Value
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>TRFM Value</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Beeswarm Chart */}
                    <div className="border-2 border-[#8c1a10] rounded-lg p-6">
                      <div className="relative w-full h-96 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 800 300">
                          {/* Grid lines */}
                          {[
                            -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0,
                            5, 10, 15, 20, 25, 30, 35, 40, 45, 50,
                          ].map((value, i) => {
                            const x = 50 + (value + 50) * 7;
                            return (
                              <g key={value}>
                                <line
                                  x1={x}
                                  y1="20"
                                  x2={x}
                                  y2="280"
                                  stroke="#e5e7eb"
                                  strokeWidth="1"
                                />
                                <text
                                  x={x}
                                  y="295"
                                  textAnchor="middle"
                                  className="text-xs fill-gray-600"
                                >
                                  {value}
                                </text>
                              </g>
                            );
                          })}

                          {/* Beeswarm data points */}
                          {Array.from({ length: 200 }, (_, i) => {
                            // Generate random data points with more density in the center
                            const centerBias = Math.random() * 0.7 + 0.15; // Bias towards center
                            const x =
                              50 +
                              (Math.random() - 0.5) * 600 * centerBias +
                              100;
                            const y = 50 + Math.random() * 200;
                            const size = Math.random() * 8 + 3;
                            const opacity = Math.random() * 0.6 + 0.4;

                            return (
                              <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={size}
                                fill="#60a5fa"
                                opacity={opacity}
                              />
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {activeStatsTab === "lollipop" && (
                  <div className="bg-white p-6">
                    {/* Lollipop Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-[#8c1a10]">
                          PALETA
                        </h3>
                        <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
                      </div>
                    </div>

                    {/* Filters and Options */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Período
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Period</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Estadísticas
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Stats</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="max-lollipop"
                              className="rounded"
                            />
                            <label
                              htmlFor="max-lollipop"
                              className="text-sm text-[#2e3138]"
                            >
                              Max
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="min-lollipop"
                              className="rounded"
                            />
                            <label
                              htmlFor="min-lollipop"
                              className="text-sm text-[#2e3138]"
                            >
                              Min
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="avg-lollipop"
                              className="rounded"
                            />
                            <label
                              htmlFor="avg-lollipop"
                              className="text-sm text-[#2e3138]"
                            >
                              AVG
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="norm-lollipop"
                              className="rounded"
                            />
                            <label
                              htmlFor="norm-lollipop"
                              className="text-sm text-[#2e3138]"
                            >
                              Norm
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="raw-lollipop"
                              className="rounded"
                            />
                            <label
                              htmlFor="raw-lollipop"
                              className="text-sm text-[#2e3138]"
                            >
                              Raw
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Posición
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Position</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Edad
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Age</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Nacionalidad
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Nationality</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            Competición
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>Competition</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2e3138] mb-2">
                            TRFM Value
                          </label>
                          <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
                            <option>TRFM Value</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Lollipop Chart */}
                    <div className="border-2 border-[#8c1a10] rounded-lg p-6">
                      <div className="relative w-full h-96 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 800 400">
                          {/* Grid lines */}
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
                            const x = 100 + value * 60;
                            return (
                              <g key={value}>
                                <line
                                  x1={x}
                                  y1="50"
                                  x2={x}
                                  y2="350"
                                  stroke="#e5e7eb"
                                  strokeWidth="1"
                                />
                              </g>
                            );
                          })}

                          {/* Lollipop data */}
                          {[
                            { value: 1, y: 80 },
                            { value: 1, y: 100 },
                            { value: 1, y: 120 },
                            { value: 1, y: 140 },
                            { value: 2, y: 160 },
                            { value: 2, y: 180 },
                            { value: 3, y: 200 },
                            { value: 3, y: 220 },
                            { value: 3, y: 240 },
                            { value: 4, y: 260 },
                            { value: 4, y: 280 },
                            { value: 4, y: 300 },
                            { value: 4, y: 320 },
                            { value: 6, y: 340 },
                            { value: 6, y: 360 },
                            { value: 7, y: 380 },
                            { value: 9, y: 400 },
                          ].map((item, i) => {
                            const lineLength = item.value * 60;
                            const startX = 100;
                            const endX = startX + lineLength;

                            return (
                              <g key={i}>
                                {/* Line */}
                                <line
                                  x1={startX}
                                  y1={item.y}
                                  x2={endX}
                                  y2={item.y}
                                  stroke="#3b82f6"
                                  strokeWidth="3"
                                />
                                {/* Circle with value */}
                                <circle
                                  cx={endX}
                                  cy={item.y}
                                  r="12"
                                  fill="#3b82f6"
                                />
                                <text
                                  x={endX}
                                  y={item.y}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className="text-xs fill-white font-semibold"
                                >
                                  {item.value}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "features" && (
              <div className="bg-white p-6">
                {/* Features Sub-tabs */}
                <div className="flex gap-8 border-b border-[#e7e7e7] mb-6">
                  <button
                    className={`pb-3 font-medium ${
                      activeFeaturesTab === "on-the-pitch"
                        ? "border-b-2 border-[#8c1a10] text-[#2e3138]"
                        : "text-[#6d6d6d]"
                    }`}
                    onClick={() => setActiveFeaturesTab("on-the-pitch")}
                  >
                    On the Pitch
                  </button>
                  <button
                    className={`pb-3 font-medium ${
                      activeFeaturesTab === "player-role"
                        ? "border-b-2 border-[#8c1a10] text-[#2e3138]"
                        : "text-[#6d6d6d]"
                    }`}
                    onClick={() => setActiveFeaturesTab("player-role")}
                  >
                    Player Role
                  </button>
                  <button
                    className={`pb-3 font-medium ${
                      activeFeaturesTab === "performance"
                        ? "border-b-2 border-[#8c1a10] text-[#2e3138]"
                        : "text-[#6d6d6d]"
                    }`}
                    onClick={() => setActiveFeaturesTab("performance")}
                  >
                    Performance
                  </button>
                  <button
                    className={`pb-3 font-medium ${
                      activeFeaturesTab === "mode"
                        ? "border-b-2 border-[#8c1a10] text-[#2e3138]"
                        : "text-[#6d6d6d]"
                    }`}
                    onClick={() => setActiveFeaturesTab("mode")}
                  >
                    Mode
                  </button>
                </div>

                {/* Features Content */}
                {activeFeaturesTab === "on-the-pitch" && (
                  <div className="space-y-8">
                    {/* On the Pitch */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xl font-bold text-[#8c1a10]">
                          ON THE PITCH
                        </h3>
                        <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
                      </div>

                      {/* Football Pitch with Positions */}
                      <div className="relative bg-green-100 rounded-lg p-8">
                        <svg className="w-full h-80" viewBox="0 0 600 400">
                          {/* Pitch outline */}
                          <rect
                            x="50"
                            y="50"
                            width="500"
                            height="300"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                            rx="10"
                          />

                          {/* Center line */}
                          <line
                            x1="300"
                            y1="50"
                            x2="300"
                            y2="350"
                            stroke="#22c55e"
                            strokeWidth="2"
                          />

                          {/* Center circle */}
                          <circle
                            cx="300"
                            cy="200"
                            r="50"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                          />

                          {/* Goal areas */}
                          <rect
                            x="50"
                            y="150"
                            width="30"
                            height="100"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                          />
                          <rect
                            x="520"
                            y="150"
                            width="30"
                            height="100"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                          />

                          {/* Position blocks */}
                          {/* Goalkeeper */}
                          <rect
                            x="70"
                            y="190"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="90"
                            y="203"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            GK
                          </text>

                          {/* Defenders */}
                          <rect
                            x="150"
                            y="120"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="170"
                            y="133"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            RB
                          </text>

                          <rect
                            x="200"
                            y="120"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="220"
                            y="133"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            CB
                          </text>

                          <rect
                            x="250"
                            y="120"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="270"
                            y="133"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            CB
                          </text>

                          <rect
                            x="300"
                            y="120"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="320"
                            y="133"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            LB
                          </text>

                          {/* Midfielders */}
                          <rect
                            x="150"
                            y="180"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="170"
                            y="193"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            RWB
                          </text>

                          <rect
                            x="200"
                            y="180"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="220"
                            y="193"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            DM
                          </text>

                          <rect
                            x="300"
                            y="180"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="320"
                            y="193"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            LWB
                          </text>

                          <rect
                            x="350"
                            y="180"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="370"
                            y="193"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            LM
                          </text>

                          <rect
                            x="400"
                            y="180"
                            width="40"
                            height="20"
                            fill="#dc2626"
                            rx="4"
                          />
                          <text
                            x="420"
                            y="193"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            LW
                          </text>

                          {/* Right Midfielder - Brown */}
                          <rect
                            x="150"
                            y="240"
                            width="40"
                            height="20"
                            fill="#a16207"
                            rx="4"
                          />
                          <text
                            x="170"
                            y="253"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            RM
                          </text>

                          {/* Attacking Midfielder - Yellow */}
                          <rect
                            x="250"
                            y="240"
                            width="40"
                            height="20"
                            fill="#eab308"
                            rx="4"
                          />
                          <text
                            x="270"
                            y="253"
                            textAnchor="middle"
                            className="text-xs fill-black font-bold"
                          >
                            AM
                          </text>

                          {/* Right Wing - Green */}
                          <rect
                            x="350"
                            y="240"
                            width="40"
                            height="20"
                            fill="#22c55e"
                            rx="4"
                          />
                          <text
                            x="370"
                            y="253"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            RW
                          </text>

                          {/* Striker - Blue */}
                          <rect
                            x="300"
                            y="280"
                            width="40"
                            height="20"
                            fill="#3b82f6"
                            rx="4"
                          />
                          <text
                            x="320"
                            y="293"
                            textAnchor="middle"
                            className="text-xs fill-white font-bold"
                          >
                            ST
                          </text>
                        </svg>
                      </div>
                    </div>

                    {/* Physical */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xl font-bold text-[#8c1a10]">
                          PHYSICAL
                        </h3>
                        <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        {/* Physical Attributes */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[#2e3138] font-medium">
                              Sprinter
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              A+
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#2e3138] font-medium">
                              Marathonian
                            </span>
                            <span className="text-lg font-bold text-yellow-600">
                              C
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#2e3138] font-medium">
                              Bomberman
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              B
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#2e3138] font-medium">
                              360°
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              B
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#2e3138] font-medium">
                              The Rock
                            </span>
                            <span className="text-lg font-bold text-red-600">
                              D
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#2e3138] font-medium">
                              Air Flyer
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              A
                            </span>
                          </div>
                        </div>

                        {/* Radar Chart */}
                        <div className="flex items-center justify-center">
                          <svg className="w-64 h-64" viewBox="0 0 200 200">
                            {/* Concentric circles */}
                            {[1, 2, 3, 4, 5].map((circle, i) => (
                              <circle
                                key={circle}
                                cx="100"
                                cy="100"
                                r={20 + i * 15}
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="1"
                              />
                            ))}

                            {/* Axes */}
                            {Array.from({ length: 10 }, (_, i) => {
                              const angle = i * 36 - 90;
                              const x1 =
                                100 + 80 * Math.cos((angle * Math.PI) / 180);
                              const y1 =
                                100 + 80 * Math.sin((angle * Math.PI) / 180);
                              const x2 =
                                100 + 90 * Math.cos((angle * Math.PI) / 180);
                              const y2 =
                                100 + 90 * Math.sin((angle * Math.PI) / 180);

                              return (
                                <g key={i}>
                                  <line
                                    x1="100"
                                    y1="100"
                                    x2={x1}
                                    y2={y1}
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={x2}
                                    y={y2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="text-xs fill-gray-600"
                                  >
                                    Group {i + 1}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Data segments */}
                            {[
                              { angle: 0, length: 60, color: "#dc2626" },
                              { angle: 36, length: 40, color: "#ea580c" },
                              { angle: 72, length: 80, color: "#22c55e" },
                              { angle: 108, length: 30, color: "#3b82f6" },
                              { angle: 144, length: 70, color: "#8b5cf6" },
                              { angle: 180, length: 50, color: "#dc2626" },
                              { angle: 216, length: 45, color: "#ea580c" },
                              { angle: 252, length: 65, color: "#22c55e" },
                              { angle: 288, length: 35, color: "#3b82f6" },
                              { angle: 324, length: 55, color: "#8b5cf6" },
                            ].map((segment, i) => {
                              const x =
                                100 +
                                segment.length *
                                  Math.cos(
                                    ((segment.angle - 90) * Math.PI) / 180
                                  );
                              const y =
                                100 +
                                segment.length *
                                  Math.sin(
                                    ((segment.angle - 90) * Math.PI) / 180
                                  );

                              return (
                                <polygon
                                  key={i}
                                  points={`100,100 ${x},${y} ${
                                    x +
                                    5 *
                                      Math.cos(
                                        ((segment.angle - 90) * Math.PI) / 180
                                      )
                                  },${
                                    y +
                                    5 *
                                      Math.sin(
                                        ((segment.angle - 90) * Math.PI) / 180
                                      )
                                  }`}
                                  fill={segment.color}
                                  opacity="0.7"
                                />
                              );
                            })}
                          </svg>
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="mt-6 flex gap-4">
                        <select className="p-2 border border-gray-300 rounded-md bg-white">
                          <option>Position</option>
                        </select>
                        <select className="p-2 border border-gray-300 rounded-md bg-white">
                          <option>Age</option>
                        </select>
                        <select className="p-2 border border-gray-300 rounded-md bg-white">
                          <option>Nationality</option>
                        </select>
                        <select className="p-2 border border-gray-300 rounded-md bg-white">
                          <option>Competition</option>
                        </select>
                        <select className="p-2 border border-gray-300 rounded-md bg-white">
                          <option>TRFM Value</option>
                        </select>
                      </div>
                    </div>

                    {/* Foot */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xl font-bold text-[#8c1a10]">
                          FOOT
                        </h3>
                        <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        {/* Left Foot */}
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-[#2e3138] mb-4">
                            LEFT
                          </h4>
                          <div className="relative">
                            <svg className="w-48 h-32" viewBox="0 0 200 120">
                              {/* Triangular bar chart for left foot */}
                              <polygon
                                points="20,100 20,40 120,40 120,100"
                                fill="#22c55e"
                                opacity="0.8"
                              />
                              <text
                                x="70"
                                y="75"
                                textAnchor="middle"
                                className="text-2xl font-bold fill-white"
                              >
                                A
                              </text>
                              <text
                                x="70"
                                y="110"
                                textAnchor="middle"
                                className="text-sm fill-[#2e3138]"
                              >
                                73%
                              </text>
                            </svg>
                            <div className="mt-2">
                              <p className="text-sm text-[#6d6d6d]">
                                Dominance
                              </p>
                              <p className="text-sm text-[#6d6d6d]">Tendency</p>
                            </div>
                          </div>
                        </div>

                        {/* Right Foot */}
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-[#2e3138] mb-4">
                            RIGHT
                          </h4>
                          <div className="relative">
                            <svg className="w-48 h-32" viewBox="0 0 200 120">
                              {/* Triangular bar chart for right foot */}
                              <polygon
                                points="20,100 20,80 60,80 60,100"
                                fill="#eab308"
                                opacity="0.8"
                              />
                              <text
                                x="40"
                                y="95"
                                textAnchor="middle"
                                className="text-lg font-bold fill-white"
                              >
                                B
                              </text>
                              <text
                                x="40"
                                y="110"
                                textAnchor="middle"
                                className="text-sm fill-[#2e3138]"
                              >
                                27%
                              </text>
                            </svg>
                            <div className="mt-2">
                              <p className="text-sm text-[#6d6d6d]">
                                Dominance
                              </p>
                              <p className="text-sm text-[#6d6d6d]">Tendency</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeaturesTab === "player-role" && (
                  <div className="space-y-8">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xl font-bold text-[#8c1a10]">
                          PLAYER ROLE
                        </h3>
                        <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
                      </div>
                      <p className="text-[#6d6d6d]">
                        Player role content coming soon...
                      </p>
                    </div>
                  </div>
                )}

                {activeFeaturesTab === "performance" && (
                  <div className="space-y-8">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xl font-bold text-[#8c1a10]">
                          PERFORMANCE
                        </h3>
                        <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
                      </div>
                      <p className="text-[#6d6d6d]">
                        Performance content coming soon...
                      </p>
                    </div>
                  </div>
                )}

                {activeFeaturesTab === "mode" && (
                  <div className="space-y-8">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-xl font-bold text-[#8c1a10]">
                          MODE
                        </h3>
                        <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
                      </div>
                      <p className="text-[#6d6d6d]">
                        Mode content coming soon...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
