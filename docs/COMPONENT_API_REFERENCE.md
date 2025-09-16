# Component API Reference - Scoutea

## 📖 Referencia Técnica de Componentes

Esta documentación técnica complementa la [Guía de Componentes](../COMPONENT_GUIDE.md) con detalles de implementación, interfaces TypeScript y ejemplos avanzados.

---

## 🎨 UI Components

### Button Component

**File:** `src/components/ui/button.tsx`

```typescript
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**CSS Classes Generated:**
- Base: `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium...`
- Variants: `bg-primary`, `bg-destructive`, `border border-input`, etc.
- Sizes: `h-10 px-4 py-2`, `h-9 rounded-md px-3`, etc.

**Advanced Usage:**
```tsx
// With custom styling
<Button 
  variant="outline" 
  size="lg"
  className="border-red-500 hover:bg-red-50"
>
  Custom Button
</Button>

// With loading state
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Loading..." : "Submit"}
</Button>

// As a link (using Next.js Link)
<Link href="/players" passHref>
  <Button variant="link">View Players</Button>
</Link>
```

---

### Card Component System

**File:** `src/components/ui/card.tsx`

```typescript
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
)

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)

// ... other card components
```

**Component Hierarchy:**
```
Card (container)
├── CardHeader (optional)
│   ├── CardTitle (h3)
│   └── CardDescription (p)
├── CardContent (main content)
└── CardFooter (actions)
```

**Layout Patterns:**
```tsx
// Standard card layout
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Compact card (no header/footer)
<Card>
  <CardContent className="p-4">
    <h4 className="font-semibold mb-2">Quick Info</h4>
    <p>Content without formal header</p>
  </CardContent>
</Card>

// Card with custom header layout
<Card>
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle>Player Stats</CardTitle>
      <Badge>Active</Badge>
    </div>
  </CardHeader>
  <CardContent>
    {/* Stats content */}
  </CardContent>
</Card>
```

---

## ⚽ Player Components

### PlayerCard Component

**File:** `src/components/player/PlayerCard.tsx`

```typescript
interface PlayerCardProps {
  player: Player;
  variant?: "compact" | "detailed" | "list";
  showActions?: boolean;
  onPlayerClick?: (player: Player) => void;
  onBookmarkToggle?: (playerId: string) => Promise<boolean>;
  isBookmarked?: boolean;
}

const PlayerCard = memo<PlayerCardProps>(function PlayerCard({
  player,
  variant = "compact",
  showActions = true,
  onPlayerClick,
  onBookmarkToggle,
  isBookmarked = false,
}) {
  // Memoized calculations
  const playerInfo = useMemo(() => ({
    displayAge: player.age ? `${player.age} años` : "Edad N/A",
    displayNationality: player.nationality_1 || "Nacionalidad N/A",
    displayTeam: player.team_name || "N/A",
    displayPosition: player.position_player || "N/A",
    displayRating: player.player_rating ? `${player.player_rating}/100` : null,
    hasRating: Boolean(player.player_rating)
  }), [
    player.age,
    player.nationality_1,
    player.team_name,
    player.position_player,
    player.player_rating
  ]);

  // Memoized handlers
  const handleClick = useCallback(() => {
    if (onPlayerClick) {
      onPlayerClick(player);
    }
  }, [onPlayerClick, player]);

  // Variant-specific rendering...
});
```

**Performance Optimizations:**
1. **React.memo**: Prevents re-renders when props haven't changed
2. **useMemo**: Caches expensive calculations
3. **useCallback**: Prevents function recreation on each render

**Variant Specifications:**

#### Compact Variant
- **Dimensions**: ~200px width, auto height
- **Use case**: Grid layouts, dashboard overviews
- **Information density**: Essential info only
- **Performance**: Optimized for large lists

#### Detailed Variant  
- **Dimensions**: Full width, expanded height
- **Use case**: Featured players, modal content
- **Information density**: All available data
- **Performance**: Suitable for single/few instances

#### List Variant
- **Dimensions**: Full width, fixed height (~80px)
- **Use case**: Search results, table alternatives
- **Information density**: Horizontal layout, key info
- **Performance**: Optimized for scrolling lists

**Integration Examples:**
```tsx
// In a grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {players.map(player => (
    <PlayerCard
      key={player.id_player}
      player={player}
      variant="compact"
      onPlayerClick={handlePlayerClick}
      onBookmarkToggle={handleBookmarkToggle}
      isBookmarked={bookmarkedPlayers.includes(player.id_player)}
    />
  ))}
</div>

// In a search results list
<div className="space-y-2">
  {searchResults.map(player => (
    <PlayerCard
      key={player.id_player}
      player={player}
      variant="list"
      onPlayerClick={handlePlayerClick}
    />
  ))}
</div>

// Featured player showcase
<PlayerCard
  player={featuredPlayer}
  variant="detailed"
  showActions={true}
  onPlayerClick={handlePlayerClick}
  onBookmarkToggle={handleBookmarkToggle}
  isBookmarked={isPlayerBookmarked}
/>
```

---

### PlayerAvatar Component

**File:** `src/components/ui/player-avatar.tsx`

```typescript
interface PlayerAvatarProps {
  player: Player
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showFlag?: boolean
  showBadge?: boolean
  className?: string
}

export default function PlayerAvatar({ 
  player, 
  size = 'md', 
  showFlag = true, 
  showBadge = true, 
  className = '' 
}: PlayerAvatarProps) {
  return (
    <EntityAvatar
      entity={player}
      type="player"
      size={size}
      showFlag={showFlag}
      showBadge={showBadge}
      className={className}
    />
  )
}
```

**Size Specifications:**
```css
/* Size mappings */
sm: 32x32px  /* List items, compact cards */
md: 48x48px  /* Standard cards, forms */
lg: 64x64px  /* Detailed cards, headers */
xl: 96x96px  /* Profile pages, modals */
```

**EntityAvatar Integration:**
The PlayerAvatar wraps the generic EntityAvatar component, providing player-specific defaults and type safety.

---

## 🔍 Filter Components

### MultiSelectFilter Component

**File:** `src/components/filters/multi-select-filter.tsx`

```typescript
interface MultiSelectFilterProps {
  label: string
  options: string[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  maxDisplayTags?: number
}

export default function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  maxDisplayTags = 2
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ... rest of implementation
}
```

**State Management:**
- `isOpen`: Controls dropdown visibility
- `searchTerm`: Filters available options
- `selectedValues`: Managed by parent component

**Features:**
1. **Real-time search**: Filters options as user types
2. **Tag display**: Shows selected items as removable tags
3. **Overflow handling**: Shows "+N more" when exceeding maxDisplayTags
4. **Keyboard navigation**: Arrow keys, Enter, Escape
5. **Click outside**: Closes dropdown when clicking elsewhere

**Advanced Usage:**
```tsx
// With async options loading
const [positions, setPositions] = useState<string[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function loadPositions() {
    const data = await fetchPlayerPositions()
    setPositions(data)
    setLoading(false)
  }
  loadPositions()
}, [])

if (loading) {
  return <LoadingSpinner size="sm" />
}

return (
  <MultiSelectFilter
    label="Posiciones"
    options={positions}
    selectedValues={selectedPositions}
    onSelectionChange={setSelectedPositions}
    placeholder="Seleccionar posiciones..."
    maxDisplayTags={3}
  />
)

// With custom option rendering
const CustomMultiSelectFilter = ({ options, ...props }) => {
  const optionsWithCounts = options.map(option => ({
    value: option,
    label: `${option} (${getOptionCount(option)})`
  }))
  
  return (
    <MultiSelectFilter
      {...props}
      options={optionsWithCounts.map(o => o.label)}
    />
  )
}
```

---

## 📐 Layout Components

### PageContainer Component

**File:** `src/components/layout/page-container.tsx`

```typescript
interface PageContainerProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
}

export function PageContainer({ 
  children, 
  className,
  title,
  description 
}: PageContainerProps) {
  return (
    <div className={cn("container mx-auto px-4 py-6", className)}>
      {title && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
```

**Layout Structure:**
```
PageContainer
├── Header Section (conditional)
│   ├── Title (h1)
│   └── Description (p)
└── Children Content
```

**Responsive Behavior:**
- Container: `max-width` responsive breakpoints
- Padding: `px-4` (16px) on mobile, scales with container
- Vertical spacing: `py-6` (24px) top/bottom

**Usage Patterns:**
```tsx
// Basic page
<PageContainer title="Player Management">
  <PlayerTable />
</PageContainer>

// Page with description
<PageContainer 
  title="Dashboard" 
  description="Overview of player statistics and recent activity"
>
  <DashboardContent />
</PageContainer>

// Custom styling
<PageContainer 
  title="Reports"
  className="bg-gray-50 min-h-screen"
>
  <ReportsGrid />
</PageContainer>

// No header
<PageContainer>
  <CustomHeader />
  <MainContent />
</PageContainer>
```

---

## 🔧 Utility Components

### LoadingSpinner Component

**File:** `src/components/ui/loading-spinner.tsx`

```typescript
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary";
  text?: string;
  className?: string;
}

function LoadingSpinner({
  size = "md",
  variant = "default",
  text,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const variantClasses = {
    default: "border-gray-300 border-t-gray-600",
    primary: "border-[#8c1a10]/20 border-t-[#8c1a10]",
    secondary: "border-blue-200 border-t-blue-600",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} ${variantClasses[variant]} border-2 rounded-full animate-spin`} />
      {text && <span className="mt-2 text-[#6d6d6d] text-sm">{text}</span>}
    </div>
  );
}

// Specialized spinners
export function PlayerLoadingSpinner({ text = "Cargando jugador..." }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" variant="primary" text={text} />
    </div>
  );
}

export function TableLoadingSpinner({ text = "Cargando datos..." }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" variant="primary" text={text} />
    </div>
  );
}

export function ButtonLoadingSpinner() {
  return <LoadingSpinner size="sm" variant="default" className="text-white" />;
}
```

**Animation Details:**
- Uses CSS `animate-spin` class (360° rotation in 1s)
- Border technique: transparent border with colored top border
- Smooth animation with `transition-all`

**Specialized Variants:**
1. **PlayerLoadingSpinner**: For player-specific loading states
2. **TableLoadingSpinner**: For data tables and lists  
3. **ButtonLoadingSpinner**: For button loading states

---

## 🎯 Advanced Patterns

### Compound Components Pattern

Example with Card components:
```tsx
// ✅ Good - Compound components
<Card>
  <CardHeader>
    <CardTitle>Player Profile</CardTitle>
    <CardDescription>Detailed player information</CardDescription>
  </CardHeader>
  <CardContent>
    <PlayerStats player={player} />
  </CardContent>
  <CardFooter>
    <Button>Edit Player</Button>
  </CardFooter>
</Card>

// ❌ Avoid - Monolithic component
<PlayerProfileCard 
  title="Player Profile"
  description="Detailed player information"
  player={player}
  showEditButton={true}
/>
```

### Render Props Pattern

For flexible component composition:
```tsx
interface DataFetcherProps<T> {
  url: string
  children: (data: T | null, loading: boolean, error: string | null) => ReactNode
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [url])

  return <>{children(data, loading, error)}</>
}

// Usage
<DataFetcher<Player[]> url="/api/players">
  {(players, loading, error) => {
    if (loading) return <TableLoadingSpinner />
    if (error) return <div>Error: {error}</div>
    if (!players) return <div>No data</div>
    
    return (
      <div className="grid gap-4">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    )
  }}
</DataFetcher>
```

### Higher-Order Components (HOCs)

For cross-cutting concerns:
```tsx
function withLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithLoadingComponent(props: P & { loading?: boolean }) {
    const { loading, ...componentProps } = props
    
    if (loading) {
      return <LoadingSpinner size="lg" text="Loading..." />
    }
    
    return <Component {...(componentProps as P)} />
  }
}

// Usage
const PlayerCardWithLoading = withLoading(PlayerCard)

<PlayerCardWithLoading 
  player={player} 
  loading={isPlayerLoading}
  onPlayerClick={handleClick}
/>
```

### Custom Hooks for Component Logic

Extract reusable logic:
```tsx
// Custom hook for bookmark functionality
function useBookmark(entityId: string) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const toggleBookmark = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await bookmarkService.toggle(entityId)
      setIsBookmarked(result.isBookmarked)
      return result.isBookmarked
    } catch (error) {
      console.error('Bookmark error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [entityId])

  useEffect(() => {
    bookmarkService.isBookmarked(entityId).then(setIsBookmarked)
  }, [entityId])

  return { isBookmarked, isLoading, toggleBookmark }
}

// Usage in component
function PlayerCard({ player }) {
  const { isBookmarked, isLoading, toggleBookmark } = useBookmark(player.id)
  
  return (
    <Card>
      <CardContent>
        <h3>{player.name}</h3>
        <BookmarkButton
          entityId={player.id}
          isBookmarked={isBookmarked}
          onToggle={toggleBookmark}
          disabled={isLoading}
        />
      </CardContent>
    </Card>
  )
}
```

---

## 🧪 Testing Patterns

### Component Testing with React Testing Library

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerCard } from '../PlayerCard'

describe('PlayerCard', () => {
  const mockPlayer = {
    id_player: '1',
    player_name: 'Lionel Messi',
    position_player: 'RW',
    age: 36,
    team_name: 'Inter Miami'
  }

  it('renders player information correctly', () => {
    render(<PlayerCard player={mockPlayer} />)
    
    expect(screen.getByText('Lionel Messi')).toBeInTheDocument()
    expect(screen.getByText('RW')).toBeInTheDocument()
    expect(screen.getByText('36')).toBeInTheDocument()
  })

  it('calls onPlayerClick when card is clicked', async () => {
    const handlePlayerClick = jest.fn()
    render(
      <PlayerCard 
        player={mockPlayer} 
        onPlayerClick={handlePlayerClick}
      />
    )
    
    await userEvent.click(screen.getByRole('button'))
    expect(handlePlayerClick).toHaveBeenCalledWith(mockPlayer)
  })

  it('handles bookmark toggle correctly', async () => {
    const handleBookmarkToggle = jest.fn().mockResolvedValue(true)
    render(
      <PlayerCard
        player={mockPlayer}
        onBookmarkToggle={handleBookmarkToggle}
        isBookmarked={false}
      />
    )
    
    const bookmarkButton = screen.getByLabelText(/bookmark/i)
    await userEvent.click(bookmarkButton)
    
    expect(handleBookmarkToggle).toHaveBeenCalledWith(mockPlayer.id_player)
  })

  it('renders different variants correctly', () => {
    const { rerender } = render(
      <PlayerCard player={mockPlayer} variant="compact" />
    )
    
    expect(screen.getByTestId('player-card-compact')).toBeInTheDocument()
    
    rerender(<PlayerCard player={mockPlayer} variant="detailed" />)
    expect(screen.getByTestId('player-card-detailed')).toBeInTheDocument()
  })
})
```

### Integration Testing

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerDashboard } from '../PlayerDashboard'

// Mock API calls
jest.mock('../hooks/usePlayers', () => ({
  usePlayers: () => ({
    players: mockPlayers,
    loading: false,
    error: null,
    searchPlayers: jest.fn()
  })
}))

describe('PlayerDashboard Integration', () => {
  it('filters players when using MultiSelectFilter', async () => {
    render(<PlayerDashboard />)
    
    // Open position filter
    const positionFilter = screen.getByLabelText('Posiciones')
    await userEvent.click(positionFilter)
    
    // Select "Delantero" option
    const delanteroOption = screen.getByText('Delantero')
    await userEvent.click(delanteroOption)
    
    // Verify filtered results
    await waitFor(() => {
      const playerCards = screen.getAllByTestId('player-card')
      expect(playerCards).toHaveLength(2) // Only forwards
    })
  })
})
```

---

## 📊 Performance Monitoring

### Component Performance Metrics

```tsx
import { Profiler } from 'react'

function onRenderCallback(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  console.log('Component Performance:', {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  })
}

// Wrap components for performance monitoring
<Profiler id="PlayerCard" onRender={onRenderCallback}>
  <PlayerCard player={player} />
</Profiler>
```

### Memory Leak Prevention

```tsx
// ✅ Good - Cleanup in useEffect
useEffect(() => {
  const controller = new AbortController()
  
  fetch('/api/players', { signal: controller.signal })
    .then(setPlayers)
    .catch(error => {
      if (error.name !== 'AbortError') {
        setError(error.message)
      }
    })
  
  return () => controller.abort()
}, [])

// ✅ Good - Remove event listeners
useEffect(() => {
  const handleResize = () => setWindowWidth(window.innerWidth)
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

---

## 🔄 Migration Guide

### Upgrading from Legacy Components

```tsx
// ❌ Old pattern
<div className="player-card">
  <img src={player.avatar} alt={player.name} />
  <h3>{player.name}</h3>
  <span>{player.position}</span>
</div>

// ✅ New pattern
<PlayerCard
  player={player}
  variant="compact"
  onPlayerClick={handlePlayerClick}
/>

// Migration steps:
// 1. Replace custom div with PlayerCard
// 2. Pass player object instead of individual props
// 3. Use variant prop for styling
// 4. Add event handlers as props
```

### Breaking Changes

**v1.0.0 → v2.0.0:**
- `PlayerCard.size` → `PlayerCard.variant`
- `Button.type` → `Button.variant`
- `LoadingSpinner.color` → `LoadingSpinner.variant`

**Migration script:**
```bash
# Find and replace patterns
find src -name "*.tsx" -exec sed -i 's/size="large"/variant="detailed"/g' {} \;
find src -name "*.tsx" -exec sed -i 's/type="primary"/variant="default"/g' {} \;
```

---

*This API reference is automatically generated from component source code and should be kept in sync with implementation changes.*