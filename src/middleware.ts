

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Definir rutas con matchers
const isAuthRoute = createRouteMatcher(['/login(.*)', '/register(.*)', '/admin-login(.*)'])
const _isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isWelcomeRoute = createRouteMatcher(['/member/welcome(.*)'])
const _isWelcomePlanRoute = createRouteMatcher(['/member/welcome-plan(.*)'])
const _isSubscriptionRoute = createRouteMatcher(['/member/subscription-plans(.*)'])
const isDashboardRoute = createRouteMatcher(['/member/dashboard(.*)'])
const _isCompleteProfileRoute = createRouteMatcher(['/member/complete-profile-after-payment(.*)'])
const isPublicRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req) => {
  // Obtener información de autenticación
  const { userId, sessionClaims } = await auth()
  const publicMetadata = sessionClaims?.public_metadata as { 
    role?: string
    profile?: string
    subscriptionStatus?: string
  } | undefined
  const userRole = publicMetadata?.role
  const profileCompleted = publicMetadata?.profile === 'completed'
  const hasSubscription = publicMetadata?.subscriptionStatus === 'active'
  const isFromSuccessfulPayment = req.nextUrl.searchParams.get('payment') === 'success'
  
  // Excluir rutas de API que no requieren autenticación
  if (req.nextUrl.pathname.startsWith('/api/webhooks/') || 
      req.nextUrl.pathname.startsWith('/api/torneos/') ||
      req.nextUrl.pathname.startsWith('/api/upload-tournament-pdf') ||
      req.nextUrl.pathname.startsWith('/api/player-list')) {
    return NextResponse.next()
  }
  
  // Permitir acceso a rutas públicas sin autenticación
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Permitir acceso a la página de bienvenida sin redirección
  if (isWelcomeRoute(req)) {
    return NextResponse.next()
  }

  // Manejar ruta del dashboard
  if (isDashboardRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Si es admin, permitir acceso sin verificar suscripción
    if (userRole === 'admin') {
      return NextResponse.next()
    }
    
    // Para usuarios member, aplicar lógica de verificación de suscripción
    if (!profileCompleted && !hasSubscription) {
      console.log('🔄 Perfil incompleto y sin suscripción, redirigiendo a planes de suscripción')
      return NextResponse.redirect(new URL('/member/subscription-plans', req.url))
    }
    
    if (!profileCompleted && hasSubscription) {
      console.log('🔄 Perfil incompleto pero con suscripción activa, redirigiendo a completar perfil')
      return NextResponse.redirect(new URL('/member/complete-profile-after-payment', req.url))
    }
    
    console.log('✅ Perfil completo, permitiendo acceso al dashboard')
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
    
    // Si estamos en la página de registro, no redirigir (dejar que el componente maneje el flujo)
    if (req.nextUrl.pathname === '/register') {
      console.log('🔄 Usuario en página de registro, permitiendo flujo interno')
      return NextResponse.next()
    }
    
    console.log('📋 Estado del perfil:', { userRole, profileCompleted, hasSubscription, metadata: sessionClaims?.public_metadata })
    
    // Si es admin, redirigir al dashboard de admin
    if (userRole === 'admin') {
      console.log('✅ Usuario admin, redirigiendo a dashboard de admin')
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
    
    // Para usuarios member, aplicar lógica de redirección basada en estado del perfil y suscripción
    if (profileCompleted && hasSubscription) {
      console.log('✅ Perfil completo con suscripción, redirigiendo a dashboard')
      return NextResponse.redirect(new URL('/member/dashboard', req.url))
    } else if (profileCompleted && !hasSubscription) {
      console.log('✅ Perfil completo sin suscripción, redirigiendo a planes de suscripción')
      return NextResponse.redirect(new URL('/member/subscription-plans', req.url))
    } else if (!profileCompleted && hasSubscription) {
      console.log('💳 Usuario con suscripción activa pero perfil incompleto, redirigiendo a completar perfil')
      return NextResponse.redirect(new URL('/member/complete-profile-after-payment', req.url))
    } else if (!profileCompleted && isFromSuccessfulPayment) {
      console.log('💳 Usuario viene de pago exitoso con perfil incompleto, redirigiendo a completar perfil')
      return NextResponse.redirect(new URL('/member/complete-profile-after-payment', req.url))
    } else {
      console.log('🔄 Perfil incompleto y sin suscripción, redirigiendo a planes de suscripción')
      return NextResponse.redirect(new URL('/member/subscription-plans', req.url))
    }
  }

  // Para cualquier otra ruta, permitir acceso
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}