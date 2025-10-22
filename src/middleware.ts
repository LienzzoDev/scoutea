import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { FeatureAccessService } from '@/lib/auth/feature-access'
import {
  getUserRoleInfo,
  getDashboardUrl,
  isOnboardingRoute,
  requiresActiveSubscription,
  getOnboardingRedirectUrl,
} from '@/lib/auth/role-utils'
import type { UserMetadata } from '@/lib/services/role-service'
import { isDebugApiAllowed, createDebugBlockedResponse } from '@/lib/utils/cleanup-debug-apis'

// Definir rutas con matchers
const isAuthRoute = createRouteMatcher(['/login(.*)', '/register(.*)', '/admin-login(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isMemberRoute = createRouteMatcher(['/member(.*)'])
const isScoutRoute = createRouteMatcher(['/scout(.*)'])

const isPublicRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req) => {
  // Obtener información de autenticación
  const { userId, sessionClaims } = await auth()

  // Si no hay usuario, usar valores por defecto
  let roleInfo = null
  if (userId && sessionClaims) {
    // Crear un objeto user-like para getUserRoleInfo
    const userLike = {
      id: userId,
      publicMetadata: sessionClaims.public_metadata || {},
      emailAddresses: [],
    }
    roleInfo = getUserRoleInfo(userLike as any)
  }

  // Proteger APIs de debug en producción
  if (req.nextUrl.pathname.startsWith('/api/debug/')) {
    if (!isDebugApiAllowed(req.nextUrl.pathname, roleInfo?.role)) {
      return createDebugBlockedResponse()
    }
  }

  // Excluir rutas de API que no requieren autenticación
  if (
    req.nextUrl.pathname.startsWith('/api/webhooks/') ||
    req.nextUrl.pathname.startsWith('/api/torneos/') ||
    req.nextUrl.pathname.startsWith('/api/upload-tournament-pdf') ||
    req.nextUrl.pathname.startsWith('/api/player-list')
  ) {
    return NextResponse.next()
  }

  // Manejar ruta pública (homepage)
  if (isPublicRoute(req)) {
    // Si el usuario está autenticado y tiene un rol, redirigir a su dashboard
    if (userId && roleInfo?.role) {
      const dashboardUrl = getDashboardUrl(roleInfo.role)
      console.log(`🔄 Usuario ${roleInfo.role} autenticado accediendo a homepage, redirigiendo a ${dashboardUrl}`)
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }
    // Si no está autenticado, permitir acceso a homepage
    return NextResponse.next()
  }

  // Permitir acceso a rutas de onboarding sin redirección
  if (isOnboardingRoute(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // Manejar rutas de admin
  if (isAdminRoute(req)) {
    if (!userId || !roleInfo) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (!roleInfo.access.adminArea) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Manejar rutas de member
  if (isMemberRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // ✅ CRÍTICO: Permitir acceso a rutas de onboarding sin restricciones adicionales
    const isOnboarding = isOnboardingRoute(req.nextUrl.pathname)
    if (isOnboarding) {
      console.log('✅ Permitiendo acceso a ruta de onboarding:', req.nextUrl.pathname)
      return NextResponse.next()
    }

    // Verificar si tiene acceso al área de miembros (solo si ya tiene rol y NO está en onboarding)
    if (roleInfo && !roleInfo.access.memberArea) {
      console.log('❌ Usuario sin acceso al área de miembros:', roleInfo.role)
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Si es scout (pero no tester), redirigir a su dashboard apropiado
    if (roleInfo && roleInfo.role === 'scout' && !req.nextUrl.pathname.startsWith('/member/welcome')) {
      return NextResponse.redirect(new URL('/scout/dashboard', req.url))
    }

    // Los testers pueden acceder libremente al área de members

    // Si el usuario intenta acceder a una ruta protegida (no onboarding) sin estar listo,
    // redirigirlo al paso apropiado del onboarding
    if (requiresActiveSubscription(req.nextUrl.pathname)) {
      // Determinar si necesita completar onboarding
      const needsOnboarding = !roleInfo || !roleInfo.hasActiveSubscription

      if (needsOnboarding) {
        const redirectUrl = getOnboardingRedirectUrl(roleInfo)
        console.log('🔄 Usuario necesita onboarding, redirigiendo a:', redirectUrl)
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }
    }

    // ✅ NUEVO: Validar acceso a features según plan (basic vs premium)
    if (!FeatureAccessService.isExemptRoute(req.nextUrl.pathname)) {
      const feature = FeatureAccessService.getFeatureFromPath(req.nextUrl.pathname)
      if (feature) {
        const metadata = sessionClaims?.public_metadata as UserMetadata | undefined
        const plan = metadata?.subscription?.plan

        if (!FeatureAccessService.hasFeatureAccess(plan, feature)) {
          return NextResponse.redirect(new URL('/member/upgrade-required', req.url))
        }
      }
    }

    return NextResponse.next()
  }

  // Manejar rutas de scout
  if (isScoutRoute(req)) {
    if (!userId || !roleInfo) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Verificar si tiene acceso al área de scouts
    if (!roleInfo.access.scoutArea) {
      // Si es member, redirigir a su dashboard
      if (roleInfo.role === 'member') {
        return NextResponse.redirect(new URL('/member/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Los testers pueden acceder libremente al área de scouts

    // Verificar suscripción activa - redirigir al paso apropiado de onboarding
    if (!roleInfo.hasActiveSubscription) {
      const redirectUrl = getOnboardingRedirectUrl(roleInfo)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    return NextResponse.next()
  }

  // Manejar rutas de autenticación (login, register)
  if (isAuthRoute(req)) {
    // Si el usuario NO está autenticado, permitir acceso a login/register
    if (!userId) {
      return NextResponse.next()
    }

    // ✅ Usuario YA autenticado intentando acceder a login/register
    // → Redirigir a su panel correspondiente según su rol

    if (roleInfo?.role) {
      const dashboardUrl = getDashboardUrl(roleInfo.role)
      console.log(`🔄 Usuario ${roleInfo.role} autenticado intentando acceder a ${req.nextUrl.pathname}, redirigiendo a ${dashboardUrl}`)
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // Si no tiene rol definido, redirigir a complete-profile para que complete el onboarding
    console.log('🔄 Usuario autenticado sin rol, redirigiendo a complete-profile')
    const plan = req.nextUrl.searchParams.get('plan')
    const redirectUrl = plan
      ? `/member/complete-profile?plan=${plan}`
      : '/member/complete-profile'
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  }

  // Para cualquier otra ruta, permitir acceso
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
