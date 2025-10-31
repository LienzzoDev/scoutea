/**
 * 📡 UTILIDADES PARA LOGS DE SCRAPING EN TIEMPO REAL
 *
 * Este módulo gestiona los logs en memoria para los jobs de scraping,
 * permitiendo streaming en tiempo real vía Server-Sent Events.
 */

// Store para logs en memoria con timestamps para TTL
interface LogEntry {
  logs: string[]
  createdAt: number // timestamp en milisegundos
  lastAccessedAt: number
}

const logsStore = new Map<string, LogEntry>()

// TTL: 1 hora (3600000 ms)
const LOG_TTL_MS = 60 * 60 * 1000

/**
 * Limpiar logs expirados (TTL de 1 hora)
 */
export function cleanExpiredLogs() {
  const now = Date.now()
  let cleanedCount = 0

  for (const [jobId, entry] of logsStore.entries()) {
    // Eliminar si han pasado más de 1 hora desde el último acceso
    if (now - entry.lastAccessedAt > LOG_TTL_MS) {
      logsStore.delete(jobId)
      cleanedCount++
      console.log(`🧹 [LOGS] Log expirado eliminado: ${jobId} (${(now - entry.lastAccessedAt) / 1000 / 60} minutos de inactividad)`)
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 [LOGS] Limpieza automática: ${cleanedCount} logs eliminados`)
  }
}

/**
 * Añadir un log para un job específico
 */
export function addJobLog(jobId: string, message: string) {
  // Limpiar logs expirados en cada llamada (overhead mínimo)
  cleanExpiredLogs()

  const timestamp = new Date().toISOString()
  const logMessage = `[${new Date(timestamp).toLocaleTimeString()}] ${message}`

  // 🖥️ TAMBIÉN IMPRIMIR EN LA CONSOLA DEL SERVIDOR
  console.log(`[${jobId.substring(0, 8)}...] ${logMessage}`)

  const now = Date.now()

  if (!logsStore.has(jobId)) {
    logsStore.set(jobId, {
      logs: [],
      createdAt: now,
      lastAccessedAt: now
    })
  }

  const entry = logsStore.get(jobId)!
  entry.logs.push(logMessage)
  entry.lastAccessedAt = now

  // Limitar a últimos 1000 logs para evitar memory leak
  if (entry.logs.length > 1000) {
    entry.logs.shift()
  }
}

/**
 * Limpiar logs de un job completado manualmente
 */
export function clearJobLogs(jobId: string) {
  logsStore.delete(jobId)
  console.log(`🧹 [LOGS] Logs eliminados manualmente: ${jobId}`)
}

/**
 * Obtener el entry de logs para un job (para uso interno en el endpoint de logs)
 */
export function getLogsStore() {
  return logsStore
}

/**
 * Inicializar o actualizar el entry de logs para un job
 */
export function initializeJobLogs(jobId: string) {
  const now = Date.now()
  if (!logsStore.has(jobId)) {
    logsStore.set(jobId, {
      logs: [],
      createdAt: now,
      lastAccessedAt: now
    })
  }
  return logsStore.get(jobId)!
}

/**
 * Actualizar el timestamp de último acceso
 */
export function updateLastAccessed(jobId: string) {
  const entry = logsStore.get(jobId)
  if (entry) {
    entry.lastAccessedAt = Date.now()
  }
}
