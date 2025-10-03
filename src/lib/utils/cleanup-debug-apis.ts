/**
 * Utilidad para limpiar APIs de debug en producción
 * 
 * Este archivo documenta qué APIs de debug deberían ser removidas
 * o protegidas en producción.
 */

export const DEBUG_APIS_TO_REMOVE = [
  '/api/debug/force-assign-role',
  '/api/debug/simulate-payment-webhook', 
  '/api/debug/assign-member-role',
  '/api/debug/auth-status',
  '/api/debug/payment-status',
  '/api/debug/current-user-status'
]

export const DEBUG_APIS_TO_PROTECT = [
  '/api/debug/webhook-logs' // Mantener pero proteger con auth admin
]

/**
 * Middleware para proteger APIs de debug en producción
 */
export function isDebugApiAllowed(pathname: string, userRole?: string): boolean {
  // En desarrollo, permitir todo
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // En producción, solo admins pueden acceder a APIs de debug protegidas
  if (DEBUG_APIS_TO_PROTECT.some(api => pathname.startsWith(api))) {
    return userRole === 'admin'
  }

  // APIs que deben ser removidas completamente en producción
  if (DEBUG_APIS_TO_REMOVE.some(api => pathname.startsWith(api))) {
    return false
  }

  return true
}

/**
 * Respuesta estándar para APIs de debug bloqueadas
 */
export function createDebugBlockedResponse() {
  return new Response(
    JSON.stringify({
      error: 'Debug API not available in production',
      code: 'DEBUG_API_BLOCKED'
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}