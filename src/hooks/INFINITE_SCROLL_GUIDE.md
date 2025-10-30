# Guía de Infinite Scroll Unificado

## Descripción

Se ha creado un hook genérico `useInfiniteScroll` que centraliza toda la lógica de infinite scroll en la aplicación. Este hook elimina la duplicación de código y proporciona una interfaz consistente para todas las tablas con scroll infinito.

## Hook Genérico: `useInfiniteScroll`

Ubicación: [`src/hooks/useInfiniteScroll.ts`](./useInfiniteScroll.ts)

### Características

- ✅ **Cursor-based pagination** - Performance óptima para grandes datasets
- ✅ **Deduplicación automática** - Evita duplicados por ID único
- ✅ **Throttling configurable** - Previene cargas excesivas (default: 500ms)
- ✅ **Intersection Observer** - Detección automática de scroll
- ✅ **Reset automático** - Se resetea al cambiar filtros
- ✅ **Manejo de errores robusto** - Captura y propaga errores
- ✅ **TypeScript genérico** - Totalmente tipado
- ✅ **Soporte múltiples formatos** - Adapta respuestas de API automáticamente

### Uso Básico

```typescript
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface MyItem {
  id: string
  name: string
}

function MyComponent() {
  const {
    items,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh,
    loadMore
  } = useInfiniteScroll<MyItem>({
    apiEndpoint: '/api/my-items',
    getItemId: (item) => item.id,
    filters: {
      search: searchTerm,
      category: selectedCategory
    },
    limit: 50,
    rootMargin: '200px'
  })

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}

      {/* Elemento observador para infinite scroll */}
      <div ref={observerTarget} />

      {loading && <div>Cargando...</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  )
}
```

### Parámetros

#### `UseInfiniteScrollConfig<T, F>`

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| `apiEndpoint` | `string` | URL del endpoint de la API | ✅ |
| `getItemId` | `(item: T) => string` | Función para extraer el ID único de cada item | ✅ |
| `filters` | `F` | Objeto con filtros dinámicos | ❌ |
| `limit` | `number` | Items por página (default: 50) | ❌ |
| `rootMargin` | `string` | Margen del Intersection Observer (default: '200px') | ❌ |
| `throttleMs` | `number` | Tiempo de throttle entre cargas (default: 500) | ❌ |

### Retorno

#### `UseInfiniteScrollReturn<T>`

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `items` | `T[]` | Array de items cargados |
| `loading` | `boolean` | Estado de carga |
| `error` | `Error \| null` | Error si ocurrió alguno |
| `hasMore` | `boolean` | Si hay más items disponibles |
| `totalCount` | `number \| null` | Total de items disponibles |
| `observerTarget` | `(node: HTMLDivElement \| null) => void` | Ref para el elemento observador |
| `refresh` | `() => void` | Función para refrescar desde el inicio |
| `loadMore` | `() => void` | Función para cargar más items manualmente |

### Formato de Respuesta de API

El hook soporta múltiples formatos de respuesta:

```typescript
// Formato 1: Array en propiedad específica (players, teams, etc.)
{
  "players": [...],
  "hasMore": true,
  "nextCursor": "abc123",
  "totalCount": 1000
}

// Formato 2: Array en propiedad genérica "data"
{
  "data": [...],
  "hasMore": true,
  "nextCursor": "abc123",
  "total": 1000
}

// Formato 3: Array en propiedad "items"
{
  "items": [...],
  "hasMore": true,
  "nextCursor": "abc123"
}
```

El hook automáticamente detecta el primer array en la respuesta.

## Hooks Específicos Refactorizados

Todos los hooks específicos ahora utilizan `useInfiniteScroll` internamente y mantienen su API original para compatibilidad.

### 1. `useInfinitePlayersScroll`

**Ubicación:** [`src/hooks/admin/useInfinitePlayersScroll.ts`](./admin/useInfinitePlayersScroll.ts)

**Uso:**
```typescript
import { useInfinitePlayersScroll } from '@/hooks/admin/useInfinitePlayersScroll'

const {
  players,
  loading,
  error,
  hasMore,
  totalCount,
  observerTarget,
  refresh
} = useInfinitePlayersScroll({
  search: 'Messi',
  nationality: 'Argentina',
  position: 'RW',
  team: 'Inter Miami',
  limit: 50
})
```

**Endpoint:** `/api/admin/players`

---

### 2. `useInfiniteTeamsScroll`

**Ubicación:** [`src/hooks/admin/useInfiniteTeamsScroll.ts`](./admin/useInfiniteTeamsScroll.ts)

**Uso:**
```typescript
import { useInfiniteTeamsScroll } from '@/hooks/admin/useInfiniteTeamsScroll'

const {
  teams,
  loading,
  error,
  hasMore,
  totalCount,
  observerTarget,
  refresh
} = useInfiniteTeamsScroll({
  search: 'Barcelona',
  country: 'Spain',
  competition: 'La Liga',
  limit: 50
})
```

**Endpoint:** `/api/teams`

---

### 3. `useInfiniteCompetitionsScroll`

**Ubicación:** [`src/hooks/admin/useInfiniteCompetitionsScroll.ts`](./admin/useInfiniteCompetitionsScroll.ts)

**Uso:**
```typescript
import { useInfiniteCompetitionsScroll } from '@/hooks/admin/useInfiniteCompetitionsScroll'

const {
  competitions,
  loading,
  error,
  hasMore,
  totalCount,
  observerTarget,
  refresh
} = useInfiniteCompetitionsScroll({
  search: 'Liga',
  country: 'Spain',
  confederation: 'UEFA',
  tier: 1,
  limit: 50
})
```

**Endpoint:** `/api/competitions`

---

### 4. `useInfiniteDashboardScroll`

**Ubicación:** [`src/hooks/member/useInfiniteDashboardScroll.ts`](./member/useInfiniteDashboardScroll.ts)

**Uso:**
```typescript
import { useInfiniteDashboardScroll } from '@/hooks/member/useInfiniteDashboardScroll'

const {
  players,
  loading,
  error,
  hasMore,
  totalCount,
  observerTarget,
  refresh
} = useInfiniteDashboardScroll({
  search: 'Messi',
  nationality: 'Argentina',
  position: 'RW',
  team: 'Inter Miami',
  competition: 'MLS',
  minAge: 18,
  maxAge: 35,
  minRating: 70,
  maxRating: 95,
  minValue: 1000000,
  maxValue: 100000000,
  limit: 50
})
```

**Endpoint:** `/api/players-cursor`

---

## Crear un Nuevo Hook de Infinite Scroll

Para crear un nuevo hook específico para una entidad:

```typescript
// src/hooks/myEntity/useInfiniteMyEntityScroll.ts
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { MyEntity } from '@/types/myEntity'

interface UseInfiniteMyEntityScrollOptions {
  search?: string
  category?: string
  limit?: number
}

interface UseInfiniteMyEntityScrollReturn {
  entities: MyEntity[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  totalCount: number | null
  observerTarget: (node: HTMLDivElement | null) => void
  refresh: () => void
}

export function useInfiniteMyEntityScroll(
  options: UseInfiniteMyEntityScrollOptions = {}
): UseInfiniteMyEntityScrollReturn {
  const {
    search = '',
    category = '',
    limit = 50
  } = options

  const {
    items: entities,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfiniteScroll<MyEntity, Record<string, any>>({
    apiEndpoint: '/api/my-entities',
    getItemId: (entity) => entity.id,
    filters: { search, category },
    limit,
    rootMargin: '200px'
  })

  return {
    entities,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  }
}
```

## Ejemplo Completo en Componente

```typescript
'use client'

import { useState } from 'react'
import { useInfinitePlayersScroll } from '@/hooks/admin/useInfinitePlayersScroll'

export default function PlayersPage() {
  const [search, setSearch] = useState('')
  const [nationality, setNationality] = useState('')

  const {
    players,
    loading,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refresh
  } = useInfinitePlayersScroll({
    search,
    nationality,
    limit: 50
  })

  return (
    <div>
      <h1>Jugadores ({totalCount})</h1>

      {/* Filtros */}
      <input
        placeholder="Buscar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button onClick={refresh}>Refrescar</button>

      {/* Lista de jugadores */}
      {players.map((player) => (
        <div key={player.id_player}>
          {player.player_name}
        </div>
      ))}

      {/* Infinite scroll observer */}
      <div ref={observerTarget} style={{ minHeight: '80px' }}>
        {loading && <div>Cargando más jugadores...</div>}
        {!hasMore && <div>No hay más jugadores</div>}
      </div>

      {/* Error handling */}
      {error && (
        <div className="error">
          Error: {error.message}
        </div>
      )}
    </div>
  )
}
```

## Beneficios de la Unificación

### Antes (Código duplicado)
- ❌ ~200 líneas de código por hook
- ❌ Lógica duplicada en 4+ archivos
- ❌ Bugs en un hook no se propagan a otros
- ❌ Difícil mantener consistencia

### Después (Código unificado)
- ✅ ~60 líneas de código por hook específico
- ✅ Lógica centralizada en un único archivo
- ✅ Fixes de bugs se aplican a todos los hooks
- ✅ Comportamiento consistente en toda la app
- ✅ Más fácil agregar nuevas funcionalidades
- ✅ Mejor testeabilidad

## Métricas

- **Reducción de código:** ~70% menos líneas en hooks específicos
- **Mantenibilidad:** Lógica centralizada en un solo archivo
- **Reutilización:** Hook genérico puede usarse para cualquier entidad
- **Performance:** Mismo rendimiento, mejor organización

## Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

describe('useInfiniteScroll', () => {
  it('should load items on mount', async () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        apiEndpoint: '/api/test',
        getItemId: (item) => item.id,
        filters: {}
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.items.length).toBeGreaterThan(0)
    })
  })

  it('should deduplicate items', async () => {
    // Test implementation
  })

  it('should refresh on filter change', async () => {
    // Test implementation
  })
})
```

## Contribuir

Para agregar nuevas funcionalidades al hook genérico:

1. Edita [`src/hooks/useInfiniteScroll.ts`](./useInfiniteScroll.ts)
2. Actualiza la documentación en este archivo
3. Verifica que todos los hooks específicos funcionen correctamente
4. Ejecuta `npm run lint` y `npx tsc --noEmit` para verificar errores

## Soporte

Si encuentras algún problema o necesitas ayuda, revisa:
- El código fuente del hook: [`src/hooks/useInfiniteScroll.ts`](./useInfiniteScroll.ts)
- Los hooks específicos en [`src/hooks/admin/`](./admin/) y [`src/hooks/member/`](./member/)
- Los ejemplos de uso en componentes como [`src/app/admin/jugadores/page.tsx`](../app/admin/jugadores/page.tsx)
