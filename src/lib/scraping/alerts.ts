/**
 * 🚨 ALERTAS PERSISTENTES DE SCRAPING
 *
 * Gestión de ScrapingAlert: se registra una alerta pendiente cuando el
 * scraping de una entidad falla (aparece el triángulo rojo en la tabla de
 * jugadores del admin) y se resuelve automáticamente cuando el scraping
 * vuelve a funcionar para esa entidad.
 */

import { prisma } from '@/lib/db'

/**
 * Registrar (o refrescar) la alerta pendiente de una entidad
 */
export async function registerScrapingAlert(params: {
  entityType: 'player' | 'team'
  entityId: string
  entityName: string | null
  url: string
  errorType: string
  errorMessage?: string
  httpStatus?: number
}): Promise<void> {
  try {
    const existing = await prisma.scrapingAlert.findFirst({
      where: {
        entityType: params.entityType,
        entityId: params.entityId,
        status: 'pending'
      }
    })

    if (existing) {
      await prisma.scrapingAlert.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: new Date(),
          seenCount: { increment: 1 },
          errorType: params.errorType,
          ...(params.errorMessage !== undefined && { errorMessage: params.errorMessage }),
          ...(params.httpStatus !== undefined && { httpStatus: params.httpStatus })
        }
      })
    } else {
      await prisma.scrapingAlert.create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          entityName: params.entityName,
          url: params.url,
          errorType: params.errorType,
          ...(params.errorMessage !== undefined && { errorMessage: params.errorMessage }),
          ...(params.httpStatus !== undefined && { httpStatus: params.httpStatus })
        }
      })
    }
  } catch (error) {
    console.error('Error registrando alerta de scraping:', error)
    // No lanzar: una alerta fallida no debe interrumpir el scraping
  }
}

/**
 * Resolver las alertas pendientes de un jugador (el scraping volvió a funcionar)
 */
export async function resolvePlayerScrapingAlerts(playerId: string | number): Promise<void> {
  try {
    await prisma.scrapingAlert.updateMany({
      where: {
        entityType: 'player',
        entityId: String(playerId),
        status: 'pending'
      },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: 'system',
        resolution: 'scraping_recovered'
      }
    })
  } catch (error) {
    console.error('Error resolviendo alertas de scraping:', error)
  }
}

/**
 * Clasificar un mensaje de error para la alerta (tipo + status HTTP)
 */
export function classifyScrapingError(errorMsg: string): { errorType: string; httpStatus?: number } {
  const statusMatch = errorMsg.match(/HTTP Error (\d{3})/)
  if (statusMatch?.[1]) {
    return { errorType: statusMatch[1], httpStatus: parseInt(statusMatch[1]) }
  }
  // Motivos precisos detectados al analizar la página de Transfermarkt
  if (/ya no existe|redirige a una página genérica/i.test(errorMsg)) {
    return { errorType: 'perfil_inexistente' }
  }
  if (/apunta a un club/i.test(errorMsg)) {
    return { errorType: 'url_incorrecta' }
  }
  if (/no devolvió datos reconocibles/i.test(errorMsg)) {
    return { errorType: 'sin_datos' }
  }
  if (errorMsg.toLowerCase().includes('timeout')) {
    return { errorType: 'timeout' }
  }
  return { errorType: 'unknown' }
}
