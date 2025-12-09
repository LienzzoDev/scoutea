export interface JobOffer {
  id: string
  title: string
  category?: string | null
  description: string
  short_description?: string | null

  // Ubicación y equipo
  team_id?: string | null
  team?: {
    id_team: string
    team_name: string
    logo_url?: string | null
    team_country?: string | null
  } | null
  club_name?: string | null
  custom_logo_url?: string | null
  location?: string | null
  remote_allowed: boolean

  // Detalles del trabajo
  position_type: string
  contract_type: string
  experience_level: string

  // Compensación
  salary_min?: number | null
  salary_max?: number | null
  salary_currency: string
  salary_period?: string | null

  // Requisitos
  requirements?: string | null
  responsibilities?: string | null
  benefits?: string | null

  // Estado y visibilidad
  status: JobOfferStatus
  expires_at?: Date | string | null

  // Información de contacto
  contact_email?: string | null
  contact_phone?: string | null
  application_url?: string | null

  // Auditoría
  created_by: string
  createdAt: Date | string
  updatedAt: Date | string

  // Estadísticas
  views_count: number
  applications_count: number
}

export type JobOfferStatus = 'draft' | 'published' | 'closed'

export type PositionType =
  | 'Scout'
  | 'Head Scout'
  | 'Chief Scout'
  | 'Scout Analyst'
  | 'Data Analyst'
  | 'Performance Analyst'
  | 'Technical Director'
  | 'Recruitment Director'
  | 'Other'

export type ContractType =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Freelance'
  | 'Internship'

export type ExperienceLevel =
  | 'Entry Level'
  | 'Junior'
  | 'Mid-Level'
  | 'Senior'
  | 'Lead'
  | 'Director'

export type SalaryPeriod = 'monthly' | 'yearly'

// Form types
export interface CreateJobOfferInput {
  title: string
  category?: string
  description: string
  short_description?: string
  team_id?: string
  club_name?: string
  custom_logo_url?: string
  location?: string
  remote_allowed?: boolean
  position_type: string
  contract_type: string
  experience_level: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  status?: JobOfferStatus
  expires_at?: Date | string
  contact_email?: string
  contact_phone?: string
  application_url?: string
}

export interface UpdateJobOfferInput extends Partial<CreateJobOfferInput> {
  id: string
}

// Filter types
export interface JobOfferFilters {
  status?: JobOfferStatus
  position_type?: string
  contract_type?: string
  experience_level?: string
  team_id?: string
  remote_allowed?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'title' | 'expires_at' | 'salary_min'
  sortOrder?: 'asc' | 'desc'
}

// Response types
export interface JobOffersResponse {
  jobOffers: JobOffer[]
  total: number
  page: number
  limit: number
  totalPages: number
}
