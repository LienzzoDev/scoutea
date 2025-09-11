# Design Document

## Overview

Este documento describe el diseño técnico para consolidar las APIs de jugadores en Scoutea, eliminando la duplicación entre `/api/players` y `/api/jugadores`, unificando tipos de datos, e implementando optimizaciones de performance y seguridad.

## Architecture

### Current State Analysis
```
❌ PROBLEMA ACTUAL:
/api/players/route.ts     → Moderna, optimizada, inglés
/api/jugadores/route.ts   → Duplicada, español, inconsistente

src/types/player.ts       → Tipos en español (Jugador)
src/hooks/usePlayers.ts   → Tipos en inglés (Player)
```

### Target Architecture
```
✅ ARQUITECTURA OBJETIVO:
/api/players/             → API única consolidada
  ├── route.ts           → CRUD operations
  ├── [id]/route.ts      → Individual player operations
  ├── stats/route.ts     → Statistics endpoint
  ├── filters/route.ts   → Available filters
  └── search/route.ts    → Advanced search

src/types/
  └── player.ts          → Tipos unificados (Player)

src/lib/services/
  └── player-service.ts  → Lógica de negocio consolidada
```

## Components and Interfaces

### 1. Unified Player Type
```typescript
// src/types/player.ts
// 🎯 PROPÓSITO: Definir UN SOLO tipo de jugador para toda la aplicación
// ✅ BENEFICIO: Elimina confusión entre diferentes interfaces de jugador

export interface Player {
  // 🆔 Identificación única del jugador
  id_player: string              // ID único en la base de datos (obligatorio)
  player_name: string            // Nombre principal del jugador (obligatorio)
  complete_player_name?: string  // Nombre completo si es diferente (opcional)
  
  // 👤 Información personal básica
  date_of_birth?: string         // Fecha de nacimiento original
  correct_date_of_birth?: string // Fecha corregida si la original era incorrecta
  age?: number                   // Edad calculada automáticamente
  nationality_1?: string         // Nacionalidad principal (ej: "España")
  nationality_2?: string         // Segunda nacionalidad si la tiene
  
  // 🏃‍♂️ Atributos físicos y técnicos
  height?: number                // Altura en centímetros
  foot?: string                  // Pie dominante ("Left", "Right", "Both")
  position_player?: string       // Posición en el campo ("CF", "CM", "CB", etc.)
  
  // ⚽ Información del equipo actual
  team_name?: string             // Nombre del equipo actual
  team_country?: string          // País del equipo
  team_competition?: string      // Liga o competición donde juega
  
  // 📊 Métricas de rendimiento
  player_rating?: number         // Valoración del jugador (0-100)
  player_elo?: number           // Sistema ELO de ranking
  player_ranking?: number       // Posición en ranking global
  
  // 📄 Detalles contractuales
  contract_end?: string         // Fecha de fin de contrato
  on_loan?: boolean            // Si está cedido (true/false)
  agency?: string              // Agencia que lo representa
  
  // 🕒 Metadatos del sistema
  createdAt: string            // Cuándo se añadió a la base de datos
  updatedAt: string            // Última vez que se actualizó
}

// 🔍 FILTROS: Para buscar jugadores específicos
// ✅ BENEFICIO: Los usuarios pueden encontrar exactamente lo que buscan
export interface PlayerFilters {
  player_name?: string      // Buscar por nombre (ej: "Messi")
  position_player?: string  // Filtrar por posición (ej: "CF")
  team_name?: string       // Filtrar por equipo (ej: "Barcelona")
  nationality_1?: string   // Filtrar por nacionalidad (ej: "Argentina")
  min_age?: number        // Edad mínima (ej: 18)
  max_age?: number        // Edad máxima (ej: 25)
  min_rating?: number     // Rating mínimo (ej: 80)
  max_rating?: number     // Rating máximo (ej: 95)
  on_loan?: boolean       // Solo jugadores cedidos (true) o no cedidos (false)
}

// ⚙️ OPCIONES DE BÚSQUEDA: Cómo queremos buscar y ordenar
// ✅ BENEFICIO: Control total sobre cómo se muestran los resultados
export interface PlayerSearchOptions {
  page?: number              // Qué página queremos (ej: página 1, 2, 3...)
  limit?: number            // Cuántos jugadores por página (ej: 20)
  sortBy?: keyof Player     // Por qué campo ordenar (ej: "player_rating")
  sortOrder?: 'asc' | 'desc' // Orden ascendente (A-Z) o descendente (Z-A)
  filters?: PlayerFilters   // Filtros a aplicar (definidos arriba)
}

// 📋 RESULTADO DE BÚSQUEDA: Lo que devuelve la API
// ✅ BENEFICIO: Información completa para mostrar paginación en la UI
export interface PlayerSearchResult {
  players: Player[]         // Array con los jugadores encontrados
  pagination: {
    page: number           // Página actual
    limit: number          // Jugadores por página
    total: number          // Total de jugadores que cumplen los filtros
    totalPages: number     // Total de páginas disponibles
    hasNext: boolean       // Si hay página siguiente (para botón "Siguiente")
    hasPrev: boolean       // Si hay página anterior (para botón "Anterior")
  }
}
```

### 2. Consolidated API Service
```typescript
// src/lib/services/player-service.ts
// 🏗️ SERVICIO PRINCIPAL: Toda la lógica de jugadores en un solo lugar
// ✅ BENEFICIO: Fácil de mantener, testear y reutilizar

export class PlayerService {
  // 📚 OPERACIONES BÁSICAS (CRUD = Create, Read, Update, Delete)
  
  // 🔍 Buscar jugadores con filtros y paginación
  // Ejemplo: PlayerService.searchPlayers({ page: 1, limit: 20, filters: { position_player: "CF" } })
  static async searchPlayers(options: PlayerSearchOptions): Promise<PlayerSearchResult>
  
  // 👤 Obtener UN jugador específico por su ID
  // Ejemplo: PlayerService.getPlayerById("player_123") → devuelve el jugador o null si no existe
  static async getPlayerById(id: string): Promise<Player | null>
  
  // ➕ Crear un nuevo jugador
  // Ejemplo: PlayerService.createPlayer({ player_name: "Nuevo Jugador", age: 20 })
  static async createPlayer(data: CreatePlayerData): Promise<Player>
  
  // ✏️ Actualizar datos de un jugador existente
  // Ejemplo: PlayerService.updatePlayer("player_123", { player_rating: 85 })
  static async updatePlayer(id: string, data: UpdatePlayerData): Promise<Player>
  
  // 🗑️ Eliminar un jugador (¡cuidado con esta!)
  // Ejemplo: PlayerService.deletePlayer("player_123")
  static async deletePlayer(id: string): Promise<void>
  
  // 📊 OPERACIONES AVANZADAS (para dashboards y análisis)
  
  // 📈 Obtener estadísticas generales (total jugadores, promedios, etc.)
  static async getPlayerStats(): Promise<PlayerStats>
  
  // ⚽ Obtener todos los jugadores de un equipo específico
  // Ejemplo: PlayerService.getPlayersByTeam("Barcelona")
  static async getPlayersByTeam(teamName: string): Promise<Player[]>
  
  // 🎯 Obtener jugadores por posición
  // Ejemplo: PlayerService.getPlayersByPosition("CF")
  static async getPlayersByPosition(position: string): Promise<Player[]>
  
  // 🔧 Obtener opciones disponibles para filtros (para dropdowns en la UI)
  // Ejemplo: Devuelve todas las posiciones, nacionalidades, equipos disponibles
  static async getAvailableFilters(): Promise<FilterOptions>
}
```

### 3. API Route Structure
```typescript
// 🌐 RUTAS DE LA API: Cómo el frontend se comunica con el backend

// 📋 /api/players/route.ts - Endpoint principal para listas y creación
// GET /api/players → Buscar jugadores (con filtros, paginación, etc.)
// POST /api/players → Crear un nuevo jugador
export async function GET(request: NextRequest): Promise<NextResponse<PlayerSearchResult>>
export async function POST(request: NextRequest): Promise<NextResponse<Player>>

// 👤 /api/players/[id]/route.ts - Operaciones con jugador específico
// GET /api/players/123 → Obtener jugador con ID 123
// PUT /api/players/123 → Actualizar jugador con ID 123
// DELETE /api/players/123 → Eliminar jugador con ID 123
export async function GET(request: NextRequest, { params }: { params: { id: string } })
export async function PUT(request: NextRequest, { params }: { params: { id: string } })
export async function DELETE(request: NextRequest, { params }: { params: { id: string } })

// 📊 /api/players/stats/route.ts - Estadísticas para dashboards
// GET /api/players/stats → Devuelve totales, promedios, gráficos, etc.
export async function GET(): Promise<NextResponse<PlayerStats>>

// 🔧 /api/players/filters/route.ts - Opciones para filtros
// GET /api/players/filters → Devuelve todas las posiciones, equipos, nacionalidades disponibles
// ✅ BENEFICIO: Los dropdowns se llenan automáticamente con datos reales
export async function GET(): Promise<NextResponse<FilterOptions>>
```

## Data Models

### Database Schema Optimization
```sql
-- Índices optimizados para búsquedas comunes
CREATE INDEX CONCURRENTLY idx_player_search 
ON jugadores(player_name, position_player, nationality_1);

CREATE INDEX CONCURRENTLY idx_player_rating_created 
ON jugadores(player_rating DESC, createdAt DESC);

CREATE INDEX CONCURRENTLY idx_player_team_position 
ON jugadores(team_name, position_player);

-- Índice para paginación eficiente
CREATE INDEX CONCURRENTLY idx_player_pagination 
ON jugadores(createdAt DESC, id_player);
```

### Validation Schema
```typescript
// src/lib/validation/player-schema.ts
import { z } from 'zod'

export const PlayerCreateSchema = z.object({
  player_name: z.string().min(2).max(100),
  position_player: z.string().optional(),
  age: z.number().min(16).max(50).optional(),
  team_name: z.string().optional(),
  nationality_1: z.string().optional(),
  // ... otros campos con validación
})

export const PlayerUpdateSchema = PlayerCreateSchema.partial()

export const PlayerSearchSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['player_name', 'player_rating', 'age', 'createdAt']).default('player_name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  filters: z.object({
    player_name: z.string().optional(),
    position_player: z.string().optional(),
    // ... otros filtros
  }).optional()
})
```

## Error Handling

### Standardized Error Responses
```typescript
// src/lib/errors/api-errors.ts
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
  }
}

export const ErrorResponses = {
  PLAYER_NOT_FOUND: new APIError(404, 'Player not found', 'PLAYER_NOT_FOUND'),
  INVALID_INPUT: new APIError(400, 'Invalid input data', 'INVALID_INPUT'),
  UNAUTHORIZED: new APIError(401, 'Unauthorized access', 'UNAUTHORIZED'),
  INTERNAL_ERROR: new APIError(500, 'Internal server error', 'INTERNAL_ERROR')
}

// Middleware para manejo consistente de errores
export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }
  
  // Log error for monitoring
  console.error('Unhandled API error:', error)
  
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}
```

### Input Sanitization
```typescript
// src/lib/security/sanitization.ts
export function sanitizePlayerInput(input: any): any {
  // Remover scripts maliciosos
  // Validar tipos de datos
  // Escapar caracteres especiales
  // Limitar longitud de strings
}
```

## Testing Strategy

### API Testing
```typescript
// tests/api/players.test.ts
describe('/api/players', () => {
  describe('GET /api/players', () => {
    it('should return paginated players')
    it('should apply filters correctly')
    it('should handle invalid parameters')
  })
  
  describe('POST /api/players', () => {
    it('should create player with valid data')
    it('should reject invalid data')
    it('should require authentication')
  })
})
```

### Integration Testing
```typescript
// tests/integration/player-flow.test.ts
describe('Player Management Flow', () => {
  it('should create, read, update, and delete player')
  it('should maintain data consistency across operations')
  it('should handle concurrent operations correctly')
})
```

### Performance Testing
```typescript
// tests/performance/player-api.test.ts
describe('Player API Performance', () => {
  it('should handle 1000+ concurrent requests')
  it('should return results within 200ms for simple queries')
  it('should paginate efficiently for large datasets')
})
```

## Migration Strategy

### Phase 1: Preparation
1. Create new unified types and services
2. Implement new API endpoints alongside existing ones
3. Add comprehensive tests for new implementation

### Phase 2: Migration
1. Update frontend components to use new API
2. Migrate custom hooks to new endpoints
3. Update all imports and type references

### Phase 3: Cleanup
1. Remove old `/api/jugadores` endpoints
2. Delete deprecated types and services
3. Update documentation and examples

### Rollback Plan
- Keep old API endpoints during migration
- Feature flags to switch between old/new implementations
- Database rollback scripts if needed
- Monitoring to detect issues early

## Performance Optimizations

### Caching Strategy
```typescript
// Implement Redis caching for frequent queries
const CACHE_TTL = {
  PLAYER_LIST: 300, // 5 minutes
  PLAYER_DETAILS: 600, // 10 minutes
  PLAYER_STATS: 1800, // 30 minutes
}
```

### Database Query Optimization
- Use database-level pagination instead of client-side filtering
- Implement query result caching
- Add database connection pooling
- Use prepared statements for security and performance

### Frontend Optimizations
- Implement virtual scrolling for large lists
- Add optimistic updates for better UX
- Use React Query for automatic caching and synchronization
- Implement proper loading states and error boundaries