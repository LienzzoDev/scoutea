/**
 * API Validation Schemas
 * 
 * Comprehensive Zod schemas for all API endpoints to ensure type safety
 * and input validation across the application.
 */

import { z } from 'zod'

// Common validation patterns
const _positiveInteger = z.number().int().positive()
const nonEmptyString = z.string().min(1).trim()
const _optionalString = z.string().optional()
const email = z.string().email()
const url = z.string().url()

// Player-related schemas
export const PlayerSearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long')
    .regex(/^[a-zA-Z0-9\s\-'\.]+$/, 'Invalid characters in search query'),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD', 'goalkeeper', 'defender', 'midfielder', 'forward']).optional(),
  team: z.string().max(100).optional(),
  nationality: z.string().max(50).optional(),
  ageMin: z.number().int().min(16).max(50).optional(),
  ageMax: z.number().int().min(16).max(50).optional(),
  competition: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
}).refine(data => {
  if (data.ageMin && data.ageMax) {
    return data.ageMin <= data.ageMax
  }
  return true
}, {
  message: 'Minimum age must be less than or equal to maximum age',
  path: ['ageMin']
})

export const PlayerCreateSchema = z.object({
  player_name: nonEmptyString
    .min(2, 'Player name must be at least 2 characters')
    .max(100, 'Player name too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Player name contains invalid characters'),
  position_player: nonEmptyString
    .min(2, 'Position is required')
    .max(50, 'Position name too long'),
  age: z.number()
    .int('Age must be a whole number')
    .min(16, 'Player must be at least 16 years old')
    .max(50, 'Player age seems unrealistic'),
  team_name: z.string()
    .max(100, 'Team name too long')
    .optional(),
  nationality_1: z.string()
    .max(50, 'Nationality name too long')
    .optional(),
  height: z.number()
    .min(150, 'Height seems too low')
    .max(220, 'Height seems too high')
    .optional(),
  weight: z.number()
    .min(50, 'Weight seems too low')
    .max(120, 'Weight seems too high')
    .optional(),
  foot: z.enum(['Left', 'Right', 'Both']).optional(),
  photo_coverage: url.optional()
})

export const PlayerUpdateSchema = PlayerCreateSchema.partial().extend({
  id: nonEmptyString
})

export const PlayerFiltersSchema = z.object({
  position: z.string().optional(),
  team: z.string().optional(),
  nationality: z.string().optional(),
  competition: z.string().optional(),
  ageMin: z.number().int().min(16).max(50).optional(),
  ageMax: z.number().int().min(16).max(50).optional(),
  heightMin: z.number().min(150).max(220).optional(),
  heightMax: z.number().min(150).max(220).optional(),
  search: z.string().max(100).optional()
})

// Team-related schemas
export const TeamCreateSchema = z.object({
  team_name: nonEmptyString
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name too long'),
  competition: z.string()
    .max(100, 'Competition name too long')
    .optional(),
  country: z.string()
    .max(50, 'Country name too long')
    .optional(),
  logo_url: url.optional()
})

export const TeamUpdateSchema = TeamCreateSchema.partial().extend({
  id: nonEmptyString
})

// Competition/Tournament schemas
export const CompetitionCreateSchema = z.object({
  name: nonEmptyString
    .min(2, 'Competition name must be at least 2 characters')
    .max(100, 'Competition name too long'),
  country: z.string()
    .max(50, 'Country name too long')
    .optional(),
  season: z.string()
    .regex(/^\d{4}(-\d{4})?$/, 'Season must be in format YYYY or YYYY-YYYY')
    .optional(),
  level: z.number().int().min(1).max(10).optional()
})

export const CompetitionUpdateSchema = CompetitionCreateSchema.partial().extend({
  id: nonEmptyString
})

// User-related schemas
export const UserProfileUpdateSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .optional(),
  email: email.optional(),
  organization: z.string()
    .max(100, 'Organization name too long')
    .optional(),
  role: z.enum(['scout', 'coach', 'analyst', 'director', 'other']).optional()
})

// Report schemas
export const ReportCreateSchema = z.object({
  playerId: nonEmptyString,
  title: nonEmptyString
    .min(5, 'Report title must be at least 5 characters')
    .max(200, 'Report title too long'),
  content: nonEmptyString
    .min(10, 'Report content must be at least 10 characters')
    .max(10000, 'Report content too long'),
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(10, 'Rating cannot exceed 10')
    .optional(),
  tags: z.array(z.string().max(50)).max(10).optional()
})

export const ReportUpdateSchema = ReportCreateSchema.partial().extend({
  id: nonEmptyString
})

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  }).optional()
})

// File upload schemas
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp'])
})

// Radar comparison schema
export const RadarComparisonSchema = z.object({
  playerIds: z.array(nonEmptyString)
    .min(2, 'At least 2 players required for comparison')
    .max(4, 'Maximum 4 players can be compared'),
  metrics: z.array(z.string()).optional(),
  season: z.string().optional()
})

// Export type inference helpers
export type PlayerSearchInput = z.infer<typeof PlayerSearchSchema>
export type PlayerCreateInput = z.infer<typeof PlayerCreateSchema>
export type PlayerUpdateInput = z.infer<typeof PlayerUpdateSchema>
export type PlayerFiltersInput = z.infer<typeof PlayerFiltersSchema>
export type TeamCreateInput = z.infer<typeof TeamCreateSchema>
export type TeamUpdateInput = z.infer<typeof TeamUpdateSchema>
export type CompetitionCreateInput = z.infer<typeof CompetitionCreateSchema>
export type CompetitionUpdateInput = z.infer<typeof CompetitionUpdateSchema>
export type UserProfileUpdateInput = z.infer<typeof UserProfileUpdateSchema>
export type ReportCreateInput = z.infer<typeof ReportCreateSchema>
export type ReportUpdateInput = z.infer<typeof ReportUpdateSchema>
export type PaginationInput = z.infer<typeof PaginationSchema>
export type RadarComparisonInput = z.infer<typeof RadarComparisonSchema>

// Validation helper functions
export function validatePlayerSearch(data: unknown): PlayerSearchInput {
  return PlayerSearchSchema.parse(data)
}

export function validatePlayerCreate(data: unknown): PlayerCreateInput {
  return PlayerCreateSchema.parse(data)
}

export function validatePlayerUpdate(data: unknown): PlayerUpdateInput {
  return PlayerUpdateSchema.parse(data)
}

export function validateTeamCreate(data: unknown): TeamCreateInput {
  return TeamCreateSchema.parse(data)
}

export function validateCompetitionCreate(data: unknown): CompetitionCreateInput {
  return CompetitionCreateSchema.parse(data)
}

export function validateUserProfileUpdate(data: unknown): UserProfileUpdateInput {
  return UserProfileUpdateSchema.parse(data)
}

export function validateReportCreate(data: unknown): ReportCreateInput {
  return ReportCreateSchema.parse(data)
}

export function validatePagination(data: unknown): PaginationInput {
  return PaginationSchema.parse(data)
}

export function validateRadarComparison(data: unknown): RadarComparisonInput {
  return RadarComparisonSchema.parse(data)
}