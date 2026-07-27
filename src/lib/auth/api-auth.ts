/**
 * Helpers de autenticación/autorización para API routes.
 * Centraliza el check de admin y el de llamadas internas (cron / server-to-server).
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export type ApiAuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }

/**
 * Exige un usuario autenticado. Devuelve 401 si no hay sesión.
 */
export async function requireAuth(): Promise<ApiAuthResult> {
  const { userId } = await auth()
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { ok: true, userId }
}

/**
 * Exige un usuario autenticado con rol admin.
 * Lee el rol de sessionClaims (rápido) y cae a currentUser() si el token
 * no incluye public_metadata.
 */
export async function requireAdmin(): Promise<ApiAuthResult> {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  let role = (sessionClaims?.public_metadata as { role?: string } | undefined)?.role

  if (!role) {
    const user = await currentUser()
    role = user?.publicMetadata?.role as string | undefined
  }

  if (role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { ok: true, userId }
}

/**
 * Verifica si la petición es una llamada interna autorizada
 * (cron de Vercel o fetch servidor-a-servidor) mediante CRON_SECRET.
 */
export function isInternalRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * Exige admin autenticado O llamada interna con CRON_SECRET.
 * Para endpoints invocados tanto desde el panel admin como por cron/fetch interno.
 */
export async function requireAdminOrInternal(request: Request): Promise<ApiAuthResult> {
  if (isInternalRequest(request)) {
    return { ok: true, userId: 'internal' }
  }
  return requireAdmin()
}

/**
 * Headers para fetches internos servidor-a-servidor hacia rutas protegidas.
 */
export function internalApiHeaders(): Record<string, string> {
  const secret = process.env.CRON_SECRET
  return {
    'Content-Type': 'application/json',
    ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
  }
}

/**
 * Dispara de forma FIABLE un POST interno a otra ruta (p.ej. encadenar batches
 * de scraping).
 *
 * ⚠️ En serverless (Vercel/Lambda) la instancia se congela en cuanto la función
 * devuelve la respuesta; un `fetch(...)` "fire-and-forget" sin await a menudo NO
 * llega a enviarse por la red -> la cadena se detiene EN SILENCIO. Aquí await-eamos
 * con un abort corto: da tiempo a que la petición salga y la invocación hija
 * arranque, pero sin bloquear los minutos que tarde su trabajo (Vercel no mata la
 * función hija por desconexión del cliente, así que sigue por su cuenta).
 *
 * @param url URL absoluta a invocar (POST)
 * @param body Cuerpo JSON opcional
 * @param flushMs Tiempo máximo de espera para asegurar el envío (por defecto 4s)
 */
export async function triggerInternalPost(
  url: string,
  body?: unknown,
  flushMs = 4000
): Promise<void> {
  try {
    await fetch(url, {
      method: 'POST',
      headers: internalApiHeaders(),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(flushMs),
    })
  } catch {
    // AbortError esperado (la hija tarda más que flushMs) o error de red puntual:
    // la petición ya se intentó enviar. El watchdog del cron cubre el caso raro
    // de que la vuelta hija no llegase a arrancar.
  }
}
