// src/lib/monitoring/index.ts - EXPORTACIONES DE MONITOREO
// 🎯 PROPÓSITO: Punto único de importación para sistema de monitoreo

export {
  errorMonitor,
  setupErrorMonitoring,
  type ErrorMetrics,
  type ErrorEvent,
  type AlertRule
} from './error-monitor'

// Cache monitoring removed - cache system eliminated