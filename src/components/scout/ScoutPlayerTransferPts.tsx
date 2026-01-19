'use client'

import { useState, useEffect } from 'react'

// Niveles de la matriz
const LEVELS = ['A+', 'A', 'B', 'C', 'D']

// Colores por nivel (basado en imagen de referencia)
const LEVEL_COLORS: Record<string, string> = {
  'A+': 'text-[#22c55e]',  // Verde
  'A': 'text-[#3b82f6]',   // Azul
  'B': 'text-[#3b82f6]',   // Azul
  'C': 'text-[#eab308]',   // Amarillo
  'D': 'text-[#ef4444]',   // Rojo
}

interface TransferPtsData {
  initialTeamLevel: string | null
  currentTeamLevel: string | null
  teamPts: number | null
  initialCompetitionLevel: string | null
  currentCompetitionLevel: string | null
  competitionPts: number | null
}

interface ScoutPlayerTransferPtsProps {
  playerId: string
  playerTeamLevel: string | null
  playerCompetitionLevel: string | null
}

// Componente de matriz individual
function TransferMatrix({
  title,
  initialLevel,
  currentLevel,
  points,
}: {
  title: string
  initialLevel: string | null
  currentLevel: string | null
  points: number | null
}) {
  // Calcular índices para resaltar la celda
  const startIdx = initialLevel ? LEVELS.indexOf(initialLevel) : -1
  const currentIdx = currentLevel ? LEVELS.indexOf(currentLevel) : -1

  return (
    <div className="bg-white border border-[#e7e7e7] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-[#e7e7e7]">
        <h3 className="font-semibold text-[#2e3138] text-center">{title}</h3>
      </div>

      {/* Matrix */}
      <div className="p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs text-[#6d6d6d] font-normal">
                <span className="text-[10px]">START ↓</span>
                <br />
                <span className="text-[10px]">CURRENT →</span>
              </th>
              {LEVELS.map((level) => (
                <th
                  key={level}
                  className={`p-2 text-center font-semibold text-sm ${
                    LEVEL_COLORS[level] || 'text-gray-700'
                  }`}
                >
                  {level}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((rowLevel, rowIdx) => (
              <tr key={rowLevel}>
                <td
                  className={`p-2 text-center font-semibold text-sm ${
                    LEVEL_COLORS[rowLevel] || 'text-gray-700'
                  }`}
                >
                  {rowLevel}
                </td>
                {LEVELS.map((colLevel, colIdx) => {
                  const value = colIdx - rowIdx // Puntos: columna - fila
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

        {/* Leyenda */}
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

export default function ScoutPlayerTransferPts({
  playerId,
  playerTeamLevel,
  playerCompetitionLevel,
}: ScoutPlayerTransferPtsProps) {
  const [data, setData] = useState<TransferPtsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos del primer reporte del jugador para obtener niveles iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Obtener perfil del scout
        const profileRes = await fetch('/api/scout/profile')
        const profileData = await profileRes.json()

        if (!profileData.success) {
          setData(null)
          setIsLoading(false)
          return
        }

        // 2. Obtener reportes del scout para este jugador
        const reportsRes = await fetch(`/api/scout/reports?scoutId=${profileData.scout.id_scout}`)
        const reportsData = await reportsRes.json()

        if (!reportsData.success || !reportsData.data) {
          setData(null)
          setIsLoading(false)
          return
        }

        // 3. Filtrar reportes de este jugador y obtener el primero (más antiguo)
        // Convertir a string para comparar correctamente (playerId es string del URL, id_player es número del API)
        const playerReports = reportsData.data
          .filter((r: { player: { id_player: string | number } }) => String(r.player.id_player) === playerId)
          .sort((a: { report_date: string | null }, b: { report_date: string | null }) => {
            const dateA = a.report_date ? new Date(a.report_date).getTime() : 0
            const dateB = b.report_date ? new Date(b.report_date).getTime() : 0
            return dateA - dateB // Ordenar por fecha ascendente
          })

        if (playerReports.length === 0) {
          setData(null)
          setIsLoading(false)
          return
        }

        // 4. Obtener datos del primer reporte
        const firstReport = playerReports[0] as {
          initial_team_level?: string | null
          initial_competition_level?: string | null
          transfer_team_pts?: number | null
          transfer_competition_pts?: number | null
        }

        setData({
          initialTeamLevel: firstReport.initial_team_level || null,
          currentTeamLevel: playerTeamLevel,
          teamPts: firstReport.transfer_team_pts || null,
          initialCompetitionLevel: firstReport.initial_competition_level || null,
          currentCompetitionLevel: playerCompetitionLevel,
          competitionPts: firstReport.transfer_competition_pts || null,
        })
      } catch (error) {
        console.error('Error loading transfer pts data:', error)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [playerId, playerTeamLevel, playerCompetitionLevel])

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white p-6 rounded-lg">
        <div className="text-center py-12 text-[#6d6d6d]">
          No hay datos de Transfer Points disponibles para este jugador.
          <br />
          <span className="text-sm">Los puntos se calculan cuando existen reportes con datos históricos.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grid de dos matrices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matriz de Equipo */}
        <TransferMatrix
          title="EQUIPO"
          initialLevel={data.initialTeamLevel}
          currentLevel={data.currentTeamLevel}
          points={data.teamPts}
        />

        {/* Matriz de Competición */}
        <TransferMatrix
          title="COMPETICION"
          initialLevel={data.initialCompetitionLevel}
          currentLevel={data.currentCompetitionLevel}
          points={data.competitionPts}
        />
      </div>

      {/* Explicación */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm text-[#6d6d6d]">
        <p className="font-medium text-[#2e3138] mb-2">¿Cómo se calculan los puntos?</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Filas</strong>: Nivel cuando se creó el primer reporte (START)</li>
          <li><strong>Columnas</strong>: Nivel actual del jugador (CURRENT)</li>
          <li><strong>Puntos positivos (+)</strong>: El jugador ha mejorado de nivel</li>
          <li><strong>Puntos negativos (-)</strong>: El jugador ha bajado de nivel</li>
          <li><strong>La celda resaltada</strong> muestra la posición actual del jugador</li>
        </ul>
      </div>
    </div>
  )
}
