'use client'

// Niveles de la matriz
const LEVELS = ['A+', 'A', 'B', 'C', 'D']

// Colores por nivel
const LEVEL_COLORS: Record<string, string> = {
  'A+': 'text-[#22c55e]',
  'A': 'text-[#3b82f6]',
  'B': 'text-[#3b82f6]',
  'C': 'text-[#eab308]',
  'D': 'text-[#ef4444]',
}

interface TransferMatrixProps {
  title: string
  initialLevel: string | null
  currentLevel: string | null
  points: number | null
}

function TransferMatrix({ title, initialLevel, currentLevel, points }: TransferMatrixProps) {
  const startIdx = initialLevel ? LEVELS.indexOf(initialLevel) : -1
  const currentIdx = currentLevel ? LEVELS.indexOf(currentLevel) : -1

  return (
    <div className="bg-white border border-[#e7e7e7] rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-[#e7e7e7]">
        <h3 className="font-semibold text-[#2e3138] text-center">{title}</h3>
      </div>

      <div className="p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs text-[#6d6d6d] font-normal">
                <span className="text-[10px]">START &#x2193;</span>
                <br />
                <span className="text-[10px]">CURRENT &#x2192;</span>
              </th>
              {LEVELS.map((level) => (
                <th
                  key={level}
                  className={`p-2 text-center font-semibold text-sm ${LEVEL_COLORS[level] || 'text-gray-700'}`}
                >
                  {level}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((rowLevel, rowIdx) => (
              <tr key={rowLevel}>
                <td className={`p-2 text-center font-semibold text-sm ${LEVEL_COLORS[rowLevel] || 'text-gray-700'}`}>
                  {rowLevel}
                </td>
                {LEVELS.map((colLevel, colIdx) => {
                  const value = colIdx - rowIdx
                  const isHighlighted = rowIdx === startIdx && colIdx === currentIdx

                  return (
                    <td
                      key={colLevel}
                      className={`p-2 text-center text-sm font-medium border border-gray-100 ${
                        isHighlighted
                          ? 'bg-[#8c1a10] text-white ring-2 ring-[#8c1a10] ring-offset-1'
                          : value > 0
                          ? 'bg-green-50 text-green-600'
                          : value < 0
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {value > 0 ? `+${value}` : value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 pt-4 border-t border-[#e7e7e7]">
          <div className="flex items-center justify-between text-xs text-[#6d6d6d]">
            <div className="flex items-center gap-2">
              <span>Initial:</span>
              <span className={`font-semibold ${LEVEL_COLORS[initialLevel || ''] || ''}`}>
                {initialLevel || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Current:</span>
              <span className={`font-semibold ${LEVEL_COLORS[currentLevel || ''] || ''}`}>
                {currentLevel || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Points:</span>
              <span
                className={`font-bold ${
                  points !== null && points > 0
                    ? 'text-green-600'
                    : points !== null && points < 0
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {points !== null ? (points > 0 ? `+${points}` : points) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PlayerTransferPtsMatrixProps {
  initialTeamLevel: string | null
  currentTeamLevel: string | null
  teamPts: number | null
  initialCompetitionLevel: string | null
  currentCompetitionLevel: string | null
  competitionPts: number | null
}

export default function PlayerTransferPtsMatrix({
  initialTeamLevel,
  currentTeamLevel,
  teamPts,
  initialCompetitionLevel,
  currentCompetitionLevel,
  competitionPts,
}: PlayerTransferPtsMatrixProps) {
  const hasData = initialTeamLevel || initialCompetitionLevel

  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-lg border border-[#e7e7e7]">
        <div className="text-center py-8 text-[#6d6d6d]">
          No hay datos de Transfer Points disponibles.
          <br />
          <span className="text-sm">Los puntos se calculan comparando niveles iniciales con los actuales.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TransferMatrix
        title="EQUIPO"
        initialLevel={initialTeamLevel}
        currentLevel={currentTeamLevel}
        points={teamPts}
      />
      <TransferMatrix
        title="COMPETICION"
        initialLevel={initialCompetitionLevel}
        currentLevel={currentCompetitionLevel}
        points={competitionPts}
      />
    </div>
  )
}
