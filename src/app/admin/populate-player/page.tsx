'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PopulatePlayerScoutsPage() {
  const [playerId, setPlayerId] = useState('player-sample-1')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePopulate = async () => {
    if (!playerId.trim()) {
      setError('Please enter a Player ID')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/populate-player-scouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId: playerId.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Error populating data')
      }
    } catch (err) {
      setError('Error connecting to server')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#000000] mb-8">
          Populate Player Scout Reports
        </h1>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player ID
              </label>
              <Input
                type="text"
                placeholder="Enter Player ID"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: player-sample-1 (or use any player ID from database)
              </p>
            </div>

            <Button
              onClick={handlePopulate}
              disabled={loading || !playerId.trim()}
              className="w-full bg-[#8c1a10] hover:bg-[#6d1410] text-white"
            >
              {loading ? 'Populating...' : 'Populate Scout Reports'}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">Error:</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 font-medium mb-2">✅ Success!</p>
              <p className="text-sm text-gray-700 mb-4">{result.message}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Player:</span>
                  <span className="text-gray-600">{result.data.playerName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Player ID:</span>
                  <span className="text-gray-600 font-mono text-xs">
                    {result.data.playerId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Reports Created:</span>
                  <span className="text-gray-600">{result.data.reportsCreated}</span>
                </div>
              </div>

              {result.data.reports && result.data.reports.length > 0 && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Scout Reports Created:
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.data.reports.map((report: any) => (
                      <div
                        key={report.id_report}
                        className="text-xs bg-white p-3 rounded border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {report.scout_name}
                          </span>
                          <span className="text-[#8c1a10] font-medium">
                            ELO: {report.scout_elo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">
                            {report.report_type}
                          </span>
                          <span>•</span>
                          <span>Potential: {report.potential?.toFixed(1)}%</span>
                          <span>•</span>
                          <span>ROI: {report.roi?.toFixed(1)}%</span>
                        </div>
                        <div className="text-gray-400 mt-1">
                          {new Date(report.report_date).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-green-200">
                <a
                  href={`/member/player/${result.data.playerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#8c1a10] hover:underline font-medium"
                >
                  → View Player Profile
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            ℹ️ How to use
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Enter a Player ID (default is player-sample-1)</li>
            <li>Click "Populate Scout Reports" to create sample reports</li>
            <li>
              This will create 5 scout reports from different scouts with high ELO
            </li>
            <li>
              Each report will have different types: Scouting, Technical, Physical, Tactical, Mental
            </li>
            <li>
              Reports include metrics (ROI, Profit, Potential) and some have video URLs
            </li>
            <li>
              Visit the player profile page to see the scout reports in the "Scouts" tab
            </li>
          </ol>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>💡 Tip:</strong> You can run this multiple times to add more reports from different scouts!
          </p>
        </div>
      </div>
    </div>
  )
}
