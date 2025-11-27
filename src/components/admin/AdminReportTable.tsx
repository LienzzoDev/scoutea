"use client"

import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Trash2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"

import { Button } from "@/components/ui/button"

interface Report {
  id_report: string
  report_status: string | null
  report_validation: string | null
  report_author: string | null
  scout_id: string | null
  report_date: string | null
  report_type: string | null
  id_player: number | null
  form_potential: string | null
  roi: number | null
  profit: number | null
  createdAt: string
  // Player data (from join)
  player?: {
    player_name: string
    position_player: string | null
    team_name: string | null
    nationality_1: string | null
    age: number | null
  }
  // Scout data (from join)
  scout?: {
    scout_name: string
    name: string | null
    surname: string | null
  }
}

interface AdminReportTableProps {
  reports: Report[]
  onDelete?: (reportId: string) => void
}

type SortField = keyof Report | 'player_name' | 'scout_name' | null
type SortOrder = 'asc' | 'desc'

export default function AdminReportTable({ reports, onDelete }: AdminReportTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedReports = useMemo(() => {
    if (!sortField) return reports

    return [...reports].sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortField === 'player_name') {
        aValue = a.player?.player_name
        bValue = b.player?.player_name
      } else if (sortField === 'scout_name') {
        aValue = a.scout?.scout_name
        bValue = b.scout?.scout_name
      } else {
        aValue = a[sortField as keyof Report]
        bValue = b[sortField as keyof Report]
      }

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [reports, sortField, sortOrder])

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500" />
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 text-[#FF5733]" />
      : <ArrowDown className="w-3 h-3 text-[#FF5733]" />
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
      'approved': 'bg-green-900/50 text-green-300 border-green-700',
      'rejected': 'bg-red-900/50 text-red-300 border-red-700',
      'draft': 'bg-slate-700/50 text-slate-300 border-slate-600',
    }
    const colorClass = statusColors[status.toLowerCase()] || 'bg-slate-700/50 text-slate-300 border-slate-600'
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
        {status}
      </span>
    )
  }

  const getPotentialDisplay = (potential: string | null) => {
    if (!potential) return 'N/A'
    const numPotential = parseInt(potential, 10)
    if (isNaN(numPotential)) return potential
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${i <= numPotential ? 'bg-[#8B0000]' : 'bg-slate-700'}`}
          />
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-400">No se encontraron reportes</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-[#131921] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1a2332] border-b border-slate-700">
            <tr>
              <th
                className="p-4 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className={`font-semibold text-sm ${sortField === 'createdAt' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Fecha
                  </span>
                  {renderSortIcon('createdAt')}
                </div>
              </th>
              <th
                className="p-4 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('player_name')}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className={`font-semibold text-sm ${sortField === 'player_name' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Jugador
                  </span>
                  {renderSortIcon('player_name')}
                </div>
              </th>
              <th
                className="p-4 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('scout_name')}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className={`font-semibold text-sm ${sortField === 'scout_name' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Scout
                  </span>
                  {renderSortIcon('scout_name')}
                </div>
              </th>
              <th
                className="p-4 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('report_status')}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className={`font-semibold text-sm ${sortField === 'report_status' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Estado
                  </span>
                  {renderSortIcon('report_status')}
                </div>
              </th>
              <th
                className="p-4 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('form_potential')}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className={`font-semibold text-sm ${sortField === 'form_potential' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Potencial
                  </span>
                  {renderSortIcon('form_potential')}
                </div>
              </th>
              <th
                className="p-4 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('report_type')}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className={`font-semibold text-sm ${sortField === 'report_type' ? 'text-[#FF5733]' : 'text-slate-300'}`}>
                    Tipo
                  </span>
                  {renderSortIcon('report_type')}
                </div>
              </th>
              <th className="p-4 text-center">
                <span className="font-semibold text-sm text-slate-300">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedReports.map((report) => (
              <tr
                key={report.id_report}
                className="hover:bg-slate-700/30 transition-colors"
              >
                <td className="p-4">
                  <span className="text-sm text-white whitespace-nowrap">
                    {formatDate(report.createdAt || report.report_date)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="min-w-[180px]">
                    <p className="text-sm font-medium text-white">
                      {report.player?.player_name || 'N/A'}
                    </p>
                    {report.player && (
                      <p className="text-xs text-slate-400">
                        {report.player.position_player || ''} {report.player.team_name ? `• ${report.player.team_name}` : ''}
                      </p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="min-w-[150px]">
                    <p className="text-sm font-medium text-white">
                      {report.scout?.scout_name || report.report_author || 'N/A'}
                    </p>
                    {report.scout && (report.scout.name || report.scout.surname) && (
                      <p className="text-xs text-slate-400">
                        {report.scout.name} {report.scout.surname}
                      </p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {getStatusBadge(report.report_status)}
                </td>
                <td className="p-4">
                  {getPotentialDisplay(report.form_potential)}
                </td>
                <td className="p-4">
                  <span className="text-sm text-white">
                    {report.report_type || 'N/A'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => router.push(`/admin/reportes/${report.id_report}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    {report.id_player && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        onClick={() => router.push(`/member/player/${report.id_player}`)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300"
                        onClick={() => onDelete(report.id_report)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
