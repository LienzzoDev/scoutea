# Sistema de Roles Refactorizado

## Resumen de Cambios

Este documento describe la refactorización completa del sistema de roles y metadata de usuarios, consolidando la lógica dispersa en servicios centralizados y eliminando redundancias.

## Nuevos Servicios

### 1. RoleService (`src/lib/services/role-service.ts`)

**Responsabilidades:**
- Determinación de roles basada en planes
- Actualización atómica de metadata
- Validación de accesos por rol
- Gestión de estados de usuario

**Métodos principales:**
```typescript
// Determinar rol desde plan
RoleService.getRoleFromPlan(plan: string): UserRole

// Actualizar rol y metadata
RoleService.updateUserRole(userId: string, updates: Partial<UserMetadata>): Promise<RoleAssignmentResult>

// Asignar rol después de pago
RoleService.assignRoleAfterPayment(userId: string, plan: string, stripeData: object): Promise<RoleAssignmentResult>

// Completar perfil
RoleService.completeUserProfile(userId: string): Promise<RoleAssignmentResult>
```

### 2. TransactionService (`src/lib/services/transaction-service.ts`)

**Responsabilidades:**
- Operaciones atómicas entre Clerk y base de datos
- Manejo de rollbacks en caso de error
- Transacciones complejas de usuario

**Métodos principales:**
```typescript
// Crear usuario con rol (atómico)
TransactionService.createUserWithRole(userData: UserCreationData): Promise<TransactionResult>

// Procesar pago completado
TransactionService.processPaymentCompletion(userId: string, plan: string, stripeData: object): Promise<TransactionResult>

// Completar perfil (atómico)
TransactionService.completeUserProfile(userId: string, profileData: object): Promise<TransactionResult>
```

## Estructura de Metadata Simplificada

### Antes:
```typescript
{
  role?: string
  profile?: string
  subscription?: { status?: string }
  onboardingCompleted?: boolean
  onboardingStep?: string
  // ... otros campos dispersos
}
```

### Después:
```typescript
interface UserMetadata {
  role: 'member' | 'scout' | 'admin'
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

## APIs Consolidadas

### Nueva API Unificada: `/api/user/manage`

Reemplaza las siguientes APIs redundantes:
- ❌ `/api/assign-role-after-payment` (eliminada)
- ❌ `/api/update-user-metadata` (eliminada)
- ✅ `/api/user/update-profile` (refactorizada)

**Acciones soportadas:**
```typescript
// Actualizar metadata
POST /api/user/manage
{
  "action": "update_metadata",
  "metadata": { ... }
}

// Asignar rol después de pago
POST /api/user/manage
{
  "action": "assign_role_after_payment",
  "sessionId": "cs_...",
  "plan": "scout",
  "billing": "monthly"
}

// Completar perfil
POST /api/user/manage
{
  "action": "complete_profile",
  "firstName": "Juan",
  "lastName": "Pérez",
  // ... otros campos
}
```

## Webhooks Refactorizados

### Webhook de Clerk (`/api/webhooks/clerk`)
- ✅ Usa `TransactionService.createUserWithRole()`
- ✅ Operaciones atómicas con rollback
- ✅ Logging estructurado
- ✅ Manejo de errores mejorado

### Webhook de Stripe (`/api/webhooks/stripe`)
- ✅ Usa `TransactionService.processPaymentCompletion()`
- ✅ Usa `RoleService` para actualizaciones de suscripción
- ✅ Logging estructurado
- ✅ Manejo de errores consistente

## Middleware Actualizado

### Cambios en el Middleware:
- ✅ Usa la nueva interfaz `UserMetadata`
- ✅ Protección de APIs de debug en producción
- ✅ Limpieza de variables no utilizadas
- ✅ Mejor tipado de metadata

### Protección de APIs de Debug:
```typescript
// En producción, estas APIs están bloqueadas:
const DEBUG_APIS_TO_REMOVE = [
  '/api/debug/force-assign-role',
  '/api/debug/simulate-payment-webhook', 
  '/api/debug/assign-member-role',
  // ... más APIs
]
```

## Beneficios de la Refactorización

### 1. **Consistencia**
- ✅ Lógica de roles centralizada
- ✅ Estructura de metadata unificada
- ✅ Manejo de errores consistente

### 2. **Mantenibilidad**
- ✅ Eliminación de código duplicado
- ✅ Servicios con responsabilidades claras
- ✅ Mejor organización del código

### 3. **Confiabilidad**
- ✅ Operaciones atómicas con rollback
- ✅ Validación centralizada
- ✅ Logging estructurado

### 4. **Seguridad**
- ✅ APIs de debug protegidas en producción
- ✅ Validación de entrada mejorada
- ✅ Manejo seguro de transacciones

## Migración

### Para Desarrolladores:

1. **Actualizar imports:**
```typescript
// Antes
import { updateUserMetadata } from '@/lib/user-utils'

// Después  
import { RoleService } from '@/lib/services/role-service'
```

2. **Usar nueva API unificada:**
```typescript
// Antes
await fetch('/api/assign-role-after-payment', { ... })

// Después
await fetch('/api/user/manage', {
  method: 'POST',
  body: JSON.stringify({
    action: 'assign_role_after_payment',
    sessionId: '...',
    plan: '...'
  })
})
```

3. **Actualizar tipos de metadata:**
```typescript
// Antes
const role = user.publicMetadata?.role
const profileComplete = user.publicMetadata?.profile === 'completed'

// Después
const metadata = user.publicMetadata as UserMetadata
const role = metadata?.role
const profileComplete = metadata?.profileStatus === 'complete'
```

## Testing

### Servicios a Testear:
- [ ] `RoleService.getRoleFromPlan()`
- [ ] `RoleService.updateUserRole()`
- [ ] `TransactionService.createUserWithRole()`
- [ ] `TransactionService.processPaymentCompletion()`
- [ ] API unificada `/api/user/manage`
- [ ] Webhooks refactorizados
- [ ] Middleware con nueva estructura

### Casos de Prueba Críticos:
- [ ] Rollback en caso de error en transacciones
- [ ] Asignación correcta de roles por plan
- [ ] Protección de APIs de debug en producción
- [ ] Migración de metadata existente

## Próximos Pasos

1. **Implementar tests unitarios** para los nuevos servicios
2. **Migrar datos existentes** a la nueva estructura de metadata
3. **Monitorear logs** para detectar problemas en producción
4. **Documentar APIs** para el equipo frontend
5. **Optimizar performance** de las operaciones de metadata

---

**Fecha de refactorización:** Diciembre 2024  
**Versión:** 2.0.0  
**Estado:** ✅ Completado