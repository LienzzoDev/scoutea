import { Badge } from '@/components/ui/badge'
import { formatValue, formatROI, formatEconomicChange } from '@/lib/utils/scout-format-utils'
import type { Scout } from '@/types/scout'

interface ScoutEconomicInfoProps {
  scout: Scout
}

// Función helper para mostrar datos con fallback
const getDisplayValue = (value?: number | null, fallback: string = 'Por completar'): string => {
  if (value !== null && value !== undefined) return String(value)
  return fallback
}

export default function ScoutEconomicInfo({ scout }: ScoutEconomicInfoProps) {
  return (
    <div className='bg-white p-6'>
      <div className='grid grid-cols-2 gap-x-16'>
        {/* Left Column */}
        <div className='space-y-0'>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Nombre:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.scout_name || scout.name || 'Por completar'}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Fecha de Nacimiento:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.date_of_birth
                ? new Date(scout.date_of_birth).toLocaleDateString('es-ES')
                : 'Por completar'}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Edad:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.age ? `${scout.age} años` : 'Por completar'}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>País:</span>
            <span className='text-[#2e3138] font-medium'>{scout.country || 'Por completar'}</span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Fecha de Ingreso:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.join_date
                ? new Date(scout.join_date).toLocaleDateString('es-ES')
                : 'Por completar'}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Equipo Favorito:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.favourite_club || 'Por completar'}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Disponible para Trabajar:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.open_to_work === true
                ? 'Sí'
                : scout.open_to_work === false
                  ? 'No'
                  : 'Por confirmar'}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Experiencia Profesional:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.professional_experience || 'Por completar'}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Total de Reportes:</span>
            <span className='text-[#2e3138] font-medium'>
              {getDisplayValue(scout.total_reports)}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Reportes Originales:</span>
            <span className='text-[#2e3138] font-medium'>
              {getDisplayValue(scout.original_reports)}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Especialidad por Nacionalidad:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.nationality_expertise || 'Por completar'}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Especialidad por Competición:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.competition_expertise || 'Por completar'}
            </span>
          </div>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Potencial Promedio:</span>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map(star => (
                <div
                  key={star}
                  className={`w-4 h-4 rounded-full ${
                    star <= (scout.avg_potential || 0) ? 'bg-red-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className='flex justify-between items-center py-3'>
            <span className='text-[#6d6d6d] text-sm'>Edad Inicial Promedio:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.avg_initial_age ? `${scout.avg_initial_age.toFixed(1)} años` : 'Por calcular'}
            </span>
          </div>
        </div>

        {/* Right Column - Economic Data */}
        <div className='space-y-0'>
          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Inversión Total:</span>
            <div className='flex items-center gap-2'>
              <span className='text-[#2e3138] font-medium'>
                {formatValue(scout.total_investment)}
                {(() => {
                  const change = formatEconomicChange(
                    scout.total_investment_change_percent
                  )
                  if (!change.isNeutral && change.text) {
                    return <span className={`ml-1 text-xs ${change.color}`}>({change.text})</span>
                  }
                  return null
                })()}
              </span>
              {scout.total_investment_change_percent !== null &&
                scout.total_investment_change_percent !== undefined && (
                  <Badge
                    className={`text-white text-xs px-1 py-0 ${
                      scout.total_investment_change_percent > 0
                        ? 'bg-[#3cc500]'
                        : scout.total_investment_change_percent < 0
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}
                  >
                    {
                      formatEconomicChange(
                        scout.total_investment_change_percent
                      ).arrow
                    }
                  </Badge>
                )}
            </div>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Beneficio Neto:</span>
            <div className='flex items-center gap-2'>
              <span className='text-[#2e3138] font-medium'>
                {formatValue(scout.net_profits)}
                {(() => {
                  const change = formatEconomicChange(
                    scout.net_profits_change_percent
                  )
                  if (!change.isNeutral && change.text) {
                    return <span className={`ml-1 text-xs ${change.color}`}>({change.text})</span>
                  }
                  return null
                })()}
              </span>
              {scout.net_profits_change_percent !== null &&
                scout.net_profits_change_percent !== undefined && (
                  <Badge
                    className={`text-white text-xs px-1 py-0 ${
                      scout.net_profits_change_percent > 0
                        ? 'bg-[#3cc500]'
                        : scout.net_profits_change_percent < 0
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}
                  >
                    {
                      formatEconomicChange(scout.net_profits_change_percent)
                        .arrow
                    }
                  </Badge>
                )}
            </div>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>ROI:</span>
            <div className='flex items-center gap-2'>
              <span className='text-[#2e3138] font-medium'>
                {formatROI(scout.roi)}
                {(() => {
                  const change = formatEconomicChange(
                    scout.roi_change_percent,
                    true
                  )
                  if (!change.isNeutral && change.text) {
                    return <span className={`ml-1 text-xs ${change.color}`}>({change.text})</span>
                  }
                  return null
                })()}
              </span>
              {scout.roi_change_percent !== null && scout.roi_change_percent !== undefined && (
                <Badge
                  className={`text-white text-xs px-1 py-0 ${
                    scout.roi_change_percent > 0
                      ? 'bg-[#3cc500]'
                      : scout.roi_change_percent < 0
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                  }`}
                >
                  {formatEconomicChange(scout.roi_change_percent, true).arrow}
                </Badge>
              )}
            </div>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Valor TRFM Inicial Promedio:</span>
            <div className='flex items-center gap-2'>
              <span className='text-[#2e3138] font-medium'>
                {formatValue(scout.avg_initial_trfm_value)}
                {(() => {
                  const change = formatEconomicChange(
                    scout.avg_initial_trfm_value_change_percent
                  )
                  if (!change.isNeutral && change.text) {
                    return <span className={`ml-1 text-xs ${change.color}`}>({change.text})</span>
                  }
                  return null
                })()}
              </span>
              {scout.avg_initial_trfm_value_change_percent !== null &&
                scout.avg_initial_trfm_value_change_percent !== undefined && (
                  <Badge
                    className={`text-white text-xs px-1 py-0 ${
                      scout.avg_initial_trfm_value_change_percent > 0
                        ? 'bg-[#3cc500]'
                        : scout.avg_initial_trfm_value_change_percent < 0
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}
                  >
                    {
                      formatEconomicChange(
                        scout.avg_initial_trfm_value_change_percent
                      ).arrow
                    }
                  </Badge>
                )}
            </div>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Máximo Beneficio por Reporte:</span>
            <div className='flex items-center gap-2'>
              <span className='text-[#2e3138] font-medium'>
                {formatValue(scout.max_profit_report)}
                {(() => {
                  const change = formatEconomicChange(
                    scout.max_profit_report_change_percent
                  )
                  if (!change.isNeutral && change.text) {
                    return <span className={`ml-1 text-xs ${change.color}`}>({change.text})</span>
                  }
                  return null
                })()}
              </span>
              {scout.max_profit_report_change_percent !== null &&
                scout.max_profit_report_change_percent !== undefined && (
                  <Badge
                    className={`text-white text-xs px-1 py-0 ${
                      scout.max_profit_report_change_percent > 0
                        ? 'bg-[#3cc500]'
                        : scout.max_profit_report_change_percent < 0
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}
                  >
                    {
                      formatEconomicChange(
                        scout.max_profit_report_change_percent
                      ).arrow
                    }
                  </Badge>
                )}
            </div>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Mínimo Beneficio por Reporte:</span>
            <div className='flex items-center gap-2'>
              <span className='text-[#2e3138] font-medium'>
                {formatValue(scout.min_profit_report)}
                {(() => {
                  const change = formatEconomicChange(
                    scout.min_profit_report_change_percent
                  )
                  if (!change.isNeutral && change.text) {
                    return <span className={`ml-1 text-xs ${change.color}`}>({change.text})</span>
                  }
                  return null
                })()}
              </span>
              {scout.min_profit_report_change_percent !== null &&
                scout.min_profit_report_change_percent !== undefined && (
                  <Badge
                    className={`text-white text-xs px-1 py-0 ${
                      scout.min_profit_report_change_percent > 0
                        ? 'bg-[#3cc500]'
                        : scout.min_profit_report_change_percent < 0
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}
                  >
                    {
                      formatEconomicChange(
                        scout.min_profit_report_change_percent
                      ).arrow
                    }
                  </Badge>
                )}
            </div>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Beneficio Promedio por Reporte:</span>
            <div className='flex items-center gap-2'>
              <span className='text-[#2e3138] font-medium'>
                {formatValue(scout.avg_profit_report)}
                {(() => {
                  const change = formatEconomicChange(
                    scout.avg_profit_report_change_percent
                  )
                  if (!change.isNeutral && change.text) {
                    return <span className={`ml-1 text-xs ${change.color}`}>({change.text})</span>
                  }
                  return null
                })()}
              </span>
              {scout.avg_profit_report_change_percent !== null &&
                scout.avg_profit_report_change_percent !== undefined && (
                  <Badge
                    className={`text-white text-xs px-1 py-0 ${
                      scout.avg_profit_report_change_percent > 0
                        ? 'bg-[#3cc500]'
                        : scout.avg_profit_report_change_percent < 0
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}
                  >
                    {
                      formatEconomicChange(
                        scout.avg_profit_report_change_percent
                      ).arrow
                    }
                  </Badge>
                )}
            </div>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Puntos de Transferencia de Equipo:</span>
            <div className='flex items-center gap-2'>
              <span className='text-[#2e3138] font-medium'>
                {formatValue(scout.transfer_team_pts, ' pts')}
                {(() => {
                  const change = formatEconomicChange(
                    scout.transfer_team_pts_change_percent
                  )
                  if (!change.isNeutral && change.text) {
                    return <span className={`ml-1 text-xs ${change.color}`}>({change.text})</span>
                  }
                  return null
                })()}
              </span>
              {scout.transfer_team_pts_change_percent !== null &&
                scout.transfer_team_pts_change_percent !== undefined && (
                  <Badge
                    className={`text-white text-xs px-1 py-0 ${
                      scout.transfer_team_pts_change_percent > 0
                        ? 'bg-[#3cc500]'
                        : scout.transfer_team_pts_change_percent < 0
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}
                  >
                    {
                      formatEconomicChange(
                        scout.transfer_team_pts_change_percent
                      ).arrow
                    }
                  </Badge>
                )}
            </div>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Nivel Inicial Promedio de Equipo:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.avg_initial_team_level || 'Por calcular'}
            </span>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Puntos de Transferencia de Competición:</span>
            <div className='flex items-center gap-2'>
              <span className='text-[#2e3138] font-medium'>
                {formatValue(scout.transfer_competition_pts, ' pts')}
                {(() => {
                  const change = formatEconomicChange(
                    scout.transfer_competition_pts_change_percent
                  )
                  if (!change.isNeutral && change.text) {
                    return <span className={`ml-1 text-xs ${change.color}`}>({change.text})</span>
                  }
                  return null
                })()}
              </span>
              {scout.transfer_competition_pts_change_percent !== null &&
                scout.transfer_competition_pts_change_percent !== undefined && (
                  <Badge
                    className={`text-white text-xs px-1 py-0 ${
                      scout.transfer_competition_pts_change_percent > 0
                        ? 'bg-[#3cc500]'
                        : scout.transfer_competition_pts_change_percent < 0
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                    }`}
                  >
                    {
                      formatEconomicChange(
                        scout.transfer_competition_pts_change_percent
                      ).arrow
                    }
                  </Badge>
                )}
            </div>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Nivel Inicial Promedio de Competición:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.avg_initial_competition_level || 'Por calcular'}
            </span>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>ELO del Scout:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.scout_elo ? Math.round(scout.scout_elo).toString() : 'Por calcular'}
            </span>
          </div>

          <div className='flex justify-between items-center py-3 border-b border-gray-100'>
            <span className='text-[#6d6d6d] text-sm'>Nivel del Scout:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.scout_level || 'Por determinar'}
            </span>
          </div>

          <div className='flex justify-between items-center py-3'>
            <span className='text-[#6d6d6d] text-sm'>Ranking del Scout:</span>
            <span className='text-[#2e3138] font-medium'>
              {scout.scout_ranking ? `#${scout.scout_ranking}` : 'Por calcular'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
