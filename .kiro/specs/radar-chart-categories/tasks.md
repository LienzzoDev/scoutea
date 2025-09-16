# Implementation Plan

- [ ] 1. Create data population service for filling null values
  - Create service to analyze current null values in atributos and player_stats_3m tables
  - Implement position-based sample data generation logic
  - Create data population logging system
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [-] 1.1 Analyze and document current null values in database
  - Write script to analyze null value patterns in atributos table by position
  - Write script to analyze null value patterns in player_stats_3m table by position
  - Generate report of data completeness by player and position
  - _Requirements: 4.1, 4.2_

- [ ] 1.2 Create position-based sample data generator
  - Implement AtributosDataGenerator class with position-specific value ranges
  - Implement PlayerStatsDataGenerator class with position-specific statistical averages
  - Create realistic value distribution algorithms based on position and league level
  - Write unit tests for data generation logic
  - _Requirements: 4.2, 4.3_

- [ ] 1.3 Implement data population service
  - Create DataPopulationService class with methods to populate null values
  - Implement batch processing for updating multiple players
  - Add logging functionality to track populated values
  - Create API endpoint for triggering data population
  - _Requirements: 4.1, 4.2, 4.5_

- [ ] 2. Create radar calculation service for 9 categories
  - Implement RadarCalculationService with methods for each of the 9 tactical categories
  - Create attribute mapping and weighting system
  - Implement value normalization and scaling logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 5.1, 5.5_

- [ ] 2.1 Implement core radar calculation methods
  - Create calculateDefStoppedBall method using marking, positioning, heading, jumping attributes
  - Create calculateEvitation method using dribbling, agility, balance, first_touch attributes
  - Create calculateRecovery method using tackling, anticipation, positioning, interceptions attributes
  - Write unit tests for each calculation method with known inputs
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2.2 Implement remaining radar calculation methods
  - Create calculateDefTransition method using pace, acceleration, stamina, work_rate attributes
  - Create calculateOffStoppedBall method using crossing, corners, free_kicks, heading attributes
  - Create calculateMaintenance method using passing, technique, composure, accurate_passes attributes
  - Write unit tests for each calculation method
  - _Requirements: 2.4, 2.5, 2.6_

- [ ] 2.3 Complete radar calculation methods
  - Create calculateProgression method using vision, passing, dribbling, forward_passes attributes
  - Create calculateFinishing method using finishing, composure, technique, goals, shots attributes
  - Create calculateOffTransition method using pace, acceleration, off_the_ball, anticipation attributes
  - Write comprehensive unit tests for all calculation methods
  - _Requirements: 2.7, 2.8, 2.9_

- [ ] 2.4 Implement value normalization and weighting system
  - Create normalizeValue method to scale attributes to 0-100 range
  - Implement weighted average calculation for multiple attributes per category
  - Create attribute importance weighting based on design specifications
  - Add error handling for missing or invalid attribute values
  - _Requirements: 5.1, 5.5_

- [ ] 3. Create comparison and percentile calculation system
  - Implement player comparison logic against filtered player groups
  - Create percentile calculation methods
  - Build filtering system for position, nationality, competition, age, rating
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3.1 Implement player comparison group filtering
  - Create getComparisonGroup method that filters players based on criteria
  - Implement position filtering with exact and similar position matching
  - Add nationality, competition, age range, and rating range filters
  - Write unit tests for filtering logic with various combinations
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3.2 Create percentile and ranking calculation
  - Implement calculatePercentiles method for ranking players within comparison groups
  - Create ranking calculation that handles tied values correctly
  - Add statistical methods for min, max, average calculations
  - Write unit tests for percentile accuracy with sample datasets
  - _Requirements: 3.4, 3.5_

- [ ] 4. Update database schema and caching system
  - Modify RadarMetrics table to support new category structure
  - Create DataPopulationLog table for tracking populated values
  - Implement caching service for radar calculations
  - _Requirements: 4.4, 4.5, 5.2, 5.3, 5.4_

- [ ] 4.1 Update database schema
  - Add new fields to RadarMetrics table for data completeness and source tracking
  - Create DataPopulationLog table with proper indexes
  - Update Prisma schema with new models and relationships
  - Generate and run database migrations
  - _Requirements: 4.5, 5.4_

- [ ] 4.2 Implement radar metrics caching service
  - Create RadarCacheService for managing cached radar calculations
  - Implement cache invalidation when player data is updated
  - Add batch calculation methods for updating multiple players
  - Create cache warming strategies for frequently accessed players
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 5. Update API endpoints for new radar system
  - Modify existing radar API endpoints to use new calculation system
  - Add support for the 9 specific categories
  - Implement filtering and comparison functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5.1 Update player radar API endpoint
  - Modify /api/players/[id]/radar/route.ts to use new RadarCalculationService
  - Implement the 9 category system replacing current categories
  - Add data completeness information to API response
  - Update error handling for missing data scenarios
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5.2 Update radar comparison API endpoint
  - Modify /api/players/[id]/radar/compare/route.ts for new comparison system
  - Implement filtering against all players by default
  - Add support for position, nationality, competition, age, rating filters
  - Update response format to include comparison averages and percentiles
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6. Update React radar component
  - Modify PlayerRadar component to display 9 specific categories
  - Update visual styling with player in red and average in gray
  - Add Spanish labels for all categories
  - Implement interactive features and filtering
  - _Requirements: 1.1, 1.3, 3.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.1 Update radar chart categories and labels
  - Replace current categories with the 9 specific tactical categories
  - Add Spanish labels: "Balón Parado Def.", "Evitación", "Recuperación", etc.
  - Update chart data structure to handle new category format
  - Ensure proper category ordering and display
  - _Requirements: 1.1, 6.1_

- [ ] 6.2 Implement new color scheme and visual styling
  - Update radar chart colors: player in red (#8c1a10), average in gray (#6d6d6d)
  - Ensure visual distinction between player and comparison data
  - Update hover tooltips to show percentile and rank information
  - Maintain responsive design for mobile devices
  - _Requirements: 6.2, 6.4, 6.5_

- [ ] 6.3 Add filtering and interaction features
  - Update filter controls for position, nationality, competition, age, rating
  - Implement real-time radar updates when filters change
  - Add toggle between raw values and percentiles
  - Update loading states and error handling
  - _Requirements: 1.3, 3.4, 6.3_

- [ ] 7. Create data population and calculation scripts
  - Write scripts to populate null values for existing players
  - Create batch calculation script for generating radar data
  - Implement data validation and quality checks
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7.1 Create data population script
  - Write script to identify and populate null values in atributos table
  - Create script to populate null values in player_stats_3m table
  - Implement dry-run mode for testing before actual population
  - Add progress tracking and logging for large batch operations
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 7.2 Create radar calculation batch script
  - Write script to calculate and cache radar data for all players
  - Implement incremental updates for players with changed data
  - Add data quality validation and reporting
  - Create scheduling capability for regular updates
  - _Requirements: 4.4, 5.2, 5.3, 5.4_

- [ ] 8. Implement comprehensive testing suite
  - Create unit tests for all calculation methods
  - Write integration tests for API endpoints
  - Add component tests for React radar chart
  - Implement data quality validation tests
  - _Requirements: All requirements validation_

- [ ] 8.1 Create unit tests for calculation services
  - Write tests for each of the 9 radar category calculations
  - Test data population logic with various player positions
  - Test normalization and weighting algorithms
  - Add edge case testing for missing or invalid data
  - _Requirements: 2.1-2.9, 4.1-4.3, 5.1, 5.5_

- [ ] 8.2 Create integration and component tests
  - Write API endpoint tests for radar data retrieval
  - Test filtering and comparison functionality
  - Create React component tests for radar chart rendering
  - Add end-to-end tests for complete user workflows
  - _Requirements: 1.1-1.4, 3.1-3.5, 6.1-6.5_

- [ ] 9. Performance optimization and monitoring
  - Optimize database queries for radar calculations
  - Implement performance monitoring for API endpoints
  - Add caching strategies for frequently accessed data
  - Create monitoring dashboards for system health
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 9.1 Optimize database performance
  - Add database indexes for radar calculation queries
  - Optimize comparison group filtering queries
  - Implement query result caching for expensive operations
  - Add database connection pooling and query optimization
  - _Requirements: 5.2, 5.3_

- [ ] 9.2 Add monitoring and logging
  - Implement performance monitoring for radar calculations
  - Add logging for data population and cache operations
  - Create health check endpoints for system monitoring
  - Add error tracking and alerting for production issues
  - _Requirements: 5.4_