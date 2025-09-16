"use client";

import { usePlayerProfile } from "@/hooks/player/usePlayerProfile";

export default function TestPlayerLoadingPage() {
  // Usar un ID válido de Lionel Messi
  const validPlayerId = "cmfmeeqfb0001zweuke6bhyhp";

  const {
    player,
    loading,
    activeTab,
    setActiveTab
  } = usePlayerProfile(validPlayerId);

  return (
    <div className="min-h-screen bg-[#f8f7f4] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#8c1a10] mb-4">
            🧪 Player Loading Test Page
          </h1>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Debug Information:</h2>
            <ul className="text-sm space-y-1">
              <li><strong>Player ID:</strong> {validPlayerId}</li>
              <li><strong>Loading:</strong> {loading ? 'true' : 'false'}</li>
              <li><strong>Player Data:</strong> {player ? 'Loaded' : 'Not loaded'}</li>
              <li><strong>Active Tab:</strong> {activeTab}</li>
            </ul>
          </div>
        </div>

        {loading && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              <p className="text-yellow-800">Loading player data...</p>
            </div>
          </div>
        )}

        {!loading && !player && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
            <p className="text-red-800">❌ Player not found or failed to load</p>
          </div>
        )}

        {!loading && player && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
            <p className="text-green-800">✅ Player loaded successfully!</p>
            <div className="mt-2 text-sm text-green-700">
              <p><strong>Name:</strong> {player.player_name}</p>
              <p><strong>Position:</strong> {player.position_player}</p>
              <p><strong>Age:</strong> {player.age}</p>
              <p><strong>Team:</strong> {player.team_name}</p>
              <p><strong>Rating:</strong> {player.player_rating}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Console Logs</h2>
          <p className="text-sm text-gray-600">
            Check the browser console for detailed loading logs.
            Open Developer Tools → Console to see the debug information.
          </p>
          
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
            <p>Expected logs:</p>
            <p>• usePlayerProfile: Loading player with ID: {validPlayerId}</p>
            <p>• usePlayers.getPlayer: Called with ID: {validPlayerId}</p>
            <p>• usePlayers.getPlayer: Cache HIT/MISS</p>
            <p>• usePlayerProfile: Player data received: Success</p>
            <p>• usePlayerProfile: Setting loading to false</p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Open browser Developer Tools (F12)</li>
            <li>2. Go to Console tab</li>
            <li>3. Refresh this page</li>
            <li>4. Watch for loading state changes</li>
            <li>5. Check if loading gets stuck or completes</li>
          </ol>
        </div>
      </div>
    </div>
  );
}