/**
 * Sistema de Control de Acceso a Features por Plan
 *
 * Modelo simplificado: un único plan "member" con acceso a todas las features.
 * Cualquier suscripción activa concede acceso completo.
 */

export type SubscriptionPlan = 'member'

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

const ALL_FEATURES: MemberFeature[] = [
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

export class FeatureAccessService {
  /**
   * Todo usuario con suscripción activa tiene acceso a todas las features.
   */
  static hasFeatureAccess(
    plan: SubscriptionPlan | string | undefined,
    _feature: MemberFeature
  ): boolean {
    return !!plan && this.normalizePlan(plan) !== null
  }

  static getAllowedFeatures(plan: SubscriptionPlan | string | undefined): MemberFeature[] {
    if (!plan || this.normalizePlan(plan) === null) return []
    return ALL_FEATURES
  }

  /**
   * Mapea rutas a features
   */
  static getFeatureFromPath(pathname: string): MemberFeature | null {
    const path = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

    if (path === '/member/dashboard' || path.startsWith('/member/dashboard/')) return 'dashboard'
    if (path === '/member/search' || path.startsWith('/member/search/')) return 'search'
    if (path.startsWith('/member/player/')) return 'players'
    if (path === '/member/wonderkids' || path.startsWith('/member/wonderkids/')) return 'wonderkids'
    if (
      path === '/member/torneos' || path.startsWith('/member/torneos/') ||
      path === '/member/tournaments' || path.startsWith('/member/tournaments/')
    ) return 'tournaments'
    if (path === '/member/scouts' || path.startsWith('/member/scouts/')) return 'scouts'
    if (path.startsWith('/member/scout/')) return 'scouts'
    if (path === '/member/comparison' || path.startsWith('/member/comparison/')) return 'comparison'
    if (path === '/member/scout-comparison' || path.startsWith('/member/scout-comparison/')) return 'scout-comparison'
    if (path === '/member/on-demand' || path.startsWith('/member/on-demand/')) return 'on-demand'
    if (path === '/member/profile' || path.startsWith('/member/profile/')) return 'profile'

    return null
  }

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
   * Compatibilidad hacia atrás con planes antiguos (basic/premium/pro/scout/member).
   * Todos se consideran el plan único "member".
   */
  private static normalizePlan(plan: string): SubscriptionPlan | null {
    const planLower = plan.toLowerCase().trim()
    const knownPlans = ['member', 'basic', 'basica', 'premium', 'pro', 'scout']
    if (knownPlans.some(p => planLower === p || planLower.includes(p))) {
      return 'member'
    }
    return null
  }

  static getPlanDisplayName(_plan: SubscriptionPlan | string | undefined): string {
    return 'Member'
  }

  /**
   * Con un único plan ya no existe concepto de upgrade por feature.
   */
  static needsUpgrade(
    _currentPlan: SubscriptionPlan | string | undefined,
    _feature: MemberFeature
  ): boolean {
    return false
  }
}
