/**
 * Utilidad para proteger APIs de debug en producción
 *
 * NOTA: La mayoría de las rutas de debug fueron eliminadas.
 * Solo se mantienen las esenciales protegidas con autenticación admin.
 */

export const DEBUG_APIS_TO_PROTECT = [
  '/api/debug/webhook-logs' // Logs de webhooks Stripe - solo admins
]

/**
 * Middleware para proteger APIs de debug en producción
 */
export function isDebugApiAllowed(pathname: string, userRole?: string): boolean {
  // En desarrollo, permitir todo
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // En producción, solo admins pueden acceder a APIs de debug
  if (pathname.startsWith('/api/debug/')) {
    return userRole === 'admin'
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
      code: 'DEBUG_API_BLOCKED',
      message: 'This debug endpoint is only available to administrators in production'
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
