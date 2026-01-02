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
