/**
 * Sistema de Control de Acceso a Features por Plan
 *
 * Define qué features están disponibles para cada plan de suscripción.
 * Separa la lógica de ROLES (member/admin) de PLANES (basic/premium).
 */

export type SubscriptionPlan = 'basic' | 'premium'

export type MemberFeature =
  | 'dashboard'
  | 'search'
  | 'players'
  | 'wonderkids'
  | 'tournaments'
  | 'scouts'
  | 'comparison'
  | 'scout-comparison'
  | 'on-demand'
  | 'profile'

/**
 * Servicio para gestionar acceso a features según plan de suscripción
 */
export class FeatureAccessService {
  /**
   * Features permitidas por cada plan
   */
  private static readonly PLAN_FEATURES: Record<SubscriptionPlan, MemberFeature[]> = {
    // Plan BASIC: Dashboard, Wonderkids, Torneos y ver detalles de jugadores
    basic: ['dashboard', 'wonderkids', 'tournaments', 'players', 'profile'],

    // Plan PREMIUM: Acceso completo a todas las features
    premium: [
      'dashboard',
      'search',
      'players',
      'wonderkids',
      'tournaments',
      'scouts',
      'comparison',
      'scout-comparison',
      'on-demand',
      'profile'
    ]
  }

  /**
   * Verifica si un plan tiene acceso a una feature específica
   */
  static hasFeatureAccess(
    plan: SubscriptionPlan | string | undefined,
    feature: MemberFeature
  ): boolean {
    if (!plan) return false

    // Normalizar plan
    const normalizedPlan = this.normalizePlan(plan)
    if (!normalizedPlan) return false

    const allowedFeatures = this.PLAN_FEATURES[normalizedPlan]
    return allowedFeatures.includes(feature)
  }

  /**
   * Obtiene lista de features permitidas por plan
   */
  static getAllowedFeatures(plan: SubscriptionPlan | string | undefined): MemberFeature[] {
    if (!plan) return []

    const normalizedPlan = this.normalizePlan(plan)
    if (!normalizedPlan) return []

    return this.PLAN_FEATURES[normalizedPlan]
  }

  /**
   * Mapea rutas a features
   */
  static getFeatureFromPath(pathname: string): MemberFeature | null {
    // Normalizar pathname (remover trailing slash)
    const path = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

    // Mapeo de rutas a features
    if (path === '/member/dashboard' || path.startsWith('/member/dashboard/')) {
      return 'dashboard'
    }
    if (path === '/member/search' || path.startsWith('/member/search/')) {
      return 'search'
    }
    if (path.startsWith('/member/player/')) {
      return 'players'
    }
    if (path === '/member/wonderkids' || path.startsWith('/member/wonderkids/')) {
      return 'wonderkids'
    }
    if (path === '/member/torneos' || path.startsWith('/member/torneos/') ||
        path === '/member/tournaments' || path.startsWith('/member/tournaments/')) {
      return 'tournaments'
    }
    if (path === '/member/scouts' || path.startsWith('/member/scouts/')) {
      return 'scouts'
    }
    if (path.startsWith('/member/scout/')) {
      return 'scouts'
    }
    if (path === '/member/comparison' || path.startsWith('/member/comparison/')) {
      return 'comparison'
    }
    if (path === '/member/scout-comparison' || path.startsWith('/member/scout-comparison/')) {
      return 'scout-comparison'
    }
    if (path === '/member/on-demand' || path.startsWith('/member/on-demand/')) {
      return 'on-demand'
    }
    if (path === '/member/profile' || path.startsWith('/member/profile/')) {
      return 'profile'
    }

    // Rutas que no requieren validación de feature
    return null
  }

  /**
   * Verifica si una ruta está exenta de validación de features
   */
  static isExemptRoute(pathname: string): boolean {
    const exemptRoutes = [
      '/member/welcome',
      '/member/complete-profile',
      '/member/complete-profile-after-payment',
      '/member/payment-processing',
      '/member/upgrade-required'
    ]

    return exemptRoutes.some(route => pathname.startsWith(route))
  }

  /**
   * Normaliza el nombre del plan a tipo estándar
   */
  private static normalizePlan(plan: string): SubscriptionPlan | null {
    const planLower = plan.toLowerCase().trim()

    // Plan básico: solo wonderkids y torneos
    if (planLower.includes('basic') || planLower === 'basica') {
      return 'basic'
    }

    // Plan premium: acceso completo a todas las features
    if (planLower.includes('premium') || planLower === 'pro') {
      return 'premium'
    }

    return null
  }

  /**
   * Obtiene el nombre display del plan
   */
  static getPlanDisplayName(plan: SubscriptionPlan | string | undefined): string {
    if (!plan) return 'Sin plan'

    const normalized = this.normalizePlan(plan)
    if (normalized === 'basic') return 'Plan Básico'
    if (normalized === 'premium') return 'Plan Premium'

    return plan
  }

  /**
   * Verifica si un plan necesita upgrade para acceder a una feature
   */
  static needsUpgrade(
    currentPlan: SubscriptionPlan | string | undefined,
    feature: MemberFeature
  ): boolean {
    // Si ya tiene acceso, no necesita upgrade
    if (this.hasFeatureAccess(currentPlan, feature)) {
      return false
    }

    // Si el plan premium tiene acceso, entonces necesita upgrade
    return this.hasFeatureAccess('premium', feature)
  }
}
