/**
 * Utilidades para manejo de reportes
 */

import { isSocialMediaUrl } from '@/constants/social-media'

/**
 * Tipos de contenido de reporte
 */
export type ReportContentType = 'scoutea' | 'video' | 'redes_sociales' | 'web'

/**
 * Interfaz mínima para detectar el tipo de reporte
 */
interface ReportForTypeDetection {
  form_url_video?: string | null
  form_url_report?: string | null
  form_text_report?: string | null
}

/**
 * Determina el tipo de contenido de un reporte basado en sus campos
 *
 * Prioridad:
 * 1. Si tiene video → tipo "video"
 * 2. Si tiene link a red social → tipo "redes_sociales"
 * 3. Si tiene cualquier otro link → tipo "web"
 * 4. Si solo tiene texto o imagen → tipo "scoutea"
 */
export function getReportContentType(report: ReportForTypeDetection): ReportContentType {
  // 1. Si tiene video → tipo "video"
  if (report.form_url_video && report.form_url_video.trim() !== '') {
    return 'video'
  }

  // 2. Si tiene link a red social → tipo "redes_sociales"
  if (report.form_url_report && report.form_url_report.trim() !== '') {
    if (isSocialMediaUrl(report.form_url_report)) {
      return 'redes_sociales'
    }
    // 3. Si tiene cualquier otro link → tipo "web"
    return 'web'
  }

  // 4. Si no tiene video ni link (solo texto o imagen) → tipo "scoutea"
  return 'scoutea'
}

/**
 * Configuración de badges para tipos de contenido
 */
export const REPORT_CONTENT_TYPE_CONFIG: Record<ReportContentType, {
  label: string
  color: string
  bgColor: string
  textColor: string
  icon: string
}> = {
  'scoutea': {
    label: 'Scoutea',
    color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    icon: '📋'
  },
  'video': {
    label: 'Video',
    color: 'bg-red-900/50 text-red-300 border-red-700',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: '🎥'
  },
  'redes_sociales': {
    label: 'Redes Sociales',
    color: 'bg-blue-900/50 text-blue-300 border-blue-700',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: '📱'
  },
  'web': {
    label: 'Web',
    color: 'bg-purple-900/50 text-purple-300 border-purple-700',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: '🌐'
  }
}
