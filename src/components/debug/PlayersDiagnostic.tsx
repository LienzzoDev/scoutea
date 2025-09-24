'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlayers } from '@/hooks/player/usePlayers'

export default function PlayersDiagnostic() {
  const { players, loading, error, pagination, searchPlayers } = usePlayers()
  const [apiTest, setApiTest] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Memoize searchPlayers to avoid infinite re-renders
  const memoizedSearchPlayers = useCallback(() => {
    if (!hasInitialized) {
      console.log('🔍 Initializing usePlayers hook...')
      searchPlayers({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      setHasInitialized(true)
    }
  }, [searchPlayers, hasInitialized])

  // Test direct API call
  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('🔍 Testing API directly from component...')
        const response = await fetch('/api/debug/players-no-auth')
        const data = await response.json()
        console.log('✅ Direct API response:', data)
        setApiTest(data)
      } catch (err) {
        console.error('❌ Direct API error:', err)
        setApiError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    testAPI()
  }, [])

  // Initialize hook
  useEffect(() => {
    memoizedSearchPlayers()
  }, [memoizedSearchPlayers])

  // Log hook state changes
  useEffect(() => {
    if (hasInitialized) {
      console.log('📊 usePlayers state update:', {
        playersCount: players.length,
        loading,
        error: error ? String(error) : null,
        pagination,
        playerNames: players.map(p => p.player_name).slice(0, 5)
      })
    }
  }, [players, loading, error, pagination, hasInitialized])

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">🔍 Players Diagnostic</h2>
      
      <div className="space-y-4">
        {/* Hook Status */}
        <div className="border border-gray-700 p-4 rounded">
          <h3 className="font-semibold text-green-400">usePlayers Hook Status:</h3>
          <p>Initialized: {hasInitialized ? '✅ Yes' : '❌ No'}</p>
          <p>Loading: {loading ? '✅ Yes' : '❌ No'}</p>
          <p>Error: {error ? `❌ ${String(error)}` : '✅ None'}</p>
          <p>Players Count: {players.length}</p>
          <p>Total in DB: {pagination.total}</p>
        </div>

        {/* Direct API Test */}
        <div className="border border-gray-700 p-4 rounded">
          <h3 className="font-semibold text-blue-400">Direct API Test (No Auth):</h3>
          {apiError ? (
            <p className="text-red-400">❌ Error: {apiError}</p>
          ) : apiTest ? (
            <div>
              <p>✅ Success</p>
              <p>Players: {apiTest.data?.players?.length || 'No players array'}</p>
              <p>Message: {apiTest.message || 'None'}</p>
            </div>
          ) : (
            <p>⏳ Loading...</p>
          )}
        </div>

        {/* Players List */}
        <div className="border border-gray-700 p-4 rounded">
          <h3 className="font-semibold text-yellow-400">Players from Hook:</h3>
          {players.length > 0 ? (
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {players.map(player => (
                <li key={player.id} className="text-sm">
                  {player.player_name || 'No name'} - {player.team_name || 'No team'} (Rating: {player.player_rating || 'N/A'})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No players loaded from hook</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="border border-gray-700 p-4 rounded">
          <h3 className="font-semibold text-orange-400">Quick Actions:</h3>
          <button 
            onClick={() => {
              console.log('🔄 Manual refresh...')
              searchPlayers({
                page: 1,
                limit: 20,
                sortBy: 'createdAt',
                sortOrder: 'desc'
              })
            }}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm mr-2"
          >
            Refresh Players
          </button>
          <button 
            onClick={() => {
              console.log('📊 Current state:', { players: players.length, loading, error, pagination })
            }}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          >
            Log State
          </button>
        </div>
      </div>
    </div>
  )
}