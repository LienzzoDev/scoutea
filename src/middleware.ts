import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
  getUserRoleInfo,
  getDashboardUrl,
  isOnboardingRoute,
  requiresActiveSubscription,
} from '@/lib/auth/role-utils'
import { isDebugApiAllowed, createDebugBlockedResponse } from '@/lib/utils/cleanup-debug-apis'
import { authLogger } from '@/lib/utils/logger'

// Definir rutas con matchers
const isAuthRoute = createRouteMatcher(['/login(.*)', '/register(.*)', '/admin-login(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isMemberRoute = createRouteMatcher(['/member(.*)'])
const isScoutRoute = createRouteMatcher(['/scout(.*)'])
const isWelcomeRoute = createRouteMatcher(['/member/welcome(.*)'])

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

  // Permitir acceso a rutas públicas sin autenticación
  if (isPublicRoute(req)) {
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
    if (!userId || !roleInfo) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Verificar si tiene acceso al área de miembros
    if (!roleInfo.access.memberArea) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Si es scout (pero no tester), redirigir a su dashboard apropiado
    if (roleInfo.role === 'scout' && !req.nextUrl.pathname.startsWith('/member/welcome')) {
      return NextResponse.redirect(new URL('/scout/dashboard', req.url))
    }
    
    // Los testers pueden acceder libremente al área de members

    // Verificar suscripción activa para rutas que la requieren
    if (requiresActiveSubscription(req.nextUrl.pathname) && !roleInfo.hasActiveSubscription) {
      return NextResponse.redirect(new URL('/member/subscription-plans', req.url))
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

    // Verificar suscripción activa
    if (!roleInfo.hasActiveSubscription) {
      return NextResponse.redirect(new URL('/member/subscription-plans', req.url))
    }

    return NextResponse.next()
  }

  // Manejar rutas de autenticación
  if (isAuthRoute(req)) {
    console.log('🔐 Ruta de autenticación detectada:', req.nextUrl.pathname)

    if (!userId) {
      console.log('❌ Usuario no autenticado, permitiendo acceso a página de auth')
      return NextResponse.next()
    }

    console.log('👤 Usuario autenticado:', userId)

    // Si estamos en cualquier ruta de registro, redirigir a complete-profile
    if (req.nextUrl.pathname.startsWith('/register')) {
      console.log('🔄 Usuario autenticado intentando registrarse, redirigiendo a complete-profile')
      const plan = req.nextUrl.searchParams.get('plan')
      const redirectUrl = plan
        ? `/member/complete-profile?plan=${plan}`
        : '/member/complete-profile'
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // Si estamos en complete-profile, permitir acceso
    if (req.nextUrl.pathname.startsWith('/member/complete-profile')) {
      console.log('🔄 Usuario en complete-profile, permitiendo acceso')
      return NextResponse.next()
    }

    console.log('📋 Estado del perfil:', {
      role: roleInfo?.role,
      profileCompleted: roleInfo?.profileCompleted,
      hasActiveSubscription: roleInfo?.hasActiveSubscription,
      metadata: roleInfo?.metadata,
    })

    // Redirigir según el rol del usuario
    if (roleInfo?.role) {
      const dashboardUrl = getDashboardUrl(roleInfo.role)
      console.log(`✅ Usuario ${roleInfo.role}, redirigiendo a ${dashboardUrl}`)
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // Si no tiene rol definido, redirigir a home
    console.log('🔄 Usuario sin rol definido, redirigiendo a home')
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Para cualquier otra ruta, permitir acceso
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
