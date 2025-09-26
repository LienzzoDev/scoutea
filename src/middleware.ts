import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Definir rutas con matchers
const isAuthRoute = createRouteMatcher(['/login(.*)', '/register(.*)', '/admin-login(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isMemberRoute = createRouteMatcher(['/member(.*)'])
const isScoutRoute = createRouteMatcher(['/scout(.*)'])
const isWelcomeRoute = createRouteMatcher(['/member/welcome(.*)'])
const _isWelcomePlanRoute = createRouteMatcher(['/member/welcome-plan(.*)'])
const isDashboardRoute = createRouteMatcher(['/member/dashboard(.*)', '/scout/dashboard(.*)'])
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
      req.nextUrl.pathname.startsWith('/api/player-list') ||
      req.nextUrl.pathname.startsWith('/api/debug/')) {
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

  // Manejar rutas de admin
  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Manejar rutas de member
  if (isMemberRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // Admin puede acceder a todas las áreas
    if (userRole === 'admin') {
      return NextResponse.next()
    }
    if (userRole === 'scout') {
      return NextResponse.redirect(new URL('/scout/dashboard', req.url))
    }
    if (userRole !== 'member') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Manejar rutas de scout
  if (isScoutRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // Admin puede acceder a todas las áreas
    if (userRole === 'admin') {
      return NextResponse.next()
    }
    if (userRole === 'member') {
      return NextResponse.redirect(new URL('/member/dashboard', req.url))
    }
    if (userRole !== 'scout') {
      return NextResponse.redirect(new URL('/', req.url))
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
    
    // Si estamos en cualquier ruta de registro, no redirigir (dejar que el componente maneje el flujo)
    if (req.nextUrl.pathname.startsWith('/register')) {
      console.log('🔄 Usuario en página de registro, permitiendo flujo interno')
      return NextResponse.next()
    }
    
    console.log('📋 Estado del perfil:', { userRole, profileCompleted, hasSubscription, metadata: sessionClaims?.public_metadata })
    
    // Redirigir según el rol del usuario
    if (userRole === 'admin') {
      console.log('✅ Usuario admin, redirigiendo a dashboard de admin')
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
    
    if (userRole === 'member') {
      console.log('✅ Usuario member, redirigiendo a dashboard de member')
      return NextResponse.redirect(new URL('/member/dashboard', req.url))
    }
    
    if (userRole === 'scout') {
      console.log('✅ Usuario scout, redirigiendo a dashboard de scout')
      return NextResponse.redirect(new URL('/scout/dashboard', req.url))
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