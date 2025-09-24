'use client'

import { useState } from 'react'

interface PlayerProfileDebugProps {
  playerId: string
  player: any
  loading: boolean
  error: Error | null
}

export function PlayerProfileDebug({ playerId, player, loading, error }: PlayerProfileDebugProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null

  if (!isVisible) {
    const hasError = !!error
    const hasData = !!player
    
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className={`${
            hasError ? 'bg-red-600' : hasData ? 'bg-green-600' : 'bg-yellow-600'
          } text-white px-3 py-2 rounded-lg text-sm shadow-lg hover:opacity-90 flex items-center gap-2`}
        >
          <span className={`w-2 h-2 rounded-full ${
            hasError ? 'bg-red-300' : hasData ? 'bg-green-300' : 'bg-yellow-300 animate-pulse'
          }`}></span>
          Player Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Player Profile Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
        >
          Hide
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Player ID:</span>
          <span className="font-mono text-xs bg-gray-50 px-1 rounded">
            {playerId || 'Not provided'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Loading:</span>
          <span className={loading ? 'text-yellow-600' : 'text-gray-600'}>
            {loading ? '⏳ Yes' : '✅ No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Has Error:</span>
          <span className={error ? 'text-red-600' : 'text-green-600'}>
            {error ? '❌ Yes' : '✅ No'}
          </span>
        </div>
        
        {error && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-gray-600 text-xs">Error Message:</div>
            <div className="text-xs bg-red-50 p-2 rounded mt-1 text-red-800">
              {error.message}
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">Has Player Data:</span>
          <span className={player ? 'text-green-600' : 'text-gray-600'}>
            {player ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        
        {player && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-gray-600 text-xs">Player Info:</div>
            <div className="text-xs bg-green-50 p-2 rounded mt-1">
              <div><strong>Name:</strong> {player.player_name || 'N/A'}</div>
              <div><strong>Team:</strong> {player.team_name || 'N/A'}</div>
              <div><strong>Position:</strong> {player.position_player || 'N/A'}</div>
              <div><strong>ID:</strong> {player.id_player || player.id || 'N/A'}</div>
            </div>
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={() => {
              // Test the API directly
              fetch(`/api/players/${playerId}`)
                .then(res => {
                  console.log('Direct API test:', res.status, res.statusText)
                  return res.json()
                })
                .then(data => console.log('Direct API response:', data))
                .catch(err => console.error('Direct API error:', err))
            }}
            className="w-full text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
          >
            Test API Directly
          </button>
        </div>
      </div>
    </div>
  )
}