# Patrones de Estructura de Páginas

Este documento establece los patrones estándar para la organización de páginas en la aplicación Scoutea.

## Estructura Estándar de Páginas

Cada página debe seguir esta estructura consistente:

```
src/app/[ruta]/
├── page.tsx      # Componente principal de la página
├── loading.tsx   # Estado de carga
├── error.tsx     # Manejo de errores (opcional, para páginas críticas)
└── layout.tsx    # Layout específico (opcional)
```

## Patrones de Implementación

### 1. Página Básica (page.tsx)

```typescript
// src/app/ejemplo/page.tsx
import { MemberPageLayout } from '@/components/layout/member-page-layout'

export default function EjemploPage() {
  return (
    <MemberPageLayout 
      title="Título de la Página"
      description="Descripción opcional de la página"
    >
      {/* Contenido de la página */}
    </MemberPageLayout>
  )
}
```

### 2. Estado de Carga (loading.tsx)

```typescript
// src/app/ejemplo/loading.tsx
import { LoadingPage } from '@/components/ui/loading-spinner'

export default function EjemploLoading() {
  return <LoadingPage />
}
```

### 3. Manejo de Errores (error.tsx)

```typescript
// src/app/ejemplo/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EjemploError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Ejemplo error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">
            Error en la Página
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
          </p>
          <div className="flex justify-center">
            <Button onClick={reset}>
              Intentar de nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Componentes de Layout Disponibles

### 1. MemberPageLayout
Para páginas del área de miembros que necesitan la navbar.

```typescript
import { MemberPageLayout } from '@/components/layout/member-page-layout'

<MemberPageLayout 
  title="Título"
  description="Descripción"
  showNavbar={true} // opcional, por defecto true
>
  {children}
</MemberPageLayout>
```

### 2. AdminPageLayout
Para páginas del área de administración.

```typescript
import { AdminPageLayout } from '@/components/layout/admin-page-layout'

<AdminPageLayout 
  title="Título"
  description="Descripción"
  actions={<Button>Acción</Button>} // opcional
>
  {children}
</AdminPageLayout>
```

### 3. PageContainer
Contenedor básico para páginas que no necesitan layouts específicos.

```typescript
import { PageContainer } from '@/components/layout/page-container'

<PageContainer 
  title="Título"
  description="Descripción"
  className="custom-class" // opcional
>
  {children}
</PageContainer>
```

## Convenciones de Naming

### Archivos de Página
- `page.tsx` - Componente principal
- `loading.tsx` - Estado de carga
- `error.tsx` - Manejo de errores
- `layout.tsx` - Layout específico
- `not-found.tsx` - Página 404 específica

### Nombres de Componentes
- Usar PascalCase para nombres de componentes
- Incluir el tipo de página en el nombre: `DashboardPage`, `PlayerProfilePage`
- Para loading: `[Nombre]Loading`
- Para error: `[Nombre]Error`

### Nombres de Funciones
- Usar camelCase para funciones internas
- Nombres descriptivos que indiquen la acción: `handlePlayerSearch`, `loadPlayerData`

## Manejo de Estado

### Hooks Personalizados
Extraer lógica compleja a hooks personalizados organizados por dominio:

```typescript
// src/hooks/player/usePlayerProfile.ts
export function usePlayerProfile(playerId: string) {
  // Lógica del hook
  return { player, loading, error, refetch }
}

// En la página
import { usePlayerProfile } from '@/hooks/player/usePlayerProfile'

export default function PlayerProfilePage() {
  const { player, loading, error } = usePlayerProfile(playerId)
  
  if (loading) return <LoadingPage />
  if (error) throw error // Será capturado por error.tsx
  
  return (
    <MemberPageLayout title={player.name}>
      {/* Contenido */}
    </MemberPageLayout>
  )
}
```

### Gestión de Errores
- Usar error boundaries (error.tsx) para errores de React
- Usar try/catch para errores de API en hooks
- Mostrar mensajes de error amigables al usuario
- Registrar errores para debugging

## Mejores Prácticas

1. **Separación de Responsabilidades**
   - Páginas solo para estructura y layout
   - Hooks para lógica de estado
   - Componentes para UI reutilizable

2. **Performance**
   - Usar React.memo para componentes que no cambian frecuentemente
   - Implementar lazy loading para componentes pesados
   - Usar Suspense boundaries apropiadamente

3. **Accesibilidad**
   - Incluir títulos semánticos (h1, h2, etc.)
   - Usar ARIA labels cuando sea necesario
   - Asegurar navegación por teclado

4. **SEO**
   - Usar metadata apropiada en layout.tsx
   - Incluir títulos descriptivos
   - Usar structured data cuando sea relevante

## Migración de Páginas Existentes

Para migrar páginas existentes a estos patrones:

1. Identificar la lógica que debe ir en hooks
2. Extraer componentes reutilizables
3. Aplicar el layout apropiado
4. Añadir loading.tsx y error.tsx si no existen
5. Actualizar imports según la nueva estructura

## Ejemplos de Implementación

Ver las siguientes páginas como referencia:
- `src/app/member/dashboard/` - Ejemplo completo con todos los archivos
- `src/app/admin/dashboard/` - Ejemplo de página de admin
- `src/app/member/player/[id]/` - Ejemplo de página dinámica