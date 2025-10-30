"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import AuthGuard from "@/components/auth/AuthGuard";
import { PlayerProfileDebug } from "@/components/__debug/player-profile-debug";
import MemberNavbar from "@/components/layout/member-navbar";
import PlayerFeatures from "@/components/player/PlayerFeatures";
import PlayerHeader from "@/components/player/PlayerHeader";
import PlayerInfo from "@/components/player/PlayerInfo";
import PlayerReports from "@/components/player/PlayerReports";
import PlayerSidebar from "@/components/player/PlayerSidebar";
import PlayerStats from "@/components/player/PlayerStats";
import PlayerTabs from "@/components/player/PlayerTabs";
import { usePlayerProfile } from "@/hooks/player/usePlayerProfile";

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.id as string;

  const {
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
    error,

    // Period stats state
    selectedPeriod,
    setSelectedPeriod,
    statsLoading,

    // Derived state
    isPlayerInList,
    listLoading,

    // Functions
    handleToggleList,
    getStatValue,
  } = usePlayerProfile(playerId);

  // Debug: Log player data only when it changes
  // IMPORTANTE: Este useEffect debe estar ANTES de cualquier return condicional
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('PlayerProfilePage: player data:', player);
      console.log('PlayerProfilePage: loading state:', loading);
      console.log('PlayerProfilePage: error state:', error);
      console.log('PlayerProfilePage: playerId:', playerId);
    }
  }, [player, loading, error, playerId]);

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

  // Mostrar error si hay un error específico
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <MemberNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: "55px" }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center max-w-md">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <p className="text-[#6d6d6d] text-lg mb-2">Error al cargar el jugador</p>
              <p className="text-sm text-red-600 mb-4">{error.message}</p>
              <p className="text-xs text-gray-500 mb-4">Player ID: {playerId}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#8c1a10] text-white px-4 py-2 rounded hover:bg-[#a01e12] transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </main>
        <PlayerProfileDebug 
          playerId={playerId} 
          player={player} 
          loading={loading} 
          error={error} 
        />
      </div>
    );
  }

  // Mostrar error si no se encuentra el jugador (después de cargar)
  if (!loading && !player) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <MemberNavbar />
        <main className="max-w-7xl mx-auto px-6" style={{ marginTop: "55px" }}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-[#6d6d6d] text-lg">Jugador no encontrado</p>
              <p className="text-sm text-gray-500 mt-2">Player ID: {playerId}</p>
            </div>
          </div>
        </main>
        <PlayerProfileDebug 
          playerId={playerId} 
          player={player} 
          loading={loading} 
          error={error} 
        />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f8f7f4]">
        {/* Header */}
        <MemberNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6" style={{ marginTop: "55px" }}>
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <PlayerSidebar player={player} />

          {/* Right Content */}
          <div className="flex-1">
            <PlayerHeader
              player={player}
              isPlayerInList={isPlayerInList}
              isSaving={isSaving}
              listLoading={listLoading}
              onToggleList={handleToggleList}
            />

            <PlayerTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />{/* Tab Content */}
            {activeTab === "info" && <PlayerInfo player={player} />}
            {activeTab === "reports" && <PlayerReports player={player} />}
            {/* {activeTab === "highlights" && <PlayerHighlights player={player} />} */}
            {activeTab === "stats" && (
              <PlayerStats
                playerId={playerId}
                activeStatsTab={activeStatsTab}
                onStatsTabChange={setActiveStatsTab}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                statsLoading={statsLoading}
                getStatValue={getStatValue}
              />
            )}
            {activeTab === "features" && (
              <PlayerFeatures
                player={player}
                activeFeaturesTab={activeFeaturesTab}
                onFeaturesTabChange={setActiveFeaturesTab}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Debug Component */}
      <PlayerProfileDebug 
        playerId={playerId} 
        player={player} 
        loading={loading} 
        error={error} 
      />
    </div>
    </AuthGuard>
  );
}