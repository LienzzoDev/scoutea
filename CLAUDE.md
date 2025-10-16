# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scoutea is a Next.js 15 football/soccer scouting platform with multi-role authentication (Admin, Member, Scout, Tester), subscription management via Stripe, and advanced player analytics. The application provides player profiles, radar charts, statistical comparisons, scout portfolios, and tournament management.

## Commands

### Development
```bash
npm run dev              # Start dev server with Turbopack (fastest)
npm run dev:webpack      # Start dev server with Webpack
npm run build            # Build production app (includes Prisma generate)
npm start                # Start production server
```

### Linting & Code Quality
```bash
npm run lint             # Check linting issues
npm run lint:fix         # Fix linting issues automatically
npm run lint:unused      # Find unused exports
npm run clean:unused     # Find unimported files
```

### Database (Prisma + PostgreSQL)
```bash
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema changes to DB (no migration)
npm run db:migrate       # Create and apply migration
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio GUI
```

### Testing
```bash
npm test                 # Run Vitest in watch mode
npm run test:run         # Run tests once
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Run tests with coverage report
npm run test:integration # Run integration tests only
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run Playwright with UI
npm run test:visual      # Run visual regression tests
```

### Data Population Scripts
```bash
npx tsx scripts/populate-player-data.ts           # Populate missing player data
npx tsx scripts/calculate-radar-data.ts           # Calculate radar metrics
npx tsx scripts/consolidate-scout.ts              # Consolidate scout data
npx tsx scripts/seed-equipos.ts                   # Seed teams
```

### Webhook & Stripe Setup
```bash
npm run stripe:setup     # Setup Stripe environment
npm run stripe:webhook   # Setup Stripe webhooks
npm run webhook:setup    # Setup webhooks
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **Language**: TypeScript with strict mode (`noImplicitAny`, `noUncheckedIndexedAccess`, etc.)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Clerk (multi-role: admin, member, scout, tester)
- **Payments**: Stripe subscriptions
- **Styling**: Tailwind CSS + Radix UI components
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Charts**: Recharts for radar charts, lollipop charts, beeswarm plots

### Database Architecture

The Prisma schema ([prisma/schema.prisma](prisma/schema.prisma)) follows a normalized structure with these core models:

1. **Core Entities**:
   - `Jugador` (Players) - Main player table with 100+ fields covering stats, team info, market value, contracts
   - `Scout` - Scout profiles with performance metrics, ROI calculations, rankings
   - `Reporte` (Reports) - Scout reports linking scouts to players with historical snapshots
   - `Equipo` (Teams) - Team data with competition and rating info
   - `Usuario` (Users) - User accounts synced with Clerk
   - `Torneo` (Tournaments) - Tournament management

2. **Normalized Reference Tables** (Phase 1 optimization):
   - `Country` - Countries with confederation data
   - `Position` - Player positions (GK, CB, CM, etc.)
   - `Competition` - Football competitions/leagues
   - `Agency` - Player agencies

3. **Analytics & Metrics**:
   - `RadarMetrics` - Pre-calculated radar chart data per player/category/period
   - `PlayerStats3m` - Rolling 3-month statistics (goals, assists, duels, passes, etc.)
   - `LollipopData` - Percentile rankings for metrics
   - `BeeswarmData` - Distribution plot data points
   - `Atributos` - FMI (Football Manager Index) attributes system

4. **EAV System** (Flexible attributes):
   - `AttributeDefinition` - Define new attributes dynamically
   - `PlayerAttribute` - Store attribute values with temporal context

5. **Relationship Tables**:
   - `PlayerList` - User's bookmarked players (many-to-many)
   - `ScoutList` - User's favorite scouts (many-to-many)
   - `PlayerCorrection` - Track manual corrections to player data
   - `PlayerMetric` - Generic metric storage system
   - `PlayerRole` - Playing style roles (e.g., "GK Dominator", "Central Att Finisher")

**Key Pattern**: Players use `id_player` as primary key, but the schema avoids redundancy by using foreign keys (`team_id`, `position_id`, `nationality_id`, `agency_id`) instead of duplicating denormalized string fields.

### Service Layer Pattern

All business logic lives in [src/lib/services/](src/lib/services/). Key services:

- **PlayerService** ([src/lib/services/player-service.ts](src/lib/services/player-service.ts)): CRUD operations for players, centralized Prisma→Player mapping
- **RadarCalculationService**: Computes radar metrics with percentile rankings
- **DataPopulationService**: Fills missing player data using fallback strategies
- **chart-service.ts**: Generates beeswarm, lollipop, radar data from raw stats
- **scout-service.ts**: Scout CRUD and portfolio management
- **report-service.ts**: Scout report creation/editing
- **role-service.ts**: Clerk role assignment (admin, member, scout, tester)
- **transaction-service.ts**: Database transaction helpers

**Pattern**: Services handle all Prisma queries. API routes call services and handle HTTP concerns only.

### Authentication & Authorization

**Clerk Integration** ([src/lib/clerk-config.ts](src/lib/clerk-config.ts)):
- Multi-role system: `admin`, `member`, `scout`, `tester` stored in Clerk `publicMetadata.role`
- Middleware ([src/middleware.ts](src/middleware.ts)) enforces role-based access:
  - `/admin/*` → admin only
  - `/member/*` → member or tester (checks active subscription)
  - `/scout/*` → scout or tester (checks active subscription)
- Helper: `getUserRoleInfo()` in [src/lib/auth/role-utils.ts](src/lib/auth/role-utils.ts) reads role from Clerk session
- Guards: `<AdminGuard>`, `<SubscriptionGuard>` in [src/components/auth/](src/components/auth/)

**Subscription Flow**:
1. User pays via Stripe → webhook hits `/api/webhooks/stripe`
2. Webhook updates Clerk metadata: `publicMetadata.hasActiveSubscription = true`
3. Middleware checks subscription before granting access to protected routes

### API Routes Structure

All API routes are in [src/app/api/](src/app/api/). Key patterns:

- **Player APIs**:
  - `GET /api/players/[id]/route.ts` - Get single player
  - `GET /api/players/[id]/radar/route.ts` - Get radar chart data
  - `GET /api/players/[id]/stats/route.ts` - Get 3-month stats
  - `GET /api/players/filters/route.ts` - Get filter options for search

- **Scout APIs**:
  - `GET /api/scouts/[id]/route.ts` - Get scout profile
  - `GET /api/scout/[id]/qualitative/route.ts` - Get qualitative metrics
  - `GET /api/scout/[id]/quantitative/route.ts` - Get quantitative metrics

- **Report APIs**:
  - `GET /api/reports/route.ts` - List reports
  - `POST /api/reports/route.ts` - Create new report
  - `GET /api/reports/[id]/route.ts` - Get single report
  - `DELETE /api/reports/[id]/delete/route.ts` - Delete report

- **Admin APIs**:
  - `/api/admin/*` - Admin-only endpoints (player imports, data seeding)

**Pattern**: All routes follow this structure:
1. Authenticate with `await auth()` from Clerk
2. Validate input with Zod schemas from [src/lib/validation/](src/lib/validation/)
3. Call service layer function
4. Return JSON response with proper status codes

**Error Handling**: Routes use try/catch and return structured errors: `{ __error: string }` or `{ _error: string }`

### Component Organization

Components follow atomic design in [src/components/](src/components/):

- **[src/components/ui/](src/components/ui/)** - Base UI components (buttons, cards, inputs, dropdowns) using Radix UI + Tailwind
- **[src/components/player/](src/components/player/)** - Player-specific components:
  - `PlayerCard.tsx` - Player card in lists
  - `PlayerRadar.tsx` - Radar chart visualization
  - `PlayerLollipop.tsx` - Lollipop chart for percentiles
  - `PlayerFilters.tsx` - Filter controls
  - `PlayerTable.tsx` - Sortable player table
- **[src/components/scout/](src/components/scout/)** - Scout profile components
- **[src/components/admin/](src/components/admin/)** - Admin dashboard components
- **[src/components/auth/](src/components/auth/)** - Auth guards and wrappers
- **[src/components/layout/](src/components/layout/)** - Page layouts, navbars

**Key Pattern**: Components receive typed props from [src/types/](src/types/). Heavy use of Server Components for data fetching, Client Components only where interactivity is needed.

### Radar Chart System

Radar charts are the core analytics feature:

1. **Data Source**: `RadarMetrics` table stores pre-calculated percentiles per category (Attack, Defense, Passing, Physical, etc.)
2. **Calculation**: `RadarCalculationService.ts` computes percentiles by comparing player stats against position-based cohorts
3. **Rendering**: `PlayerRadar.tsx` uses Recharts `RadarChart` component
4. **Caching**: Metrics are cached in DB and only recalculated periodically via `scripts/calculate-radar-data.ts`

**Performance**: The app uses `DataPopulationService` to fill missing stats to ensure radar charts always have data. See `scripts/populate-missing-player-data.ts`.

### Type Safety

- Path alias: `@/` → `src/`
- Types defined in [src/types/player.ts](src/types/player.ts), [src/types/scout.ts](src/types/scout.ts), etc.
- Prisma types imported from `@prisma/client` but mapped to domain types via service layer (e.g., `Jugador` → `Player`)
- Zod schemas for validation in [src/lib/validation/](src/lib/validation/)

### Testing Strategy

- **Unit/Integration**: Vitest tests in `src/**/*.test.ts` and `tests/integration/`
- **E2E**: Playwright tests in `tests/e2e/` for critical user flows
- **Visual**: Playwright visual regression for charts
- **Setup**: `src/test/setup.ts` for Vitest globals

**Running Single Tests**:
```bash
npx vitest run src/lib/services/player-service.test.ts
npx playwright test tests/e2e/player-profile.spec.ts
```

## Important Notes

### Database Migrations
- **DO NOT** run `db:push` in production. Use `db:migrate` to create proper migrations
- Always run `npx prisma generate` after schema changes
- The app auto-generates Prisma client on `postinstall` and `build`

### Environment Variables
- Required: `DATABASE_URL`, `DIRECT_URL` (Postgres), `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- The app validates env vars on startup (see [src/lib/validation/env-validation.ts](src/lib/validation/env-validation.ts))

### Debug Routes Protection
- Debug routes (`/api/debug/*`) are blocked in production unless admin role
- See [src/lib/utils/cleanup-debug-apis.ts](src/lib/utils/cleanup-debug-apis.ts)

### Build Configuration
- ESLint and TypeScript errors are **ignored during builds** (`ignoreDuringBuilds: true`) to allow deployment
- Fix type errors locally before committing

### Clerk Version
- Uses `@clerk/nextjs` v6.32.2+ with App Router
- Auth state accessed via `await auth()` (async) in routes/middleware
- Client-side auth: `useAuth()`, `useUser()` hooks

### Data Import Scripts
- FMI (Football Manager Index) data: `scripts/` folder has import scripts for player attributes
- Stats import: Admin panel has UI for uploading XLS files with player stats

## Common Patterns

### Creating a New API Route
```typescript
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
  }

  // Call service layer
  const data = await SomeService.getData()

  return NextResponse.json(data)
}
```

### Adding a New Service Method
```typescript
// src/lib/services/player-service.ts
export class PlayerService {
  static async getPlayersByTeam(teamId: string): Promise<Player[]> {
    const players = await prisma.jugador.findMany({
      where: { team_id: teamId }
    })
    return players.map(this.mapPrismaToPlayer)
  }
}
```

### Protected Page with Subscription Check
```typescript
// src/app/member/some-page/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserRoleInfo } from '@/lib/auth/role-utils'

export default async function SomePage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const roleInfo = getUserRoleInfo({ /* user object */ })
  if (!roleInfo.hasActiveSubscription) {
    redirect('/member/subscription-plans')
  }

  return <div>Protected content</div>
}
```

### Fetching Data in Server Component
```typescript
// src/app/players/[id]/page.tsx
import { PlayerService } from '@/lib/services/player-service'

export default async function PlayerPage({ params }: { params: { id: string } }) {
  const player = await PlayerService.getPlayerById(params.id)

  if (!player) {
    notFound()
  }

  return <PlayerProfile player={player} />
}
```