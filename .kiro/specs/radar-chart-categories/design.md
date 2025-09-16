# Design Document

## Overview

This design implements a comprehensive radar chart system that visualizes player performance across 9 tactical categories. The system maps existing database attributes from the `atributos` and `player_stats_3m` tables to create meaningful tactical insights, while ensuring all players have complete data through intelligent sample data generation.

## Architecture

### Data Flow Architecture

```
Database Tables (atributos, player_stats_3m)
    ↓
Data Population Service (fills null values)
    ↓
Radar Calculation Service (maps to 9 categories)
    ↓
Radar Metrics Cache (RadarMetrics table)
    ↓
Radar API Endpoints
    ↓
React Radar Component
```

### Component Architecture

- **RadarCalculationService**: Core service for calculating the 9 radar categories
- **DataPopulationService**: Service for filling null values with realistic sample data
- **RadarCacheService**: Manages caching and updating of calculated radar metrics
- **PlayerRadarAPI**: API endpoints for fetching radar data with filtering
- **PlayerRadarComponent**: React component for displaying the interactive radar chart

## Components and Interfaces

### 1. Radar Category Mapping

Each of the 9 categories maps to specific database attributes:

#### Def Stopped Ball (Balón Parado Defensivo)
- **Primary Attributes**: `marking_fmi`, `positioning_fmi`, `heading_fmi`, `jumping_fmi`
- **Secondary Attributes**: `concentration_fmi`, `anticipation_fmi`
- **Weight Distribution**: 40% marking, 30% positioning, 20% heading, 10% jumping

#### Evitation (Evitación)
- **Primary Attributes**: `dribbling_fmi`, `agility_fmi`, `balance_fmi`, `first_touch_fmi`
- **Secondary Attributes**: `composure_fmi`, `technique_fmi`
- **Weight Distribution**: 30% dribbling, 25% agility, 25% balance, 20% first_touch

#### Recovery (Recuperación)
- **Primary Attributes**: `tackling_fmi`, `anticipation_fmi`, `positioning_fmi`
- **Secondary Attributes**: `interceptions_p90_3m`, `def_duels_won_percent_3m`
- **Weight Distribution**: 35% tackling, 30% anticipation, 20% positioning, 15% stats

#### Def Transition (Transición Defensiva)
- **Primary Attributes**: `pace_fmi`, `acceleration_fmi`, `stamina_fmi`, `work_rate_fmi`
- **Secondary Attributes**: `decisions_fmi`, `team_work_fmi`
- **Weight Distribution**: 25% pace, 25% acceleration, 25% stamina, 25% work_rate

#### Off Stopped Ball (Balón Parado Ofensivo)
- **Primary Attributes**: `crossing_fmi`, `corners_fmi`, `free_kick_taking_fmi`, `heading_fmi`
- **Secondary Attributes**: `technique_fmi`, `composure_fmi`
- **Weight Distribution**: 30% crossing, 25% corners, 25% free_kicks, 20% heading

#### Maintenance (Mantenimiento)
- **Primary Attributes**: `passing_fmi`, `technique_fmi`, `composure_fmi`
- **Secondary Attributes**: `accurate_passes_percent_3m`, `vision_fmi`
- **Weight Distribution**: 35% passing, 25% technique, 25% composure, 15% stats

#### Progression (Progresión)
- **Primary Attributes**: `vision_fmi`, `passing_fmi`, `dribbling_fmi`
- **Secondary Attributes**: `forward_passes_p90_3m`, `technique_fmi`
- **Weight Distribution**: 30% vision, 30% passing, 25% dribbling, 15% stats

#### Finishing (Finalización)
- **Primary Attributes**: `finishing_fmi`, `composure_fmi`, `technique_fmi`
- **Secondary Attributes**: `goals_p90_3m`, `shots_p90_3m`, `effectiveness_percent_3m`
- **Weight Distribution**: 40% finishing, 25% composure, 20% technique, 15% stats

#### Off Transition (Transición Ofensiva)
- **Primary Attributes**: `pace_fmi`, `acceleration_fmi`, `off_the_ball_fmi`, `anticipation_fmi`
- **Secondary Attributes**: `stamina_fmi`, `decisions_fmi`
- **Weight Distribution**: 30% pace, 30% acceleration, 25% off_the_ball, 15% anticipation

### 2. Data Population Strategy

#### Position-Based Sample Data Generation

**Goalkeepers (GK)**:
- High values: `reflexes_fmi`, `handling_fmi`, `aerial_ability_fmi`, `one_on_ones_fmi`
- Medium values: `kicking_fmi`, `throwing_fmi`, `communication_fmi`
- Low values: `finishing_fmi`, `crossing_fmi`, `dribbling_fmi`

**Defenders (CB, LB, RB)**:
- High values: `tackling_fmi`, `marking_fmi`, `heading_fmi`, `positioning_fmi`
- Medium values: `passing_fmi`, `strength_fmi`, `stamina_fmi`
- Low values: `finishing_fmi`, `dribbling_fmi`, `long_shots_fmi`

**Midfielders (CM, DM, AM)**:
- High values: `passing_fmi`, `vision_fmi`, `technique_fmi`, `stamina_fmi`
- Medium values: `tackling_fmi`, `dribbling_fmi`, `work_rate_fmi`
- Variable: `finishing_fmi` (higher for AM, lower for DM)

**Forwards (ST, LW, RW)**:
- High values: `finishing_fmi`, `pace_fmi`, `dribbling_fmi`, `off_the_ball_fmi`
- Medium values: `technique_fmi`, `composure_fmi`, `acceleration_fmi`
- Low values: `tackling_fmi`, `marking_fmi`, `heading_fmi` (except ST)

#### Statistical Data Population

For `player_stats_3m` table, use position-based averages:
- **Goals**: ST (0.6), AM (0.3), CM (0.1), CB (0.05), GK (0.0)
- **Assists**: AM (0.4), CM (0.2), ST (0.15), Wingers (0.3)
- **Passes**: CM (60), CB (45), AM (50), ST (25)
- **Tackles**: CB (3.5), DM (4.0), CM (2.5), AM (1.5)

### 3. Calculation Service Interface

```typescript
interface RadarCalculationService {
  calculatePlayerRadar(playerId: string): Promise<RadarCategoryData[]>
  calculateCategoryValue(category: RadarCategory, attributes: AtributosData, stats: PlayerStats3m): number
  normalizeValue(value: number, min: number, max: number): number
  getComparisonGroup(filters: RadarFilters): Promise<string[]>
  calculatePercentiles(playerValues: RadarCategoryData[], comparisonGroup: string[]): RadarCategoryData[]
}

interface RadarCategoryData {
  category: string
  playerValue: number
  comparisonAverage: number
  percentile: number
  rank: number
  totalPlayers: number
  maxValue: number
  minValue: number
}

interface RadarFilters {
  position?: string
  nationality?: string
  competition?: string
  ageMin?: number
  ageMax?: number
  ratingMin?: number
  ratingMax?: number
}
```

## Data Models

### Enhanced RadarMetrics Model

```typescript
model RadarMetrics {
  id              String   @id @default(cuid())
  playerId        String
  category        String   // One of the 9 categories
  playerValue     Float    // Calculated category value (0-100)
  period          String   // e.g., "2023-24"
  calculatedAt    DateTime @default(now())
  dataCompleteness Float   // Percentage of non-null source attributes
  sourceAttributes Json    // Array of attributes used in calculation
  
  // Comparison data (calculated on-demand)
  comparisonAverage Float?
  percentile        Float?
  rank             Int?
  totalPlayers     Int?
  
  player          Jugador  @relation(fields: [playerId], references: [id_player])
  
  @@unique([playerId, category, period])
  @@index([category, period])
}
```

### Data Population Tracking

```typescript
model DataPopulationLog {
  id          String   @id @default(cuid())
  playerId    String
  tableName   String   // "atributos" or "player_stats_3m"
  fieldName   String
  originalValue String? // "null" if was null
  populatedValue Float
  populationMethod String // "position_average", "league_average", etc.
  createdAt   DateTime @default(now())
  
  @@index([playerId, tableName])
}
```

## Error Handling

### Data Validation
- **Missing Player**: Return 404 with clear error message
- **Insufficient Data**: Calculate with available attributes, mark data completeness
- **Invalid Filters**: Return 400 with validation errors
- **Calculation Errors**: Log error, return default values with warning

### Fallback Strategies
- **No Atributos Data**: Use position-based averages for all categories
- **No Stats Data**: Calculate using only FMI attributes
- **Partial Data**: Weight calculations based on available data
- **Cache Miss**: Calculate on-demand and update cache

## Testing Strategy

### Unit Tests
- **Calculation Accuracy**: Test each category calculation with known inputs
- **Data Population**: Verify realistic values are generated for each position
- **Normalization**: Test value scaling and boundary conditions
- **Percentile Calculation**: Verify ranking accuracy with sample datasets

### Integration Tests
- **API Endpoints**: Test radar data retrieval with various filters
- **Database Operations**: Test caching and data population workflows
- **Component Integration**: Test React component with real API data

### Performance Tests
- **Calculation Speed**: Benchmark radar calculation for large player sets
- **Cache Efficiency**: Test cache hit rates and update performance
- **Concurrent Requests**: Test API performance under load

### Data Quality Tests
- **Sample Data Realism**: Verify generated data matches position expectations
- **Calculation Consistency**: Ensure same inputs always produce same outputs
- **Comparison Accuracy**: Verify percentiles and rankings are mathematically correct

## Implementation Phases

### Phase 1: Data Foundation
1. Create data population service
2. Populate null values in existing tables
3. Add data population logging
4. Create radar calculation service

### Phase 2: Core Calculation Engine
1. Implement 9 category calculation methods
2. Create normalization and weighting logic
3. Build comparison group filtering
4. Implement percentile calculations

### Phase 3: Caching and Performance
1. Update RadarMetrics table structure
2. Implement cache management service
3. Create batch calculation jobs
4. Add performance monitoring

### Phase 4: API and Frontend
1. Update radar API endpoints
2. Modify React radar component
3. Add new filtering options
4. Implement visual improvements

### Phase 5: Testing and Optimization
1. Comprehensive testing suite
2. Performance optimization
3. Data quality validation
4. User acceptance testing