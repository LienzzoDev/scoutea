/**
 * Catálogos usados por los desplegables del formulario de alta/edición de torneos
 * en el panel admin. Compartidos entre `/admin/torneos/nuevo-torneo` y
 * `/admin/torneos/[id]/editar` para evitar duplicar las listas.
 */

export const TOURNAMENT_MODES = ['Clubs', 'National', 'Mixed'] as const
export type TournamentMode = (typeof TOURNAMENT_MODES)[number]

export const TOURNAMENT_REGIONS = [
  'AFC',
  'CAF',
  'Concacaf',
  'Conmebol',
  'OFC',
  'UEFA',
  'World',
] as const
export type TournamentRegion = (typeof TOURNAMENT_REGIONS)[number]

export const TOURNAMENT_CATEGORIES = [
  'U12',
  'U13',
  'U14',
  'U15',
  'U16',
  'U17',
  'U18',
  'U19',
  'U20',
  'U21',
  'U22',
  'U23',
  'Senior',
] as const
export type TournamentCategory = (typeof TOURNAMENT_CATEGORIES)[number]
