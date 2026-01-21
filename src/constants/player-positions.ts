export const PLAYER_POSITIONS = [
  'Goalkeeper',
  'Defender',
  'Sweeper',
  'Right-Back',
  'Centre-Back',
  'Left-Back',
  'Midfield',
  'Defensive Midfield',
  'Right Midfield',
  'Central Midfield',
  'Left Midfield',
  'Attacking Midfield',
  'Attack',
  'Second Striker',
  'Right Winger',
  'Centre-Forward',
  'Left Winger'
] as const;

export type PlayerPosition = typeof PLAYER_POSITIONS[number];

export const LATERALITY_OPTIONS = [
  { value: 'right', label: 'Diestro' },
  { value: 'left', label: 'Zurdo' },
  { value: 'both', label: 'Ambidiestro' }
] as const;

export type Laterality = typeof LATERALITY_OPTIONS[number]['value'];
