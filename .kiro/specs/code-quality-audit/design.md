# Design Document

## Overview

Este documento describe el diseño técnico para realizar una auditoría completa de calidad de código del proyecto Scoutea. El objetivo es eliminar duplicaciones, optimizar performance, mejorar la estructura del código y establecer estándares consistentes en toda la aplicación.

## Architecture

### Current State Analysis

```
❌ PROBLEMAS IDENTIFICADOS:

APIs Duplicadas:
├── /api/players/route.ts     → Moderna, optimizada, bien documentada
└── /api/jugadores/route.ts   → Duplicada, inconsistente, menos optimizada

Servicios Duplicados:
├── src/lib/services/player-service.ts  → Completo, bien documentado
└── src/lib/db/player-service.ts        → Básico, funcionalidad limitada

Tipos Inconsistentes:
├── src/types/player.ts       → Interface Player (inglés)
└── src/hooks/usePlayers.ts   → Interface Player duplicada

Componentes Excesivamente Grandes:
├── src/app/member/dashboard/page.tsx    → 893 líneas
└── src/app/member/player/[id]/page.tsx  → 2733 líneas

Hooks con Lógica Duplicada:
├── src/hooks/usePlayers.ts     → Lógica de API compleja
└── src/hooks/usePlayerList.ts  → Usa useEntityList genérico
```

### Target Architecture

```
✅ ARQUITECTURA OBJETIVO:

APIs Consolidadas:
└── /api/players/             → API única, optimizada, consistente
    ├── route.ts             → CRUD operations
    ├── [id]/route.ts        → Individual operations
    ├── stats/route.ts       → Statistics
    └── filters/route.ts     → Filter options

Servicios Unificados:
└── src/lib/services/
    └── player-service.ts    → Servicio único consolidado

Tipos Consistentes:
└── src/types/
    └── player.ts           → Tipos unificados para toda la app

Componentes Modulares:
├── src/components/player/
│   ├── PlayerCard.tsx      → Tarjeta de jugador reutilizable
│   ├── PlayerFilters.tsx   → Filtros modulares
│   ├── PlayerList.tsx      → Lista optimizada
│   └── PlayerStats.tsx     → Estadísticas modulares
└── src/app/member/
    ├── dashboard/page.tsx  → <200 líneas, usa componentes
    └── player/[id]/page.tsx → <300 líneas, modularizado

Hooks Optimizados:
├── src/hooks/base/
│   ├── useAPI.ts          → Hook base para llamadas API
│   ├── useCache.ts        → Sistema de caché unificado
│   └── useErrorHandler.ts → Manejo de errores consistente
└── src/hooks/
    ├── usePlayers.ts      → Optimizado, usa hooks base
    └── usePlayerList.ts   → Refactorizado, más eficiente
```

## Components and Interfaces

### 1. Unified Type System

```typescript
// src/types/player.ts - TIPOS UNIFICADOS PARA TODA LA APLICACIÓN
// 🎯 PROPÓSITO: Eliminar inconsistencias de tipos entre componentes

export interface Player {
  // Identificación
  id_player: string
  player_name: string
  complete_player_name?: string
  
  // Información personal
  date_of_birth?: string
  age?: number
  nationality_1?: string
  nationality_2?: string
  
  // Atributos físicos
  height?: number
  foot?: string
  position_player?: string
  
  // Información del equipo
  team_name?: string
  team_country?: string
  team_competition?: string
  
  // Métricas
  player_rating?: number
  player_elo?: number
  
  // Contractual
  contract_end?: string
  on_loan?: boolean
  agency?: string
  
  // Metadatos
  createdAt: string
  updatedAt: string
}

// Tipos para operaciones
export interface PlayerFilters {
  player_name?: string
  position_player?: string
  team_name?: string
  nationality_1?: string
  min_age?: number
  max_age?: number
  min_rating?: number
  max_rating?: number
  on_loan?: boolean
}

export interface PlayerSearchOptions {
  page?: number
  limit?: number
  sortBy?: keyof Player
  sortOrder?: 'asc' | 'desc'
  filters?: PlayerFilters
}

export interface PlayerSearchResult {
  players: Player[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Tipos para formularios
export interface CreatePlayerData extends Omit<Player, 'id_player' | 'createdAt' | 'updatedAt'> {
  player_name: string // Requerido
}

export interface UpdatePlayerData extends Partial<CreatePlayerData> {}

// Tipos para estadísticas
export interface PlayerStats {
  totalPlayers: number
  playersByPosition: Array<{
    position_player: string
    count: number
  }>
  playersByNationality: Array<{
    nationality_1: string
    count: number
  }>
  averageRating: number | null
  topRatedPlayers: Player[]
  ratingDistribution: {
    average: number | null
    min: number | null
    max: number | null
    totalWithRating: number
  }
}

// Tipos para filtros disponibles
export interface FilterOptions {
  positions: Array<{
    value: string
    label: string
    count: number
  }>
  nationalities: Array<{
    value: string
    label: string
    count: number
  }>
  teams: Array<{
    value: string
    label: string
    count: number
  }>
  competitions: Array<{
    value: string
    label: string
    count: number
  }>
}
```

### 2. Consolidated Service Layer

```typescript
// src/lib/services/player-service.ts - SERVICIO ÚNICO CONSOLIDADO
// 🎯 PROPÓSITO: Centralizar toda la lógica de jugadores

export class PlayerService {
  // CRUD Operations
  static async searchPlayers(options: PlayerSearchOptions): Promise<PlayerSearchResult>
  static async getPlayerById(id: string): Promise<Player | null>
  static async createPlayer(data: CreatePlayerData): Promise<Player>
  static async updatePlayer(id: string, data: UpdatePlayerData): Promise<Player>
  static async deletePlayer(id: string): Promise<void>
  
  // Advanced Operations
  static async getPlayerStats(): Promise<PlayerStats>
  static async getPlayersByTeam(teamName: string): Promise<Player[]>
  static async getPlayersByPosition(position: string): Promise<Player[]>
  static async getAvailableFilters(): Promise<FilterOptions>
  
  // Utility Methods
  static async checkIndexPerformance(): Promise<PerformanceMetrics>
  static async clearQueryCache(): Promise<void>
}
```

### 3. Modular Component System

```typescript
// src/components/player/PlayerCard.tsx - COMPONENTE REUTILIZABLE
// 🎯 PROPÓSITO: Tarjeta de jugador consistente en toda la app

interface PlayerCardProps {
  player: Player
  variant?: 'compact' | 'detailed' | 'list'
  showActions?: boolean
  onPlayerClick?: (player: Player) => void
  onBookmarkToggle?: (playerId: string) => void
}

export function PlayerCard({ 
  player, 
  variant = 'compact',
  showActions = true,
  onPlayerClick,
  onBookmarkToggle 
}: PlayerCardProps) {
  // Implementación modular y reutilizable
}

// src/components/player/PlayerFilters.tsx - FILTROS MODULARES
// 🎯 PROPÓSITO: Sistema de filtros reutilizable

interface PlayerFiltersProps {
  filters: PlayerFilters
  onFiltersChange: (filters: PlayerFilters) => void
  availableOptions: FilterOptions
  loading?: boolean
}

export function PlayerFilters({
  filters,
  onFiltersChange,
  availableOptions,
  loading = false
}: PlayerFiltersProps) {
  // Implementación de filtros modulares
}

// src/components/player/PlayerList.tsx - LISTA OPTIMIZADA
// 🎯 PROPÓSITO: Lista de jugadores con paginación y virtualización

interface PlayerListProps {
  players: Player[]
  loading?: boolean
  pagination?: PlayerSearchResult['pagination']
  onPlayerClick?: (player: Player) => void
  onPageChange?: (page: number) => void
  variant?: 'grid' | 'table' | 'cards'
}

export function PlayerList({
  players,
  loading = false,
  pagination,
  onPlayerClick,
  onPageChange,
  variant = 'table'
}: PlayerListProps) {
  // Lista optimizada con virtualización para grandes datasets
}
```

### 4. Optimized Hook System

```typescript
// src/hooks/base/useAPI.ts - HOOK BASE PARA LLAMADAS API
// 🎯 PROPÓSITO: Lógica común para todas las llamadas API

interface UseAPIOptions<T> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  dependencies?: any[]
  cacheKey?: string
  cacheTTL?: number
}

export function useAPI<T>(options: UseAPIOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Lógica común: fetch, cache, error handling, retry
  
  return { data, loading, error, refetch, clearCache }
}

// src/hooks/base/useCache.ts - SISTEMA DE CACHÉ UNIFICADO
// 🎯 PROPÓSITO: Caché consistente en toda la aplicación

interface CacheOptions {
  key: string
  ttl?: number // Time to live in seconds
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
}

export function useCache<T>(options: CacheOptions) {
  // Implementación de caché con TTL y diferentes storages
  
  return {
    get: (key: string) => T | null,
    set: (key: string, value: T, ttl?: number) => void,
    clear: (key?: string) => void,
    has: (key: string) => boolean
  }
}

// src/hooks/base/useErrorHandler.ts - MANEJO DE ERRORES CONSISTENTE
// 🎯 PROPÓSITO: Manejo de errores estandarizado

export function useErrorHandler() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleError = useCallback((error: unknown, context?: string) => {
    // Lógica estándar de manejo de errores
    // - Logging
    // - Formateo de mensajes
    // - Notificaciones al usuario
  }, [])
  
  const clearError = useCallback((context?: string) => {
    // Limpiar errores específicos o todos
  }, [])
  
  return { errors, handleError, clearError }
}

// src/hooks/usePlayers.ts - HOOK OPTIMIZADO
// 🎯 PROPÓSITO: Hook específico para jugadores usando hooks base

export function usePlayers() {
  const cache = useCache<PlayerSearchResult>({ key: 'players', ttl: 300 })
  const { handleError } = useErrorHandler()
  
  // Usar hooks base para implementación más limpia y consistente
  
  return {
    players,
    loading,
    error,
    searchPlayers,
    getPlayer,
    createPlayer,
    updatePlayer,
    deletePlayer,
    clearCache
  }
}
```

## Data Models

### Database Optimization Strategy

```sql
-- Índices optimizados para performance
-- 🎯 PROPÓSITO: Acelerar consultas más comunes

-- Índice compuesto para búsquedas generales
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_search_composite 
ON jugadores(player_name, position_player, nationality_1);

-- Índice para ordenamiento por rating y fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_rating_created 
ON jugadores(player_rating DESC, createdAt DESC);

-- Índice para búsquedas por equipo y posición
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_team_position 
ON jugadores(team_name, position_player);

-- Índice para paginación eficiente
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_pagination 
ON jugadores(createdAt DESC, id_player);

-- Índice para filtros por nacionalidad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_nationality 
ON jugadores(nationality_1) WHERE nationality_1 IS NOT NULL;

-- Índice para filtros por edad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_age 
ON jugadores(age) WHERE age IS NOT NULL;
```

### Validation Schema Enhancement

```typescript
// src/lib/validation/player-schema.ts - VALIDACIÓN ROBUSTA
// 🎯 PROPÓSITO: Validación consistente y segura

import { z } from 'zod'

// Schema base para jugador
const BasePlayerSchema = z.object({
  player_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/, 'El nombre contiene caracteres inválidos'),
    
  position_player: z.string()
    .regex(/^(GK|CB|LB|RB|CDM|CM|CAM|LW|RW|ST|CF)$/, 'Posición inválida')
    .optional(),
    
  age: z.number()
    .int('La edad debe ser un número entero')
    .min(16, 'La edad mínima es 16 años')
    .max(50, 'La edad máxima es 50 años')
    .optional(),
    
  team_name: z.string()
    .min(2, 'El nombre del equipo debe tener al menos 2 caracteres')
    .max(100, 'El nombre del equipo no puede exceder 100 caracteres')
    .optional(),
    
  nationality_1: z.string()
    .min(2, 'La nacionalidad debe tener al menos 2 caracteres')
    .max(50, 'La nacionalidad no puede exceder 50 caracteres')
    .optional(),
    
  player_rating: z.number()
    .min(0, 'El rating mínimo es 0')
    .max(100, 'El rating máximo es 100')
    .optional(),
    
  height: z.number()
    .min(150, 'La altura mínima es 150 cm')
    .max(220, 'La altura máxima es 220 cm')
    .optional(),
    
  on_loan: z.boolean().optional()
})

// Schemas específicos para diferentes operaciones
export const PlayerCreateSchema = BasePlayerSchema.extend({
  player_name: BasePlayerSchema.shape.player_name // Hacer obligatorio
})

export const PlayerUpdateSchema = BasePlayerSchema.partial()

export const PlayerSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum([
    'player_name', 
    'player_rating', 
    'age', 
    'createdAt',
    'team_name',
    'position_player'
  ]).default('player_name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  filters: z.object({
    player_name: z.string().optional(),
    position_player: z.string().optional(),
    team_name: z.string().optional(),
    nationality_1: z.string().optional(),
    min_age: z.number().int().min(16).max(50).optional(),
    max_age: z.number().int().min(16).max(50).optional(),
    min_rating: z.number().min(0).max(100).optional(),
    max_rating: z.number().min(0).max(100).optional(),
    on_loan: z.boolean().optional()
  }).optional()
})

// Funciones de validación
export function validatePlayerCreate(data: unknown) {
  return PlayerCreateSchema.parse(data)
}

export function validatePlayerUpdate(data: unknown) {
  return PlayerUpdateSchema.parse(data)
}

export function validatePlayerSearch(data: unknown) {
  return PlayerSearchSchema.parse(data)
}
```

## Error Handling

### Standardized Error System

```typescript
// src/lib/errors/api-errors.ts - SISTEMA DE ERRORES ESTANDARIZADO
// 🎯 PROPÓSITO: Manejo consistente de errores en toda la aplicación

export enum ErrorCode {
  // Errores de validación
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Errores de recursos
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Errores de autenticación/autorización
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Errores de base de datos
  DATABASE_ERROR = 'DATABASE_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Errores de servidor
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Errores de rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: ErrorCode,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Errores predefinidos
export const ErrorResponses = {
  PLAYER_NOT_FOUND: new APIError(
    404, 
    'Jugador no encontrado', 
    ErrorCode.PLAYER_NOT_FOUND
  ),
  
  INVALID_INPUT: new APIError(
    400, 
    'Datos de entrada inválidos', 
    ErrorCode.INVALID_INPUT
  ),
  
  UNAUTHORIZED: new APIError(
    401, 
    'No autorizado. Debes iniciar sesión.', 
    ErrorCode.UNAUTHORIZED
  ),
  
  FORBIDDEN: new APIError(
    403, 
    'Acceso denegado. Permisos insuficientes.', 
    ErrorCode.FORBIDDEN
  ),
  
  DUPLICATE_ENTRY: new APIError(
    409, 
    'Ya existe un registro con estos datos', 
    ErrorCode.DUPLICATE_ENTRY
  ),
  
  INTERNAL_ERROR: new APIError(
    500, 
    'Error interno del servidor', 
    ErrorCode.INTERNAL_ERROR
  ),
  
  RATE_LIMIT_EXCEEDED: new APIError(
    429, 
    'Demasiadas solicitudes. Inténtalo más tarde.', 
    ErrorCode.RATE_LIMIT_EXCEEDED
  )
}

// Middleware para manejo de errores
export function handleAPIError(error: unknown): NextResponse {
  // Log del error para monitoreo
  console.error('API Error:', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  })
  
  if (error instanceof APIError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code,
        details: error.details 
      },
      { status: error.statusCode }
    )
  }
  
  // Errores de Zod (validación)
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Datos de entrada inválidos',
        code: ErrorCode.VALIDATION_ERROR,
        details: error.errors
      },
      { status: 400 }
    )
  }
  
  // Errores de Prisma (base de datos)
  if (error instanceof Error && error.message.includes('Unique constraint')) {
    return NextResponse.json(
      {
        error: 'Ya existe un registro con estos datos',
        code: ErrorCode.DUPLICATE_ENTRY
      },
      { status: 409 }
    )
  }
  
  // Error genérico
  return NextResponse.json(
    {
      error: 'Error interno del servidor',
      code: ErrorCode.INTERNAL_ERROR
    },
    { status: 500 }
  )
}
```

### Client-Side Error Handling

```typescript
// src/lib/errors/client-errors.ts - MANEJO DE ERRORES EN CLIENTE
// 🎯 PROPÓSITO: Manejo consistente de errores en el frontend

export interface ErrorState {
  message: string
  code?: string
  details?: any
  timestamp: Date
}

export class ClientErrorHandler {
  private static errors: Map<string, ErrorState> = new Map()
  
  static handleError(error: unknown, context?: string): ErrorState {
    const errorState: ErrorState = {
      message: 'Error desconocido',
      timestamp: new Date()
    }
    
    if (error instanceof Error) {
      errorState.message = error.message
    } else if (typeof error === 'string') {
      errorState.message = error
    }
    
    // Almacenar error para debugging
    if (context) {
      this.errors.set(context, errorState)
    }
    
    // Log para desarrollo
    console.error('Client Error:', {
      error: errorState,
      context,
      timestamp: errorState.timestamp
    })
    
    return errorState
  }
  
  static getError(context: string): ErrorState | undefined {
    return this.errors.get(context)
  }
  
  static clearError(context: string): void {
    this.errors.delete(context)
  }
  
  static clearAllErrors(): void {
    this.errors.clear()
  }
}
```

## Testing Strategy

### Comprehensive Testing Plan

```typescript
// tests/api/players.test.ts - TESTS DE API
// 🎯 PROPÓSITO: Verificar que todos los endpoints funcionan correctamente

describe('/api/players API', () => {
  describe('GET /api/players', () => {
    it('should return paginated players with default parameters')
    it('should apply filters correctly')
    it('should handle sorting by different fields')
    it('should validate pagination parameters')
    it('should return 401 for unauthenticated requests')
    it('should handle database errors gracefully')
  })
  
  describe('POST /api/players', () => {
    it('should create player with valid data')
    it('should reject invalid data with proper error messages')
    it('should require admin permissions')
    it('should handle duplicate player names')
  })
  
  describe('GET /api/players/[id]', () => {
    it('should return player by valid ID')
    it('should return 404 for non-existent player')
    it('should validate ID format')
  })
  
  describe('PUT /api/players/[id]', () => {
    it('should update player with valid data')
    it('should reject invalid updates')
    it('should require admin permissions')
  })
  
  describe('DELETE /api/players/[id]', () => {
    it('should delete existing player')
    it('should return 404 for non-existent player')
    it('should require admin permissions')
  })
})

// tests/components/PlayerCard.test.tsx - TESTS DE COMPONENTES
// 🎯 PROPÓSITO: Verificar que los componentes funcionan correctamente

describe('PlayerCard Component', () => {
  it('should render player information correctly')
  it('should handle different variants (compact, detailed, list)')
  it('should call onPlayerClick when clicked')
  it('should show/hide actions based on showActions prop')
  it('should handle missing player data gracefully')
})

// tests/hooks/usePlayers.test.ts - TESTS DE HOOKS
// 🎯 PROPÓSITO: Verificar que los hooks funcionan correctamente

describe('usePlayers Hook', () => {
  it('should fetch players on mount')
  it('should handle search with filters')
  it('should cache results appropriately')
  it('should handle errors gracefully')
  it('should clear cache when requested')
})
```

### Performance Testing

```typescript
// tests/performance/api-performance.test.ts - TESTS DE PERFORMANCE
// 🎯 PROPÓSITO: Verificar que la aplicación es suficientemente rápida

describe('API Performance', () => {
  it('should return player search results within 200ms', async () => {
    const startTime = Date.now()
    await fetch('/api/players?limit=20')
    const endTime = Date.now()
    expect(endTime - startTime).toBeLessThan(200)
  })
  
  it('should handle 100 concurrent requests without errors', async () => {
    const requests = Array(100).fill(null).map(() => 
      fetch('/api/players?limit=10')
    )
    const responses = await Promise.all(requests)
    responses.forEach(response => {
      expect(response.ok).toBe(true)
    })
  })
  
  it('should use database indices effectively', async () => {
    // Test que verifica que las consultas usan índices
    // Esto requeriría acceso a métricas de base de datos
  })
})
```

## Migration Strategy

### Phased Implementation Plan

#### Phase 1: Foundation (Week 1)
1. **Unify Types**: Consolidate all Player interfaces
2. **Consolidate Services**: Merge duplicate services
3. **Create Base Hooks**: Implement useAPI, useCache, useErrorHandler
4. **Database Optimization**: Add performance indices

#### Phase 2: API Consolidation (Week 2)
1. **Enhance /api/players**: Improve existing endpoints
2. **Create Missing Endpoints**: Add stats and filters endpoints
3. **Update Validation**: Implement robust Zod schemas
4. **Error Handling**: Standardize error responses

#### Phase 3: Component Refactoring (Week 3)
1. **Extract Components**: Break down large components
2. **Create Reusable Components**: PlayerCard, PlayerFilters, PlayerList
3. **Update Hooks**: Refactor usePlayers and usePlayerList
4. **Implement Caching**: Add intelligent caching system

#### Phase 4: Frontend Migration (Week 4)
1. **Update Dashboard**: Refactor member dashboard
2. **Update Player Page**: Modularize player detail page
3. **Update Admin Components**: Migrate admin interfaces
4. **Remove Old Code**: Delete /api/jugadores and duplicates

#### Phase 5: Testing & Optimization (Week 5)
1. **Comprehensive Testing**: API, components, hooks
2. **Performance Testing**: Load testing and optimization
3. **Documentation**: Update all documentation
4. **Final Cleanup**: Remove dead code and optimize

### Rollback Strategy

```typescript
// Feature flags para rollback seguro
const FEATURE_FLAGS = {
  USE_NEW_PLAYER_API: process.env.USE_NEW_PLAYER_API === 'true',
  USE_CONSOLIDATED_SERVICES: process.env.USE_CONSOLIDATED_SERVICES === 'true',
  USE_MODULAR_COMPONENTS: process.env.USE_MODULAR_COMPONENTS === 'true'
}

// Wrapper para APIs con fallback
export async function fetchPlayers(options: PlayerSearchOptions) {
  if (FEATURE_FLAGS.USE_NEW_PLAYER_API) {
    try {
      return await newPlayerAPI.searchPlayers(options)
    } catch (error) {
      console.error('New API failed, falling back to old API:', error)
      return await oldPlayerAPI.searchPlayers(options)
    }
  }
  return await oldPlayerAPI.searchPlayers(options)
}
```

## Performance Optimizations

### Caching Strategy

```typescript
// src/lib/cache/cache-manager.ts - SISTEMA DE CACHÉ INTELIGENTE
// 🎯 PROPÓSITO: Mejorar performance con caché estratégico

export class CacheManager {
  private static instance: CacheManager
  private memoryCache: Map<string, CacheEntry> = new Map()
  
  // TTL por tipo de dato
  private static readonly TTL = {
    PLAYER_LIST: 5 * 60 * 1000,      // 5 minutos
    PLAYER_DETAILS: 10 * 60 * 1000,  // 10 minutos
    PLAYER_STATS: 30 * 60 * 1000,    // 30 minutos
    FILTER_OPTIONS: 60 * 60 * 1000   // 1 hora
  }
  
  static getInstance(): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager()
    }
    return this.instance
  }
  
  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl: ttl || CacheManager.TTL.PLAYER_LIST
    }
    this.memoryCache.set(key, entry)
  }
  
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    if (!entry) return null
    
    // Verificar si expiró
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key)
      return null
    }
    
    return entry.value as T
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.memoryCache.clear()
      return
    }
    
    // Invalidar por patrón
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    }
  }
}

interface CacheEntry {
  value: any
  timestamp: number
  ttl: number
}
```

### Database Query Optimization

```typescript
// src/lib/db/query-optimizer.ts - OPTIMIZADOR DE CONSULTAS
// 🎯 PROPÓSITO: Consultas más eficientes y rápidas

export class QueryOptimizer {
  // Consulta optimizada para búsqueda de jugadores
  static buildPlayerSearchQuery(options: PlayerSearchOptions) {
    const { page = 1, limit = 20, sortBy = 'player_name', sortOrder = 'asc', filters = {} } = options
    
    // Usar índices apropiados según los filtros
    let orderBy: any
    
    if (sortBy === 'player_rating') {
      // Usar idx_player_rating_created
      orderBy = [
        { player_rating: sortOrder },
        { createdAt: 'desc' }
      ]
    } else if (sortBy === 'createdAt') {
      // Usar idx_player_pagination
      orderBy = [
        { createdAt: sortOrder },
        { id_player: 'asc' }
      ]
    } else if (filters.team_name && filters.position_player) {
      // Usar idx_player_team_position
      orderBy = { [sortBy]: sortOrder }
    } else {
      // Usar idx_player_search_composite
      orderBy = { [sortBy]: sortOrder }
    }
    
    return {
      where: this.buildWhereClause(filters),
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    }
  }
  
  private static buildWhereClause(filters: PlayerFilters) {
    const where: any = {}
    
    // Optimizar filtros para usar índices
    if (filters.player_name) {
      where.player_name = {
        contains: filters.player_name,
        mode: 'insensitive'
      }
    }
    
    if (filters.position_player) {
      where.position_player = filters.position_player
    }
    
    if (filters.nationality_1) {
      where.nationality_1 = filters.nationality_1
    }
    
    if (filters.team_name) {
      where.team_name = {
        contains: filters.team_name,
        mode: 'insensitive'
      }
    }
    
    // Filtros de rango
    if (filters.min_age || filters.max_age) {
      where.age = {}
      if (filters.min_age) where.age.gte = filters.min_age
      if (filters.max_age) where.age.lte = filters.max_age
    }
    
    if (filters.min_rating || filters.max_rating) {
      where.player_rating = {}
      if (filters.min_rating) where.player_rating.gte = filters.min_rating
      if (filters.max_rating) where.player_rating.lte = filters.max_rating
    }
    
    if (filters.on_loan !== undefined) {
      where.on_loan = filters.on_loan
    }
    
    return where
  }
}
```

### Frontend Performance Optimizations

```typescript
// src/components/player/VirtualizedPlayerList.tsx - LISTA VIRTUALIZADA
// 🎯 PROPÓSITO: Manejar listas grandes sin impacto en performance

import { FixedSizeList as List } from 'react-window'

interface VirtualizedPlayerListProps {
  players: Player[]
  height: number
  itemHeight: number
  onPlayerClick?: (player: Player) => void
}

export function VirtualizedPlayerList({
  players,
  height,
  itemHeight,
  onPlayerClick
}: VirtualizedPlayerListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <PlayerCard 
        player={players[index]} 
        variant="compact"
        onPlayerClick={onPlayerClick}
      />
    </div>
  )
  
  return (
    <List
      height={height}
      itemCount={players.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  )
}

// src/hooks/useInfiniteScroll.ts - SCROLL INFINITO OPTIMIZADO
// 🎯 PROPÓSITO: Cargar datos bajo demanda

export function useInfiniteScroll<T>(
  fetchMore: (page: number) => Promise<T[]>,
  hasMore: boolean
) {
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      await fetchMore(page + 1)
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error loading more items:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchMore, hasMore, loading, page])
  
  // Intersection Observer para detectar scroll
  const { ref } = useIntersectionObserver({
    onIntersect: loadMore,
    threshold: 0.1
  })
  
  return { loadMore, loading, ref }
}
```

## Security Enhancements

### Input Sanitization and Validation

```typescript
// src/lib/security/sanitizer.ts - SANITIZACIÓN DE ENTRADA
// 🎯 PROPÓSITO: Prevenir ataques de inyección y XSS

export class InputSanitizer {
  // Sanitizar strings para prevenir XSS
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
      .replace(/javascript:/gi, '') // Remover javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remover event handlers
      .substring(0, 1000) // Limitar longitud
  }
  
  // Sanitizar datos de jugador
  static sanitizePlayerData(data: any): any {
    const sanitized: any = {}
    
    if (data.player_name) {
      sanitized.player_name = this.sanitizeString(data.player_name)
    }
    
    if (data.team_name) {
      sanitized.team_name = this.sanitizeString(data.team_name)
    }
    
    if (data.nationality_1) {
      sanitized.nationality_1 = this.sanitizeString(data.nationality_1)
    }
    
    // Validar números
    if (data.age && typeof data.age === 'number') {
      sanitized.age = Math.max(16, Math.min(50, Math.floor(data.age)))
    }
    
    if (data.player_rating && typeof data.player_rating === 'number') {
      sanitized.player_rating = Math.max(0, Math.min(100, data.player_rating))
    }
    
    return sanitized
  }
}
```

### Rate Limiting

```typescript
// src/lib/security/rate-limiter.ts - LIMITADOR DE VELOCIDAD
// 🎯 PROPÓSITO: Prevenir abuso de APIs

export class RateLimiter {
  private static requests: Map<string, number[]> = new Map()
  
  static isAllowed(
    identifier: string, 
    maxRequests: number = 100, 
    windowMs: number = 60000
  ): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Obtener requests del usuario
    const userRequests = this.requests.get(identifier) || []
    
    // Filtrar requests dentro de la ventana
    const recentRequests = userRequests.filter(time => time > windowStart)
    
    // Verificar límite
    if (recentRequests.length >= maxRequests) {
      return false
    }
    
    // Añadir request actual
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
    
    return true
  }
  
  static getRemainingRequests(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): number {
    const now = Date.now()
    const windowStart = now - windowMs
    
    const userRequests = this.requests.get(identifier) || []
    const recentRequests = userRequests.filter(time => time > windowStart)
    
    return Math.max(0, maxRequests - recentRequests.length)
  }
}
```

Este diseño técnico proporciona una hoja de ruta completa para mejorar la calidad del código del proyecto Scoutea, abordando todos los problemas identificados de manera sistemática y escalable.