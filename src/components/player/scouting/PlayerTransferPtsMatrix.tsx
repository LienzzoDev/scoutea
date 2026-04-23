'use client'

/**
 * Matriz de evolución (START × ACTUAL).
 *
 * Forma correcta (ver diseño aprobado):
 *  - Filas (START, de arriba a abajo): A+, A, B, C, D.
 *  - Columnas (ACTUAL, de izquierda a derecha): D, C, B, A, A+.
 *  - Cada celda = (calidad ACTUAL) − (calidad START), con escala numérica
 *    D=0, C=1, B=2, A=3, A+=4. Diagonal = 0.
 *  - Esquina sup-izq (START=A+ → ACTUAL=D) = −4 (peor caída).
 *  - Esquina inf-der (START=D → ACTUAL=A+) = +4 (mayor mejora).
 */

const ROW_LEVELS = ['A+', 'A', 'B', 'C', 'D'] as const   // START ↓
const COL_LEVELS = ['D', 'C', 'B', 'A', 'A+'] as const  // ACTUAL →

// Colores del header (tinte del nivel).
const LEVEL_COLORS: Record<string, string> = {
  'A+': 'text-[#22c55e]',
  'A': 'text-[#3b82f6]',
  'B': 'text-[#3b82f6]',
  'C': 'text-[#eab308]',
  'D': 'text-[#ef4444]',
}

// Color de fondo de cada celda según magnitud (más claro cuanto más cerca del 0).
function cellClasses(value: number, isHighlighted: boolean): string {
  if (isHighlighted) {
    return 'bg-[#8c1a10] text-white ring-2 ring-[#8c1a10] ring-offset-1'
  }
  if (value === 0) return 'bg-gray-50 text-gray-500'
  const mag = Math.abs(value)
  if (value > 0) {
    if (mag >= 4) return 'bg-green-300 text-green-900'
    if (mag === 3) return 'bg-green-200 text-green-800'
    if (mag === 2) return 'bg-green-100 text-green-700'
    return 'bg-green-50 text-green-600'
  }
  // negativo
  if (mag >= 4) return 'bg-orange-300 text-orange-900'
  if (mag === 3) return 'bg-orange-200 text-orange-800'
  if (mag === 2) return 'bg-orange-100 text-orange-700'
  return 'bg-orange-50 text-orange-600'
}

interface TransferMatrixProps {
  title: string
  initialLevel: string | null
  currentLevel: string | null
  points: number | null
}

function TransferMatrix({ title, initialLevel, currentLevel, points }: TransferMatrixProps) {
  // Índices del jugador en cada eje.
  const rowIdx = initialLevel ? ROW_LEVELS.indexOf(initialLevel as typeof ROW_LEVELS[number]) : -1
  const colIdx = currentLevel ? COL_LEVELS.indexOf(currentLevel as typeof COL_LEVELS[number]) : -1

  return (
    <div className="bg-white border border-[#e7e7e7] rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-[#e7e7e7]">
        <h3 className="font-semibold text-[#2e3138] text-center">{title}</h3>
      </div>

      <div className="p-4">
        <table className="w-full border-collapse">
          <thead>
            {/* Banda "ACTUAL" cubriendo todas las columnas de nivel. */}
            <tr>
              <th className="p-2" />
              <th
                colSpan={COL_LEVELS.length}
                className="p-1 text-xs tracking-wider font-semibold text-[#6d6d6d] text-center"
              >
                ACTUAL
              </th>
            </tr>
            <tr>
              <th className="p-2 text-xs text-[#6d6d6d] font-semibold uppercase tracking-wider align-middle">
                START
              </th>
              {COL_LEVELS.map((level) => (
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
            {ROW_LEVELS.map((rowLevel, r) => {
              // Calidad ordinal (D=0, C=1, B=2, A=3, A+=4). Para filas:
              // A+ está arriba (r=0) pero es la calidad más alta → 4 - r.
              const rowQuality = ROW_LEVELS.length - 1 - r
              return (
                <tr key={rowLevel}>
                  <td className={`p-2 text-center font-semibold text-sm ${LEVEL_COLORS[rowLevel] || 'text-gray-700'}`}>
                    {rowLevel}
                  </td>
                  {COL_LEVELS.map((colLevel, c) => {
                    // Columnas van de D (0) a A+ (4) → calidad = c.
                    const colQuality = c
                    const value = colQuality - rowQuality
                    const isHighlighted = r === rowIdx && c === colIdx
                    return (
                      <td
                        key={colLevel}
                        className={`p-2 text-center text-sm font-medium border border-gray-100 ${cellClasses(value, isHighlighted)}`}
                      >
                        {value > 0 ? `+${value}` : value}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
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
