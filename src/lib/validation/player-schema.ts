// 🛡️ ESQUEMAS DE VALIDACIÓN CON ZOD - ENHANCED SECURITY
// ✅ PROPÓSITO: Validar que los datos enviados sean correctos y seguros
// ✅ BENEFICIO: Previene errores, ataques maliciosos y datos corruptos
// ✅ RESULTADO: Mensajes de error más claros, app más segura
// 🚀 NUEVO: Validación mejorada con sanitización y prevención de inyecciones

import { z } from 'zod'

import { NATIONALITIES } from '@/constants/nationalities'

// 🛡️ ENHANCED SECURITY PATTERNS
const SECURITY_PATTERNS = {
  // SQL Injection patterns
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|(\b(OR|AND)\s+\d+\s*=\s*\d+)|('|(\\')|(;)|(--)|(\|)|(\*)|(%)|(\+)|(=))/i,
  
  // XSS patterns
  XSS_SCRIPT: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  XSS_IFRAME: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  XSS_JAVASCRIPT: /javascript:/i,
  XSS_EVENTS: /on\w+\s*=/i,
  
  // Path traversal
  PATH_TRAVERSAL: /\.\.\//,
  
  // Command injection
  COMMAND_INJECTION: /[;&|`$(){}[\]]/,
  
  // NoSQL injection
  NOSQL_INJECTION: /\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex/i
}

// 🛡️ SECURITY VALIDATION HELPER
const createSecureString = (minLength: number, maxLength: number, pattern?: RegExp, errorMessage?: string) => {
  return z
    .string()
    .min(minLength, `Debe tener al menos ${minLength} caracteres`)
    .max(maxLength, `No puede exceder ${maxLength} caracteres`)
    .refine(
      (val) => !SECURITY_PATTERNS.SQL_INJECTION.test(val),
      'Contiene patrones de inyección SQL no permitidos'
    )
    .refine(
      (val) => !SECURITY_PATTERNS.XSS_SCRIPT.test(val) && 
               !SECURITY_PATTERNS.XSS_IFRAME.test(val) && 
               !SECURITY_PATTERNS.XSS_JAVASCRIPT.test(val) && 
               !SECURITY_PATTERNS.XSS_EVENTS.test(val),
      'Contiene patrones XSS no permitidos'
    )
    .refine(
      (val) => !SECURITY_PATTERNS.PATH_TRAVERSAL.test(val),
      'Contiene patrones de path traversal no permitidos'
    )
    .refine(
      (val) => !SECURITY_PATTERNS.COMMAND_INJECTION.test(val),
      'Contiene caracteres de inyección de comandos no permitidos'
    )
    .refine(
      (val) => !SECURITY_PATTERNS.NOSQL_INJECTION.test(val),
      'Contiene patrones de inyección NoSQL no permitidos'
    )
    .refine(
      (val) => pattern ? pattern.test(val) : true,
      errorMessage || 'Formato no válido'
    )
    .transform((val) => val.trim()) // Always trim whitespace
}

// 🎯 ========== VALIDACIONES BÁSICAS REUTILIZABLES ==========

// 📝 VALIDACIÓN DE NOMBRE DE JUGADOR - ENHANCED SECURITY
const playerNameSchema = createSecureString(
  2, 
  100, 
  /^[a-zA-ZÀ-ÿ\u0100-\u017F\s\-'\.]+$/, 
  'El nombre solo puede contener letras, espacios, guiones y apostrofes'
)

// 🎂 VALIDACIÓN DE EDAD
const ageSchema = z
  .number()
  .int('La edad debe ser un número entero')
  .min(16, 'La edad mínima es 16 años')
  .max(50, 'La edad máxima es 50 años')

// ⭐ VALIDACIÓN DE RATING
const ratingSchema = z
  .number()
  .min(0, 'El rating mínimo es 0')
  .max(100, 'El rating máximo es 100')

// 📏 VALIDACIÓN DE ALTURA
const heightSchema = z
  .number()
  .int('La altura debe ser un número entero')
  .min(150, 'La altura mínima es 150 cm')
  .max(220, 'La altura máxima es 220 cm')

// 🦶 VALIDACIÓN DE PIE DOMINANTE
const footSchema = z.enum(['Left', 'Right', 'Both'], {
  message: 'El pie debe ser Left, Right o Both'
})

// 🎯 VALIDACIÓN DE POSICIÓN - ENHANCED SECURITY
const positionSchema = createSecureString(
  1, 
  10, 
  /^[A-Z]{1,3}[A-Z\-]*$/, 
  'La posición debe usar códigos válidos (ej: CF, CM, CB)'
)

// 🌍 VALIDACIÓN DE NACIONALIDAD - ENHANCED SECURITY
const nationalitySchema = z.enum(NATIONALITIES, {
  errorMap: () => ({ message: 'Nacionalidad no válida. Seleccione una de la lista estandarizada.' })
});

// ⚽ VALIDACIÓN DE NOMBRE DE EQUIPO - ENHANCED SECURITY
const teamNameSchema = createSecureString(
  2, 
  100, 
  /^[a-zA-ZÀ-ÿ\u0100-\u017F0-9\s\-'\.&]+$/, 
  'El nombre del equipo solo puede contener letras, números, espacios, guiones, apostrofes, puntos y &'
)

// 📅 VALIDACIÓN DE FECHA - Acepta YYYY-MM-DD o ISO string
const dateStringSchema = z
  .string()
  .refine((date) => {
    // Acepta formato YYYY-MM-DD o ISO string completo
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }, 'La fecha debe ser válida')
  .transform((date) => {
    // Normalizar a YYYY-MM-DD si viene como ISO
    if (date.includes('T')) {
      return date.split('T')[0]
    }
    return date
  })

// 🔗 VALIDACIÓN DE URL
const urlSchema = z
  .string()
  .url('Debe ser una URL válida')
  .max(500, 'La URL no puede exceder 500 caracteres')

// 📧 ========== ESQUEMAS PRINCIPALES ==========

/**
 * 📝 ESQUEMA PARA CREAR NUEVO JUGADOR
 * 
 * ✅ QUÉ VALIDA: Todos los campos necesarios para crear un jugador
 * ✅ POR QUÉ: Asegurar que los datos mínimos estén presentes y sean válidos
 * ✅ USO: En POST /api/players
 */
export const PlayerCreateSchema = z.object({
  // 🆔 CAMPOS OBLIGATORIOS
  player_name: playerNameSchema,
  
  // 👤 INFORMACIÓN PERSONAL (OPCIONAL)
  complete_player_name: z.string().max(150).optional(),
  date_of_birth: dateStringSchema.optional(),
  age: ageSchema.optional(),
  nationality_1: nationalitySchema.optional(),
  nationality_2: nationalitySchema.optional(),

  // 🔗 IDs DE PLATAFORMAS EXTERNAS (OPCIONAL)
  wyscout_id_1: z.string().max(50).optional(),
  wyscout_id_2: z.string().max(50).optional(),
  wyscout_name_1: z.string().max(500).optional(),
  wyscout_name_2: z.string().max(500).optional(),
  wyscout_notes: z.string().max(500).optional(),
  fmi_notes: z.string().max(500).optional(),
  id_fmi: z.string().max(50).optional(),

  // 🏃‍♂️ ATRIBUTOS FÍSICOS (OPCIONAL)
  height: heightSchema.optional(),
  foot: footSchema.optional(),
  position_player: positionSchema.optional(),
  
  // ⚽ INFORMACIÓN DE EQUIPO (OPCIONAL)
  team_name: teamNameSchema.optional(),
  team_country: z.string().max(100).optional(),
  team_competition: z.string().max(100).optional(),
  
  // 📊 MÉTRICAS (OPCIONAL)
  player_rating: ratingSchema.optional(),
  player_elo: z.number().min(0).max(3000).optional(),
  player_ranking: z.number().int().min(1).optional(),
  
  // 📄 CONTRATO (OPCIONAL)
  contract_end: dateStringSchema.optional(),
  on_loan: z.boolean().optional(),
  agency: z.string().max(100).optional(),
  
  // 🔗 ENLACES (OPCIONAL)
  url_trfm: urlSchema.optional(),
  url_instagram: urlSchema.optional(),
  video: urlSchema.optional(),

  // 📝 NOTAS Y ORGANIZACIÓN (OPCIONAL)
  admin_notes: z.string().max(5000).optional(),
  player_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (ej: #FF5733)').optional()
}).strict() // No permitir campos adicionales

/**
 * 🇪🇸 ESQUEMA PARA CREAR JUGADOR DESDE FORMULARIO ADMIN (CAMPOS EN ESPAÑOL)
 *
 * ✅ QUÉ VALIDA: Campos del formulario de admin con nombres en español
 * ✅ POR QUÉ: El formulario de admin usa nombres de campos en español
 * ✅ USO: En POST /api/players desde el panel de admin
 * ✅ TRANSFORMACIÓN: Convierte campos español -> inglés
 */
export const AdminPlayerCreateSchema = z.object({
  // 🆔 CAMPOS OBLIGATORIOS (español)
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  equipo: z.string().min(1, 'El equipo es requerido').max(100),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),

  // 👤 INFORMACIÓN PERSONAL (OPCIONAL)
  posicion: z.string().max(20).optional(),
  nationality: z.string().max(100).optional(),
  nationality_2: z.string().max(100).optional(),

  // 🏃‍♂️ ATRIBUTOS FÍSICOS (OPCIONAL)
  height: z.number().int().min(140).max(230).optional(),
  weight: z.number().int().min(40).max(150).optional(),

  // 💰 INFORMACIÓN CONTRACTUAL (OPCIONAL)
  player_trfm_value: z.number().min(0).optional(),
  on_loan: z.boolean().optional(),
  owner_club: z.string().max(100).optional(),
  national_tier: z.string().max(100).optional(),
  contract_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional().or(z.literal('')),

  // 🔗 ENLACES (OPCIONAL)
  url_instagram: z.string().url().optional().or(z.literal('')),
  url_secondary: z.string().url().optional().or(z.literal(''))
}).transform(data => ({
  // Transformar campos español -> inglés
  player_name: data.nombre,
  team_name: data.equipo,
  date_of_birth: data.fecha_nacimiento,
  position_player: data.posicion,
  nationality_1: data.nationality,
  nationality_2: data.nationality_2,
  height: data.height,
  weight: data.weight,
  player_trfm_value: data.player_trfm_value,
  on_loan: data.on_loan,
  owner_club: data.owner_club,
  national_tier: data.national_tier,
  contract_end: data.contract_end || undefined,
  url_instagram: data.url_instagram || undefined,
  url_secondary: data.url_secondary || undefined
}))

// 🔄 Schema flexible para nacionalidad (acepta valores de la lista o strings vacíos/null)
const flexibleNationalitySchema = z.union([
  z.enum(NATIONALITIES),
  z.literal(''),
  z.null()
]).optional().transform(val => val === '' ? null : val)

// 📅 Schema flexible para fechas (acepta null)
const flexibleDateSchema = z.union([
  dateStringSchema,
  z.null(),
  z.literal('')
]).optional().transform(val => val === '' ? null : val)

// 🔗 Schema flexible para URLs (acepta null o strings vacíos)
const flexibleUrlSchema = z.union([
  urlSchema,
  z.null(),
  z.literal('')
]).optional().transform(val => val === '' ? null : val)

/**
 * ✏️ ESQUEMA PARA ACTUALIZAR JUGADOR EXISTENTE
 *
 * ✅ QUÉ VALIDA: Campos que se pueden actualizar (todos opcionales)
 * ✅ POR QUÉ: Permitir actualizaciones parciales sin requerir todos los campos
 * ✅ USO: En PUT /api/players/[id]
 * ✅ NOTA: Más flexible que PlayerCreateSchema para aceptar datos del formulario de edición
 */
export const PlayerUpdateSchema = z.object({
  // 🆔 CAMPOS BÁSICOS
  player_name: z.string().min(1).max(100).optional(),
  complete_player_name: z.string().max(150).nullable().optional(),

  // 👤 INFORMACIÓN PERSONAL
  date_of_birth: flexibleDateSchema,
  age: z.number().int().min(14).max(50).nullable().optional(),
  nationality_1: flexibleNationalitySchema,
  nationality_2: flexibleNationalitySchema,

  // 🏃‍♂️ ATRIBUTOS FÍSICOS
  height: z.number().int().min(140).max(230).nullable().optional(),
  weight: z.number().int().min(40).max(150).nullable().optional(),
  foot: z.enum(['Left', 'Right', 'Both']).nullable().optional(),
  position_player: z.string().max(20).nullable().optional(),

  // ⚽ INFORMACIÓN DE EQUIPO
  team_name: z.string().max(100).nullable().optional(),
  team_country: z.string().max(100).nullable().optional(),
  team_competition: z.string().max(100).nullable().optional(),

  // 📊 MÉTRICAS
  player_rating: z.number().min(0).max(100).nullable().optional(),
  player_elo: z.number().min(0).max(3000).nullable().optional(),
  player_ranking: z.number().int().min(1).nullable().optional(),
  player_trfm_value: z.number().min(0).nullable().optional(),

  // 📄 CONTRATO
  contract_end: flexibleDateSchema,
  on_loan: z.boolean().nullable().optional(),
  agency: z.string().max(100).nullable().optional(),
  owner_club: z.string().max(100).nullable().optional(),
  national_tier: z.string().max(100).nullable().optional(),

  // 🔗 ENLACES
  url_trfm: flexibleUrlSchema,
  url_trfm_advisor: flexibleUrlSchema,
  url_instagram: flexibleUrlSchema,
  url_image: flexibleUrlSchema,
  video: flexibleUrlSchema,

  // 📝 NOTAS Y ORGANIZACIÓN
  admin_notes: z.string().max(5000).nullable().optional(),
  player_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),

  // 🔗 IDs DE PLATAFORMAS EXTERNAS
  wyscout_id_1: z.string().max(50).nullable().optional(),
  wyscout_id_2: z.string().max(50).nullable().optional(),
  wyscout_name_1: z.string().max(500).nullable().optional(),
  wyscout_name_2: z.string().max(500).nullable().optional(),
  wyscout_notes: z.string().max(500).nullable().optional(),
  fmi_notes: z.string().max(500).nullable().optional(),
  id_fmi: z.string().max(50).nullable().optional()
}).passthrough() // Permitir campos adicionales que no están en el schema

/**
 * 🔍 ESQUEMA PARA BÚSQUEDA Y FILTROS
 * 
 * ✅ QUÉ VALIDA: Parámetros de búsqueda, paginación y filtros
 * ✅ POR QUÉ: Prevenir consultas maliciosas y asegurar parámetros válidos
 * ✅ USO: En GET /api/players
 */
export const PlayerSearchSchema = z.object({
  // 📄 PAGINACIÓN
  page: z
    .string()
    .regex(/^\d+$/, 'La página debe ser un número')
    .transform(Number)
    .refine(n => n >= 1, 'La página debe ser mayor a 0')
    .default(1),
    
  limit: z
    .string()
    .regex(/^\d+$/, 'El límite debe ser un número')
    .transform(Number)
    .refine(n => n >= 1 && n <= 100, 'El límite debe estar entre 1 y 100')
    .default(20),
  
  // 📈 ORDENAMIENTO
  sortBy: z
    .enum([
      'player_name', 
      'age', 
      'player_rating', 
      'createdAt', 
      'team_name',
      'position_player',
      'nationality_1'
    ])
    .default('player_name'),
    
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),
  
  // 🔍 FILTROS (TODOS OPCIONALES)
  'filters[player_name]': z.string().min(1).max(100).optional(),
  'filters[position_player]': positionSchema.optional(),
  'filters[team_name]': z.string().min(1).max(100).optional(),
  'filters[nationality_1]': nationalitySchema.optional(),
  'filters[min_age]': z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 16 && n <= 50).optional(),
  'filters[max_age]': z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 16 && n <= 50).optional(),
  'filters[min_rating]': z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(n => n >= 0 && n <= 100).optional(),
  'filters[max_rating]': z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(n => n >= 0 && n <= 100).optional(),
  'filters[on_loan]': z.enum(['true', 'false']).transform(val => val === 'true').optional()
}).strict()

/**
 * 🆔 ESQUEMA PARA VALIDAR ID DE JUGADOR
 * 
 * ✅ QUÉ VALIDA: Que el ID tenga formato válido
 * ✅ POR QUÉ: Prevenir inyecciones y asegurar formato correcto
 * ✅ USO: En rutas con parámetro [id]
 */
export const PlayerIdSchema = z.object({
  id: z
    .string()
    .min(1, 'El ID no puede estar vacío')
    .max(50, 'El ID no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El ID solo puede contener letras, números, guiones y guiones bajos')
})

// 🔧 ========== ESQUEMAS DE UTILIDAD ==========

/**
 * 📊 ESQUEMA PARA VALIDAR PARÁMETROS DE ESTADÍSTICAS
 * 
 * ✅ QUÉ VALIDA: Filtros opcionales para estadísticas
 * ✅ USO: En GET /api/players/stats
 */
export const PlayerStatsSchema = z.object({
  _period: z.enum(['week', 'month', 'year', 'all']).default('all'),
  position: positionSchema.optional(),
  nationality: nationalitySchema.optional()
}).strict()

/**
 * 🔧 ESQUEMA PARA VALIDAR PARÁMETROS DE FILTROS DISPONIBLES
 * 
 * ✅ QUÉ VALIDA: Opciones para obtener filtros disponibles
 * ✅ USO: En GET /api/players/filters
 */
export const AvailableFiltersSchema = z.object({
  include_counts: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  min_count: z.string().regex(/^\d+$/).default('1').transform(Number)
}).strict()

// 📤 ========== FUNCIONES DE VALIDACIÓN ==========

/**
 * 🛡️ FUNCIÓN PARA VALIDAR DATOS DE CREACIÓN
 * 
 * ✅ QUÉ HACE: Valida y transforma datos para crear jugador
 * ✅ RETORNA: Datos validados o lanza error con detalles
 */
export function validatePlayerCreate(data: unknown) {
  try {
    return PlayerCreateSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // 📋 FORMATEAR ERRORES DE VALIDACIÓN
      const formattedErrors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: (err as any).input
      }))
      
      throw new Error(`Datos de creación inválidos: ${JSON.stringify(formattedErrors)}`)
    }
    throw error
  }
}

/**
 * 🛡️ FUNCIÓN PARA VALIDAR DATOS DE ACTUALIZACIÓN
 */
export function validatePlayerUpdate(data: unknown) {
  try {
    return PlayerUpdateSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: (err as any).input
      }))
      
      throw new Error(`Datos de actualización inválidos: ${JSON.stringify(formattedErrors)}`)
    }
    throw error
  }
}

/**
 * 🛡️ FUNCIÓN PARA VALIDAR PARÁMETROS DE BÚSQUEDA
 */
export function validatePlayerSearch(params: unknown) {
  try {
    return PlayerSearchSchema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: (err as any).input
      }))
      
      throw new Error(`Parámetros de búsqueda inválidos: ${JSON.stringify(formattedErrors)}`)
    }
    throw error
  }
}

/**
 * 🛡️ FUNCIÓN PARA VALIDAR ID DE JUGADOR
 */
export function validatePlayerId(id: unknown) {
  try {
    return PlayerIdSchema.parse({ id }).id
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`ID de jugador inválido: ${error.issues[0]?.message}`)
    }
    throw error
  }
}

// 📤 EXPORTACIONES ADICIONALES (ya exportados arriba individualmente)

// 🎯 TIPOS INFERIDOS DE LOS ESQUEMAS
export type ValidatedPlayerCreate = z.infer<typeof PlayerCreateSchema>
export type ValidatedPlayerUpdate = z.infer<typeof PlayerUpdateSchema>
export type ValidatedPlayerSearch = z.infer<typeof PlayerSearchSchema>
export type ValidatedPlayerId = z.infer<typeof PlayerIdSchema>

// 📝 MENSAJES DE ERROR PERSONALIZADOS
export const ValidationErrors = {
  INVALID_PLAYER_NAME: 'El nombre del jugador no es válido',
  INVALID_AGE: 'La edad debe estar entre 16 y 50 años',
  INVALID_RATING: 'El rating debe estar entre 0 y 100',
  INVALID_POSITION: 'La posición debe usar códigos válidos',
  INVALID_DATE: 'La fecha debe tener formato YYYY-MM-DD',
  INVALID_URL: 'La URL no es válida',
  INVALID_ID: 'El ID del jugador no es válido'
} as const