import { z } from 'zod'

// Schema para crear una oferta de trabajo
export const createJobOfferSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(200, 'El título es demasiado largo'),
  description: z.string().min(50, 'La descripción debe tener al menos 50 caracteres'),
  short_description: z.string().max(500, 'La descripción corta es demasiado larga').optional(),

  team_id: z.string().optional(),
  location: z.string().max(200, 'La ubicación es demasiado larga').optional(),
  remote_allowed: z.boolean().default(false),

  position_type: z.string().optional(),
  contract_type: z.string().optional(),
  experience_level: z.string().optional(),

  salary_min: z.number().min(0, 'El salario mínimo no puede ser negativo').optional(),
  salary_max: z.number().min(0, 'El salario máximo no puede ser negativo').optional(),
  salary_currency: z.string().length(3, 'El código de moneda debe tener 3 caracteres').default('EUR'),
  salary_period: z.enum(['monthly', 'yearly']).optional(),

  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),

  status: z.enum(['draft', 'published', 'closed']).default('draft'),
  expires_at: z.string().datetime().optional().or(z.date().optional()),

  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
  contact_phone: z.string().max(50, 'El teléfono es demasiado largo').optional(),
  application_url: z.string().url('La URL debe ser válida').min(1, 'La URL de la oferta es requerida'),
})

// Schema para actualizar una oferta de trabajo
export const updateJobOfferSchema = createJobOfferSchema.partial().extend({
  id: z.string().cuid(),
})

// Schema para filtros de búsqueda
export const jobOfferFiltersSchema = z.object({
  status: z.enum(['draft', 'published', 'closed']).optional(),
  position_type: z.string().optional(),
  contract_type: z.string().optional(),
  experience_level: z.string().optional(),
  team_id: z.string().optional(),
  remote_allowed: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'title', 'expires_at', 'salary_min']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Types exportados desde los schemas
export type CreateJobOfferInput = z.infer<typeof createJobOfferSchema>
export type UpdateJobOfferInput = z.infer<typeof updateJobOfferSchema>
export type JobOfferFilters = z.infer<typeof jobOfferFiltersSchema>
