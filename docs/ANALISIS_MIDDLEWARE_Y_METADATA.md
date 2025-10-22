# Análisis Profundo: Middleware y PublicMetadata

**Fecha:** 21 de Octubre, 2025
**Scope:** Sistema de autenticación, middleware, y gestión de roles con Clerk

---

## Resumen Ejecutivo

El sistema de autenticación y middleware de Scoutea está **bien estructurado** con una arquitectura sólida. Sin embargo, presenta **inconsistencias** en el manejo de metadata, **duplicación de lógica**, y **posibles race conditions** en la sincronización entre Clerk y la base de datos.

### Estado General: ⚠️ BUENO CON MEJORAS NECESARIAS

**Fortalezas:**
- ✅ Servicio centralizado de roles (`RoleService`)
- ✅ Middleware robusto con protección de rutas
- ✅ Sistema de reintentos para webhooks
- ✅ Logging estructurado

**Debilidades:**
- ❌ Duplicación de lógica de roles en 3 archivos
- ❌ Inconsistencias en acceso a metadata
- ❌ Falta de validación de estado de sincronización
- ❌ Console.logs mezclados con logger profesional
- ❌ Posibles race conditions en webhooks

---

## 1. Arquitectura del Sistema de Autenticación

### 1.1 Flujo de Datos

```
┌─────────────┐
│   Clerk     │ ← Usuario se registra/loguea
└──────┬──────┘
       │
       │ Webhook: user.created
       ▼
┌─────────────────────┐
│ /api/webhooks/clerk │ ← Crea usuario en BD + metadata inicial
└──────┬──────────────┘
       │
       ▼
┌─────────────┐      ┌──────────────────┐
│   Prisma    │ ←──→ │  publicMetadata  │
│  Database   │      │  (en Clerk)      │
└─────────────┘      └──────────────────┘
       ▲                      ▲
       │                      │
       │  Sincronización      │
       │  crítica             │
       │                      │
┌──────────────────────────────┐
│  Middleware (protección)     │ ← Verifica rol en cada request
└──────────────────────────────┘
```

### 1.2 Componentes Clave

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| **Middleware** | `src/middleware.ts` | Protección de rutas, redirecciones |
| **RoleService** | `src/lib/services/role-service.ts` | CRUD de roles y metadata |
| **role-utils** | `src/lib/auth/role-utils.ts` | Utilidades compartidas |
| **user-role** | `src/lib/auth/user-role.ts` | Verificación de roles (duplicado) |
| **Webhooks Clerk** | `src/app/api/webhooks/clerk/route.ts` | Sincronización BD ↔ Clerk |
| **Webhooks Stripe** | `src/app/api/webhooks/stripe/route.ts` | Activación de suscripciones |

---

## 2. Análisis de publicMetadata

### 2.1 Estructura de publicMetadata

```typescript
interface UserMetadata {
  role: 'member' | 'scout' | 'admin' | 'tester'
  profileStatus: 'incomplete' | 'complete'
  subscription?: {
    status: 'active' | 'inactive' | 'cancelled' | 'pending'
    plan: string
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    stripeSessionId?: string
    billing?: 'monthly' | 'yearly'
    activatedAt?: string
    cancelledAt?: string
  }
  onboarding?: {
    completed: boolean
    step: string
    completedAt?: string
  }
}
```

### 2.2 Flujos de Actualización de Metadata

#### **Flujo 1: Registro de Usuario**
```
1. Usuario se registra en Clerk
2. Webhook user.created → /api/webhooks/clerk
3. TransactionService.createUserWithRole()
   ├─ Crea usuario en Prisma
   ├─ Determina rol (email-based o plan-based)
   └─ Actualiza publicMetadata en Clerk
4. Metadata inicial:
   {
     role: 'member',
     profileStatus: 'incomplete',
     onboarding: { completed: false, step: 'profile' }
   }
```

#### **Flujo 2: Pago Exitoso**
```
1. Usuario completa pago en Stripe
2. Webhook checkout.session.completed → /api/webhooks/stripe
3. RoleService.assignRoleAfterPayment()
   └─ Actualiza publicMetadata:
      {
        role: 'scout' | 'member' (según plan),
        subscription: {
          status: 'active',
          plan: 'Scout Premium',
          stripeCustomerId: '...',
          stripeSubscriptionId: '...',
          activatedAt: '2025-10-21T...'
        },
        onboarding: { completed: true, completedAt: '...' }
      }
```

#### **Flujo 3: Cancelación**
```
1. Stripe detecta cancelación
2. Webhook customer.subscription.deleted → /api/webhooks/stripe
3. RoleService.cancelUserSubscription()
   └─ Actualiza: subscription.status = 'cancelled'
```

### 2.3 Acceso a publicMetadata en el Código

**En Middleware** (❌ Inconsistente):
```typescript
// middleware.ts línea 31
const userLike = {
  id: userId,
  publicMetadata: sessionClaims.public_metadata || {}, // ⚠️ Usar sessionClaims
  emailAddresses: [],
}
roleInfo = getUserRoleInfo(userLike as any) // ⚠️ Type casting inseguro
```

**En Guards** (✅ Correcto):
```typescript
// admin-guard.tsx
const { user } = useUser()
const userRole = getUserRole(user) // ✅ Usa user.publicMetadata directamente
```

**En Webhooks** (✅ Correcto):
```typescript
// webhooks/clerk/route.ts línea 73
const { public_metadata } = data
if (public_metadata?.role) { // ✅ Acceso directo
  // ...
}
```

---

## 3. Problemas Identificados

### 🔴 CRÍTICO: Duplicación de Lógica de Roles

**Problema:** Existen **3 archivos** con lógica de roles similar pero ligeramente diferente:

1. **`src/lib/auth/user-role.ts`** (51 líneas)
   ```typescript
   export function getUserRole(user: UserResource | null | undefined): Role | null
   export function canAccessMemberArea(user: UserResource | null | undefined): boolean
   export function canAccessScoutArea(user: UserResource | null | undefined): boolean
   ```

2. **`src/lib/auth/role-utils.ts`** (120 líneas)
   ```typescript
   export function getUserRoleInfo(user: User): UserRoleInfo
   export function canAccessMemberArea(role: UserRole): boolean
   export function canAccessScoutArea(role: UserRole): boolean
   ```

3. **`src/lib/services/role-service.ts`** (273 líneas) ← **Este debería ser la fuente única**
   ```typescript
   export class RoleService {
     static getRoleFromPlan(plan: string): UserRole
     static updateUserRole(userId: string, updates: Partial<UserMetadata>)
     static hasAccess(userRole: UserRole, requiredRole: UserRole): boolean
   }
   ```

**Impacto:**
- ⚠️ Cambios deben replicarse en 3 lugares
- ⚠️ Riesgo de inconsistencias
- ⚠️ Código difícil de mantener

**Solución:**
```typescript
// Mantener solo role-service.ts y eliminar duplicados
// Mover utilidades de role-utils.ts a RoleService
// Eliminar user-role.ts completamente
```

---

### 🟡 MEDIO: Inconsistencias en Acceso a Metadata

**Problema 1:** Middleware usa `sessionClaims.public_metadata` con type casting inseguro

```typescript
// middleware.ts línea 31 (❌ ACTUAL)
const userLike = {
  publicMetadata: sessionClaims.public_metadata || {},
}
roleInfo = getUserRoleInfo(userLike as any) // ⚠️ Type casting
```

**Solución:**
```typescript
// middleware.ts (✅ MEJORADO)
import { UserMetadata } from '@/lib/services/role-service'

const metadata = sessionClaims.public_metadata as UserMetadata | undefined
const roleInfo = metadata ? {
  userId,
  role: metadata.role || 'member',
  hasActiveSubscription: metadata.subscription?.status === 'active',
  // ...
} : getDefaultRoleInfo(userId)
```

**Problema 2:** Función `getUserRoleInfo` tiene parámetro ambiguo

```typescript
// role-utils.ts línea 27 (❌ ACTUAL)
export function getUserRoleInfo(user: User): UserRoleInfo {
  const metadata = (user.publicMetadata as UserMetadata) || {}
  // ...
}
```

El tipo `User` de Clerk puede no tener `publicMetadata` en ciertos contextos.

**Solución:**
```typescript
// role-utils.ts (✅ MEJORADO)
export function getUserRoleInfo(
  metadata: UserMetadata | undefined,
  userId: string,
  email?: string
): UserRoleInfo {
  const role = metadata?.role || 'member'
  // ... resto de la lógica
}
```

---

### 🟡 MEDIO: Race Conditions en Webhooks

**Escenario Problemático:**

```
T0: Usuario se registra → Webhook Clerk user.created se dispara
T1: Webhook Clerk crea usuario en BD con rol 'member'
T2: Usuario selecciona plan 'Scout Premium' y paga
T3: Webhook Stripe checkout.session.completed se dispara
T4: Webhook Stripe intenta actualizar rol a 'scout'
T5: ❌ PERO... Webhook Clerk aún no completó (red lenta, retry, etc.)
    → Usuario no existe en BD
    → Stripe webhook falla o crea metadata incorrecta
```

**Solución Actual:**
- ✅ `WebhookRetryService` con 3 reintentos
- ⚠️ PERO no verifica si usuario existe antes de actualizar

**Solución Mejorada:**
```typescript
// webhooks/stripe/route.ts
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id

  // ✅ Esperar a que usuario exista en BD
  const maxWait = 10000 // 10 segundos
  const startTime = Date.now()

  let user = await UserService.getUserByClerkId(userId)
  while (!user && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 500))
    user = await UserService.getUserByClerkId(userId)
  }

  if (!user) {
    throw new Error('User not found after waiting - Clerk webhook may have failed')
  }

  // Ahora sí actualizar rol
  await RoleService.assignRoleAfterPayment(userId, plan, stripeData)
}
```

---

### 🟢 MENOR: Console.logs Mezclados con Logger

**Problema:** Webhooks de Stripe usan `console.log` en lugar de `logger`:

```typescript
// webhooks/stripe/route.ts (❌ ACTUAL)
console.log('🔔 Stripe webhook received')
console.log('Body length:', body.length)
console.log('Has signature:', !!signature)
```

vs

```typescript
// webhooks/clerk/route.ts (✅ CORRECTO)
logger.info('Clerk webhook: user.created event received')
logger.info('Processing new user creation', { userId: id, email })
```

**Impacto:**
- Console.logs no se guardan en producción
- Dificulta debugging de webhooks Stripe
- Inconsistencia en el proyecto

**Solución:**
```typescript
// webhooks/stripe/route.ts (✅ MEJORADO)
logger.info('Stripe webhook received', {
  bodyLength: body.length,
  hasSignature: !!signature
})
```

---

### 🟢 MENOR: Validación de Subscription Status

**Problema:** Middleware verifica subscription pero no valida estado:

```typescript
// middleware.ts línea 94
if (requiresActiveSubscription(req.nextUrl.pathname) && !roleInfo.hasActiveSubscription) {
  return NextResponse.redirect(new URL('/member/subscription-plans', req.url))
}
```

**¿Qué pasa si?**
- Subscription está en estado `'pending'` (pago procesándose)?
- Subscription está `'cancelled'` pero dentro del periodo de gracia?
- Subscription expiró hace 1 día vs hace 30 días?

**Solución:**
```typescript
// role-utils.ts (✅ MEJORADO)
export function hasActiveSubscription(metadata: UserMetadata): boolean {
  const sub = metadata.subscription
  if (!sub) return false

  if (sub.status !== 'active') {
    // Permitir periodo de gracia de 3 días después de cancelación
    if (sub.status === 'cancelled' && sub.cancelledAt) {
      const cancelDate = new Date(sub.cancelledAt)
      const gracePeriodEnd = new Date(cancelDate.getTime() + 3 * 24 * 60 * 60 * 1000)
      return new Date() < gracePeriodEnd
    }
    return false
  }

  return true
}
```

---

## 4. Flujo de Metadata: Estado Actual vs Ideal

### 4.1 Estado Actual

```
┌────────────┐
│  Register  │
└─────┬──────┘
      │
      ▼
┌─────────────────┐
│ Clerk creates   │
│ user (no role)  │
└────────┬────────┘
         │
         ▼ Webhook
┌──────────────────────┐
│ createUserWithRole() │ ← Determina rol por email
│ Sets metadata:       │
│ { role: 'member',    │
│   profileStatus:     │
│   'incomplete' }     │
└──────────┬───────────┘
           │
           ▼
┌────────────────┐
│ User completes │
│ profile form   │
└───────┬────────┘
        │
        ▼
┌────────────────────┐
│ Selects plan &     │
│ pays via Stripe    │
└───────┬────────────┘
        │
        ▼ Webhook
┌──────────────────────┐
│ assignRoleAfterPmt() │ ← Actualiza rol según plan
│ Updates metadata:    │
│ { role: 'scout',     │
│   subscription: {    │
│     status:'active'  │
│   },                 │
│   onboarding: {      │
│     completed: true  │
│   }                  │
│ }                    │
└──────────────────────┘
```

### 4.2 Flujo Ideal (Con Validaciones)

```
┌────────────┐
│  Register  │
└─────┬──────┘
      │
      ▼
┌──────────────────────┐
│ Clerk creates user   │
│ + Initial metadata:  │
│ { role: 'member',    │
│   profileStatus:     │
│   'incomplete',      │
│   onboarding: {      │
│     step: 'profile'  │
│   }                  │
│ }                    │
└────────┬─────────────┘
         │
         ▼ Webhook + Retry
┌──────────────────────┐
│ ✅ Verify metadata   │
│ ✅ Create in DB      │
│ ✅ Log event         │
└──────────┬───────────┘
           │
           ▼
┌────────────────────────┐
│ User completes profile │
│ ✅ Validation          │
│ ✅ Update DB           │
│ ✅ Update metadata:    │
│    profileStatus =     │
│    'complete'          │
└───────┬────────────────┘
        │
        ▼
┌──────────────────┐
│ Stripe payment   │
└───────┬──────────┘
        │
        ▼ Webhook
┌──────────────────────────┐
│ ✅ Wait for user in DB   │
│ ✅ Verify payment status │
│ ✅ Atomic update:        │
│    - Role (plan-based)   │
│    - Subscription active │
│    - Onboarding complete │
│ ✅ Rollback on failure   │
└──────────────────────────┘
```

---

## 5. Mejores Prácticas y Recomendaciones

### 5.1 Principios de Diseño

✅ **Single Source of Truth**
- `RoleService` debe ser la ÚNICA fuente para lógica de roles
- Eliminar `user-role.ts` y mover utilidades a `RoleService`

✅ **Atomic Updates**
- Toda actualización de metadata debe ser atómica
- Usar transacciones cuando se actualiza BD + Clerk

✅ **Idempotencia**
- Webhooks deben ser idempotentes
- Verificar estado antes de actualizar

✅ **Logging Estructurado**
- Usar `logger` en TODOS los archivos
- Incluir context en cada log (userId, eventId, etc.)

✅ **Validación Estricta**
- Validar metadata antes de confiar en ella
- Manejar casos donde metadata está incompleta

---

### 5.2 Refactorización Recomendada

#### **Paso 1: Consolidar Lógica de Roles**

```typescript
// src/lib/services/role-service.ts (✅ MEJORADO)
export class RoleService {
  // ... métodos existentes ...

  /**
   * Obtiene información completa del rol desde metadata
   */
  static getRoleInfo(metadata: UserMetadata | undefined, userId: string): UserRoleInfo {
    const role = metadata?.role || 'member'
    const profileCompleted = metadata?.profileStatus === 'complete'
    const hasActiveSubscription = this.hasActiveSubscription(metadata)

    return {
      userId,
      role,
      profileCompleted,
      hasActiveSubscription,
      metadata: metadata || this.createInitialMetadata(),
      access: {
        memberArea: this.canAccessMemberArea(role),
        scoutArea: this.canAccessScoutArea(role),
        adminArea: role === 'admin'
      }
    }
  }

  /**
   * Verifica subscription con periodo de gracia
   */
  static hasActiveSubscription(metadata: UserMetadata | undefined): boolean {
    const sub = metadata?.subscription
    if (!sub) return false

    if (sub.status === 'active') return true

    // Periodo de gracia de 3 días
    if (sub.status === 'cancelled' && sub.cancelledAt) {
      const cancelDate = new Date(sub.cancelledAt)
      const gracePeriodEnd = new Date(cancelDate.getTime() + 3 * 24 * 60 * 60 * 1000)
      return new Date() < gracePeriodEnd
    }

    return false
  }

  /**
   * Verifica acceso a área de members
   */
  static canAccessMemberArea(role: UserRole): boolean {
    return ['member', 'scout', 'tester', 'admin'].includes(role)
  }

  /**
   * Verifica acceso a área de scouts
   */
  static canAccessScoutArea(role: UserRole): boolean {
    return ['scout', 'tester', 'admin'].includes(role)
  }
}
```

#### **Paso 2: Actualizar Middleware**

```typescript
// src/middleware.ts (✅ MEJORADO)
import { RoleService, UserMetadata } from '@/lib/services/role-service'

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  let roleInfo = null
  if (userId && sessionClaims) {
    const metadata = sessionClaims.public_metadata as UserMetadata | undefined
    roleInfo = RoleService.getRoleInfo(metadata, userId)
  }

  // ... resto del middleware sin cambios
})
```

#### **Paso 3: Mejorar Webhooks de Stripe**

```typescript
// src/app/api/webhooks/stripe/route.ts (✅ MEJORADO)
import { logger } from '@/lib/logging/production-logger'

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id
  const plan = session.metadata?.plan

  logger.info('Processing checkout completion', {
    sessionId: session.id,
    userId,
    plan,
    paymentStatus: session.payment_status
  })

  // ✅ Validaciones
  if (!userId) {
    logger.error('No userId in checkout session', { sessionId: session.id })
    throw new Error('Missing userId')
  }

  if (session.payment_status !== 'paid') {
    logger.warn('Payment not completed', {
      sessionId: session.id,
      status: session.payment_status
    })
    return { success: false, reason: 'Payment not completed' }
  }

  // ✅ Esperar a que usuario exista en BD (race condition fix)
  const user = await waitForUser(userId, 10000)
  if (!user) {
    logger.error('User not found after waiting', { userId, sessionId: session.id })
    throw new Error('User not synced from Clerk webhook')
  }

  // ✅ Actualización atómica
  try {
    const result = await RoleService.assignRoleAfterPayment(userId, plan, {
      customerId: session.customer as string,
      subscriptionId: session.subscription as string,
      sessionId: session.id,
      billing: session.metadata?.billing as 'monthly' | 'yearly'
    })

    logger.info('Role assigned after payment', {
      userId,
      previousRole: result.previousRole,
      newRole: result.newRole,
      success: result.success
    })

    return { success: true, result }

  } catch (error) {
    logger.error('Failed to assign role after payment', error as Error, {
      userId,
      sessionId: session.id
    })
    throw error
  }
}

/**
 * Espera a que el usuario exista en BD (fix para race conditions)
 */
async function waitForUser(userId: string, maxWaitMs: number) {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const user = await UserService.getUserByClerkId(userId)
    if (user) return user

    logger.debug('Waiting for user to sync from Clerk', {
      userId,
      waited: Date.now() - startTime
    })

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return null
}
```

#### **Paso 4: Eliminar Archivos Duplicados**

```bash
# ❌ Eliminar completamente (lógica movida a RoleService)
rm src/lib/auth/user-role.ts

# ✅ Actualizar imports en componentes
# Cambiar:
import { getUserRole } from '@/lib/auth/user-role'
# Por:
import { RoleService } from '@/lib/services/role-service'
const role = metadata?.role || 'member'
```

---

## 6. Plan de Implementación

### Fase 1: Preparación (1-2 horas)
- [ ] Crear tipos TypeScript faltantes
- [ ] Documentar flujos actuales
- [ ] Crear tests para casos edge

### Fase 2: Refactorización (3-4 horas)
- [ ] Consolidar lógica en `RoleService`
- [ ] Actualizar middleware
- [ ] Mejorar webhooks Stripe
- [ ] Eliminar archivos duplicados

### Fase 3: Testing (2-3 horas)
- [ ] Test: Registro + pago inmediato
- [ ] Test: Registro + pago después de 5 min
- [ ] Test: Cancelación de subscription
- [ ] Test: Periodo de gracia
- [ ] Test: Race conditions

### Fase 4: Deploy (1 hora)
- [ ] Deploy en staging
- [ ] Verificar webhooks en Stripe Dashboard
- [ ] Monitorear logs
- [ ] Deploy en producción

**Tiempo total estimado: 7-10 horas**

---

## 7. Checklist de Validación

Después de implementar mejoras, verificar:

- [ ] ✅ Un solo archivo maneja lógica de roles (`RoleService`)
- [ ] ✅ Middleware usa tipos estrictos (no `as any`)
- [ ] ✅ Todos los webhooks usan `logger` en lugar de `console.log`
- [ ] ✅ Race conditions manejadas en webhooks Stripe
- [ ] ✅ Subscription status valida periodo de gracia
- [ ] ✅ Metadata tiene valores por defecto seguros
- [ ] ✅ Actualizaciones de metadata son atómicas
- [ ] ✅ Tests cubren casos edge (pago rápido, webhooks fuera de orden)

---

## 8. Conclusiones

### Estado Actual: 7/10

**Pros:**
- Arquitectura bien pensada
- Servicios bien organizados
- Sistema de reintentos implementado

**Cons:**
- Duplicación de código
- Inconsistencias menores
- Falta manejo de race conditions

### Estado Post-Mejoras: 9/10

Con las mejoras propuestas:
- ✅ Código DRY (no repetido)
- ✅ Type-safe en todos lados
- ✅ Race conditions manejadas
- ✅ Logging profesional consistente
- ✅ Validaciones robustas

---

## Apéndice: Archivos a Modificar

| Archivo | Acción | Prioridad |
|---------|--------|-----------|
| `src/lib/services/role-service.ts` | ✏️ Expandir con métodos consolidados | 🔴 Alta |
| `src/middleware.ts` | ✏️ Usar RoleService directamente | 🔴 Alta |
| `src/app/api/webhooks/stripe/route.ts` | ✏️ Migrar a logger + fix race conditions | 🔴 Alta |
| `src/lib/auth/user-role.ts` | ❌ Eliminar (duplicado) | 🟡 Media |
| `src/lib/auth/role-utils.ts` | ❌ Eliminar (mover a RoleService) | 🟡 Media |
| `src/components/auth/admin-guard.tsx` | ✏️ Actualizar imports | 🟢 Baja |
| `src/components/auth/subscription-guard.tsx` | ✏️ Actualizar lógica subscription | 🟢 Baja |

---

**Documento generado por:** Claude Code
**Última actualización:** 21 de Octubre, 2025
