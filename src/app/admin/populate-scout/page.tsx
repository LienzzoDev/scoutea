'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PopulateScoutDataPage() {
  const [scoutId, setScoutId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePopulate = async () => {
    if (!scoutId.trim()) {
      setError('Please enter a Scout ID')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/populate-scout-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scoutId: scoutId.trim() }),
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
          Populate Scout Data
        </h1>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scout ID
              </label>
              <Input
                type="text"
                placeholder="Enter Scout ID (e.g., cm...)"
                value={scoutId}
                onChange={(e) => setScoutId(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find Scout IDs in the database or from /api/scouts/available
              </p>
            </div>

            <Button
              onClick={handlePopulate}
              disabled={loading || !scoutId.trim()}
              className="w-full bg-[#8c1a10] hover:bg-[#6d1410] text-white"
            >
              {loading ? 'Populating...' : 'Populate Scout Data'}
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
                  <span className="font-medium text-gray-700">Scout:</span>
                  <span className="text-gray-600">{result.data.scoutName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Scout ID:</span>
                  <span className="text-gray-600 font-mono text-xs">
                    {result.data.scoutId}
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
                    Reports Created:
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {result.data.reports.map((report: any) => (
                      <div
                        key={report.id_report}
                        className="text-xs bg-white p-2 rounded border border-gray-200"
                      >
                        <span className="font-medium">{report.player_name}</span>
                        <span className="text-gray-500"> - {report.report_type}</span>
                        <span className="text-gray-400">
                          {' '}({new Date(report.report_date).toLocaleDateString()})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-green-200">
                <a
                  href={`/member/scout/${result.data.scoutId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#8c1a10] hover:underline"
                >
                  → View Scout Profile
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
            <li>Get a Scout ID from the database or create one</li>
            <li>Enter the Scout ID in the input field above</li>
            <li>Click "Populate Scout Data" to create sample reports</li>
            <li>
              This will create 8 reports with random players from the database
            </li>
            <li>
              Each report will have metrics (ROI, Profit, Potential) and some will
              have video URLs
            </li>
            <li>
              Visit the scout profile page to see the populated data
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
