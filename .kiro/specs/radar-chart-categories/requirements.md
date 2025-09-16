# Requirements Document

## Introduction

This feature implements a comprehensive radar chart system for player analysis that maps existing database attributes and statistics to 9 specific tactical categories. The radar chart will provide scouts and analysts with a visual representation of player performance across key tactical areas, enabling better player evaluation and comparison.

## Requirements

### Requirement 1

**User Story:** As a scout, I want to view a player's radar chart with 9 specific tactical categories, so that I can quickly assess their tactical profile and strengths.

#### Acceptance Criteria

1. WHEN viewing a player's profile THEN the radar chart SHALL display exactly 9 categories: "def stopped ball", "evitation", "recovery", "def transition", "off stopped ball", "maintenance", "progression", "finishing", "off transition"
2. WHEN the radar chart loads THEN each category SHALL show a value between 0-100 based on calculated metrics from the atributos and player_stats_3m tables
3. WHEN hovering over a radar point THEN the system SHALL display the exact value, percentile, and rank for that category
4. WHEN no data is available for a category THEN the system SHALL display 0 and indicate "No data available"

### Requirement 2

**User Story:** As a data analyst, I want the radar categories to be calculated from existing database attributes, so that the visualization reflects actual player performance data.

#### Acceptance Criteria

1. WHEN calculating "def stopped ball" THEN the system SHALL use attributes like corners_fmi, free_kick_taking_fmi, marking_fmi, and positioning_fmi
2. WHEN calculating "evitation" THEN the system SHALL use attributes like dribbling_fmi, agility_fmi, balance_fmi, and first_touch_fmi
3. WHEN calculating "recovery" THEN the system SHALL use attributes like tackling_fmi, interceptions_p90_3m, anticipation_fmi, and positioning_fmi
4. WHEN calculating "def transition" THEN the system SHALL use attributes like pace_fmi, acceleration_fmi, passing_fmi, and decisions_fmi
5. WHEN calculating "off stopped ball" THEN the system SHALL use attributes like crossing_fmi, corners_fmi, free_kick_taking_fmi, and heading_fmi
6. WHEN calculating "maintenance" THEN the system SHALL use attributes like passing_fmi, technique_fmi, composure_fmi, and accurate_passes_percent_3m
7. WHEN calculating "progression" THEN the system SHALL use attributes like forward_passes_p90_3m, vision_fmi, passing_fmi, and dribbling_fmi
8. WHEN calculating "finishing" THEN the system SHALL use attributes like finishing_fmi, goals_p90_3m, shots_p90_3m, and composure_fmi
9. WHEN calculating "off transition" THEN the system SHALL use attributes like pace_fmi, acceleration_fmi, off_the_ball_fmi, and anticipation_fmi

### Requirement 3

**User Story:** As a scout, I want to compare a specific player against all other players in the database, so that I can see how they perform relative to the entire player pool.

#### Acceptance Criteria

1. WHEN viewing a player's radar THEN the system SHALL compare the player against ALL players in the database by default
2. WHEN no filters are applied THEN the comparison group SHALL include every player with available data
3. WHEN filters are applied (position, nationality, competition, age, etc.) THEN the comparison group SHALL include only players matching those filters
4. WHEN displaying the radar THEN the target player SHALL be shown in one color (e.g., red) and the comparison average SHALL be shown in a different color (e.g., gray)
5. WHEN calculating percentiles THEN the system SHALL rank the player against the active comparison group

### Requirement 4

**User Story:** As a system administrator, I want all null values in the atributos and player_stats_3m tables to be populated with appropriate sample data, so that radar calculations work for all players.

#### Acceptance Criteria

1. WHEN a player has null values in the atributos table THEN the system SHALL populate those fields with realistic sample data based on the player's position
2. WHEN a player has null values in the player_stats_3m table THEN the system SHALL populate those fields with position-appropriate statistical averages
3. WHEN populating sample data THEN the values SHALL be realistic and consistent with the player's position, age, and league level
4. WHEN calculating radar categories THEN the system SHALL use the populated data to ensure no category shows as "No data available"
5. WHEN sample data is generated THEN it SHALL be marked or logged for future reference and potential replacement with real data

### Requirement 5

**User Story:** As a system administrator, I want the radar calculations to be consistent and maintainable, so that the system provides reliable player analysis.

#### Acceptance Criteria

1. WHEN calculating category values THEN the system SHALL normalize all inputs to a 0-100 scale before averaging
2. WHEN storing radar data THEN the system SHALL cache calculated values in the RadarMetrics table for performance
3. WHEN attribute data is updated THEN the system SHALL recalculate and update the cached radar values
4. WHEN displaying radar data THEN the system SHALL include metadata about calculation date and data completeness
5. WHEN multiple attributes contribute to a category THEN the system SHALL use weighted averages based on attribute importance

### Requirement 6

**User Story:** As a user, I want the radar chart to be visually clear and interactive, so that I can easily interpret player performance data.

#### Acceptance Criteria

1. WHEN viewing the radar chart THEN each category SHALL be clearly labeled with its Spanish name
2. WHEN the chart renders THEN the target player SHALL be displayed in red color and the comparison average in gray color
3. WHEN interacting with the chart THEN users SHALL be able to toggle between raw values and percentiles
4. WHEN viewing on mobile devices THEN the radar chart SHALL remain readable and interactive
5. WHEN printing or exporting THEN the radar chart SHALL maintain its visual clarity and color distinction between player and average