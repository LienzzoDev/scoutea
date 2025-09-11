// 🛡️ ESQUEMAS DE VALIDACIÓN CON ZOD
// ✅ PROPÓSITO: Validar que los datos enviados sean correctos y seguros
// ✅ BENEFICIO: Previene errores, ataques maliciosos y datos corruptos
// ✅ RESULTADO: Mensajes de error más claros, app más segura

import { z } from 'zod'

// 🎯 ========== VALIDACIONES BÁSICAS REUTILIZABLES ==========

// 📝 VALIDACIÓN DE NOMBRE DE JUGADOR
const playerNameSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede exceder 100 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\u0100-\u017F\s\-'\.]+$/, 'El nombre solo puede contener letras, espacios, guiones y apostrofes')

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
  errorMap: () => ({ message: 'El pie debe ser Left, Right o Both' })
})

// 🎯 VALIDACIÓN DE POSICIÓN
const positionSchema = z
  .string()
  .min(1, 'La posición no puede estar vacía')
  .max(10, 'La posición no puede exceder 10 caracteres')
  .regex(/^[A-Z]{1,3}[A-Z\-]*$/, 'La posición debe usar códigos válidos (ej: CF, CM, CB)')

// 🌍 VALIDACIÓN DE NACIONALIDAD
const nationalitySchema = z
  .string()
  .min(2, 'La nacionalidad debe tener al menos 2 caracteres')
  .max(50, 'La nacionalidad no puede exceder 50 caracteres')

// ⚽ VALIDACIÓN DE NOMBRE DE EQUIPO
const teamNameSchema = z
  .string()
  .min(2, 'El nombre del equipo debe tener al menos 2 caracteres')
  .max(100, 'El nombre del equipo no puede exceder 100 caracteres')

// 📅 VALIDACIÓN DE FECHA
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
  .refine((date) => {
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }, 'La fecha debe ser válida')

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
  video: urlSchema.optional()
}).strict() // No permitir campos adicionales

/**
 * ✏️ ESQUEMA PARA ACTUALIZAR JUGADOR EXISTENTE
 * 
 * ✅ QUÉ VALIDA: Campos que se pueden actualizar (todos opcionales)
 * ✅ POR QUÉ: Permitir actualizaciones parciales sin requerir todos los campos
 * ✅ USO: En PUT /api/players/[id]
 */
export const PlayerUpdateSchema = PlayerCreateSchema.partial()

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
    .default('1'),
    
  limit: z
    .string()
    .regex(/^\d+$/, 'El límite debe ser un número')
    .transform(Number)
    .refine(n => n >= 1 && n <= 100, 'El límite debe estar entre 1 y 100')
    .default('20'),
  
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
  period: z.enum(['week', 'month', 'year', 'all']).default('all'),
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
  include_counts: z.enum(['true', 'false']).transform(val => val === 'true').default('true'),
  min_count: z.string().regex(/^\d+$/).transform(Number).default('1')
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
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: err.input
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
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: err.input
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
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: err.input
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
      throw new Error(`ID de jugador inválido: ${error.errors[0]?.message}`)
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