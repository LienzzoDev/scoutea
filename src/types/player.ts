// 🎯 TIPOS UNIFICADOS DE JUGADOR
// ✅ PROPÓSITO: Definir UN SOLO tipo de jugador para toda la aplicación
// ✅ BENEFICIO: Elimina confusión entre diferentes interfaces de jugador
// ✅ REEMPLAZA: Las interfaces duplicadas Jugador vs Player

// 👤 INTERFACE PRINCIPAL DEL JUGADOR
// Esta es la única interface que debe usarse en toda la aplicación
export interface Player {
  // 🆔 IDENTIFICACIÓN ÚNICA
  id_player: string              // ID único en la base de datos (OBLIGATORIO)
  player_name: string            // Nombre principal del jugador (OBLIGATORIO)
  complete_player_name?: string  // Nombre completo si es diferente (OPCIONAL)
  
  // 👤 INFORMACIÓN PERSONAL BÁSICA
  date_of_birth?: string         // Fecha de nacimiento original (formato: "YYYY-MM-DD")
  correct_date_of_birth?: string // Fecha corregida si la original era incorrecta
  age?: number                   // Edad calculada automáticamente (16-50 años típicamente)
  nationality_1?: string         // Nacionalidad principal (ej: "España", "Argentina")
  nationality_2?: string         // Segunda nacionalidad si la tiene (para jugadores binacionales)
  
  // 🏃‍♂️ ATRIBUTOS FÍSICOS Y TÉCNICOS
  height?: number                // Altura en centímetros (ej: 180)
  foot?: string                  // Pie dominante ("Left", "Right", "Both")
  position_player?: string       // Posición en el campo ("CF", "CM", "CB", "GK", etc.)
  correct_position_player?: string // Posición corregida si la original era incorrecta
  
  // ⚽ INFORMACIÓN DEL EQUIPO ACTUAL
  team_name?: string             // Nombre del equipo actual (ej: "FC Barcelona")
  correct_team_name?: string     // Nombre corregido del equipo
  team_country?: string          // País del equipo (ej: "España")
  team_competition?: string      // Liga o competición donde juega (ej: "La Liga")
  competition_country?: string   // País de la competición
  
  // 📊 MÉTRICAS DE RENDIMIENTO
  player_rating?: number         // Valoración del jugador (0-100, donde 100 es el mejor)
  player_rating_norm?: number    // Rating normalizado para comparaciones
  player_elo?: number           // Sistema ELO de ranking (como en ajedrez)
  player_ranking?: number       // Posición en ranking global (1 = mejor del mundo)
  community_potential?: number   // Potencial evaluado por la comunidad
  
  // 💰 INFORMACIÓN ECONÓMICA
  player_trfm_value?: number     // Valor de mercado en Transfermarkt
  player_trfm_value_norm?: number // Valor normalizado
  
  // 📄 DETALLES CONTRACTUALES
  contract_end?: string         // Fecha de fin de contrato (formato: "YYYY-MM-DD")
  correct_contract_end?: string // Fecha corregida del contrato
  on_loan?: boolean            // Si está cedido (true) o no (false)
  agency?: string              // Agencia que lo representa
  correct_agency?: string      // Agencia corregida
  
  // 🔗 ENLACES Y RECURSOS
  url_trfm?: string            // URL de Transfermarkt
  url_trfm_advisor?: string    // URL de TM Advisor
  url_secondary?: string       // URL secundaria
  url_instagram?: string       // Perfil de Instagram
  video?: string               // URL de video destacado
  photo_coverage?: string      // Cobertura de fotos disponibles
  
  // 🕒 METADATOS DEL SISTEMA
  createdAt: string            // Cuándo se añadió a la base de datos (ISO string)
  updatedAt: string            // Última vez que se actualizó (ISO string)
}

// 🔍 FILTROS PARA BÚSQUEDA DE JUGADORES
// ✅ PROPÓSITO: Permitir búsquedas específicas y filtrado avanzado
// ✅ BENEFICIO: Los usuarios pueden encontrar exactamente lo que buscan
export interface PlayerFilters {
  player_name?: string      // Buscar por nombre (ej: "Messi", "Cristiano")
  position_player?: string  // Filtrar por posición (ej: "CF", "CM", "CB")
  team_name?: string       // Filtrar por equipo (ej: "Barcelona", "Real Madrid")
  nationality_1?: string   // Filtrar por nacionalidad (ej: "Argentina", "Portugal")
  min_age?: number        // Edad mínima (ej: 18 para mayores de edad)
  max_age?: number        // Edad máxima (ej: 25 para jóvenes promesas)
  min_rating?: number     // Rating mínimo (ej: 80 para jugadores de élite)
  max_rating?: number     // Rating máximo (ej: 95 para filtrar rangos)
  on_loan?: boolean       // Solo jugadores cedidos (true) o no cedidos (false)
}

// ⚙️ OPCIONES DE BÚSQUEDA Y ORDENAMIENTO
// ✅ PROPÓSITO: Control total sobre cómo se muestran los resultados
// ✅ BENEFICIO: Paginación eficiente, ordenamiento flexible
export interface PlayerSearchOptions {
  page?: number              // Qué página queremos (ej: 1, 2, 3...) - por defecto: 1
  limit?: number            // Cuántos jugadores por página (ej: 20, 50) - por defecto: 20
  sortBy?: keyof Player     // Por qué campo ordenar (ej: "player_rating", "age")
  sortOrder?: 'asc' | 'desc' // Orden ascendente (A-Z, 1-10) o descendente (Z-A, 10-1)
  filters?: PlayerFilters   // Filtros a aplicar (definidos arriba)
}

// 📋 RESULTADO DE BÚSQUEDA COMPLETO
// ✅ PROPÓSITO: Información completa para mostrar paginación en la UI
// ✅ BENEFICIO: Frontend sabe exactamente cómo mostrar navegación
export interface PlayerSearchResult {
  players: Player[]         // Array con los jugadores encontrados
  pagination: {
    page: number           // Página actual que se está mostrando
    limit: number          // Jugadores por página configurados
    total: number          // Total de jugadores que cumplen los filtros
    totalPages: number     // Total de páginas disponibles (total ÷ limit)
    hasNext: boolean       // Si hay página siguiente (para botón "Siguiente")
    hasPrev: boolean       // Si hay página anterior (para botón "Anterior")
  }
}

// 📊 ESTADÍSTICAS GENERALES DE JUGADORES
// ✅ PROPÓSITO: Datos para dashboards y análisis
// ✅ BENEFICIO: Métricas útiles para administradores
export interface PlayerStats {
  totalPlayers: number                    // Total de jugadores en la base de datos
  averageRating: number | null           // Rating promedio de todos los jugadores
  playersByPosition: Array<{             // Distribución por posiciones
    position_player: string              // Nombre de la posición
    _count: { position_player: number }  // Cantidad de jugadores en esa posición
  }>
  playersByNationality: Array<{          // Top 10 nacionalidades más representadas
    nationality_1: string               // Nombre del país
    _count: { nationality_1: number }   // Cantidad de jugadores de ese país
  }>
  topRatedPlayers: Array<{              // Top 10 jugadores mejor valorados
    id_player: string                   // ID del jugador
    player_name: string                 // Nombre del jugador
    player_rating: number | null       // Su rating
    team_name: string | null           // Su equipo actual
    position_player: string | null     // Su posición
  }>
}

// 🔧 OPCIONES DISPONIBLES PARA FILTROS
// ✅ PROPÓSITO: Llenar dropdowns automáticamente con datos reales
// ✅ BENEFICIO: UI dinámica que se actualiza con nuevos datos
export interface FilterOptions {
  positions: Array<{          // Todas las posiciones disponibles
    value: string            // Código de la posición (ej: "CF")
    label: string           // Nombre legible (ej: "Centro Delantero")
    count: number           // Cuántos jugadores tienen esta posición
  }>
  nationalities: Array<{     // Todas las nacionalidades disponibles
    value: string           // Código del país (ej: "ES")
    label: string          // Nombre del país (ej: "España")
    count: number          // Cuántos jugadores de esta nacionalidad
  }>
  teams: Array<{            // Todos los equipos disponibles
    value: string          // Nombre del equipo
    label: string         // Nombre para mostrar
    count: number         // Cuántos jugadores en este equipo
  }>
  competitions: Array<{     // Todas las competiciones disponibles
    value: string          // Nombre de la competición
    label: string         // Nombre para mostrar
    count: number         // Cuántos jugadores en esta competición
  }>
}

// 📝 DATOS PARA CREAR UN NUEVO JUGADOR
// ✅ PROPÓSITO: Validar datos al crear jugadores
// ✅ BENEFICIO: Solo campos necesarios, validación clara
export interface CreatePlayerData {
  // CAMPOS OBLIGATORIOS
  player_name: string                    // Nombre del jugador (mínimo 2 caracteres)
  
  // CAMPOS OPCIONALES (pueden omitirse al crear)
  complete_player_name?: string
  date_of_birth?: Date
  age?: number
  position_player?: string
  foot?: string
  height?: number
  nationality_1?: string
  nationality_2?: string
  team_name?: string
  team_country?: string
  team_competition?: string
  player_rating?: number
  contract_end?: Date
  on_loan?: boolean
  agency?: string
  url_trfm?: string
  url_instagram?: string
  // ... otros campos opcionales según necesidad
}

// ✏️ DATOS PARA ACTUALIZAR UN JUGADOR EXISTENTE
// ✅ PROPÓSITO: Permitir actualizaciones parciales
// ✅ BENEFICIO: Solo enviar campos que realmente cambiaron
export interface UpdatePlayerData extends Partial<CreatePlayerData> {
  // Todos los campos son opcionales para actualizaciones
  // Se pueden actualizar solo los campos que han cambiaron
  id_player?: never // No se puede actualizar el ID
}

// 🏷️ TIPOS DE UTILIDAD PARA DESARROLLO
// ✅ PROPÓSITO: Facilitar el trabajo con tipos en TypeScript
export type PlayerSortableFields = keyof Pick<Player, 
  'player_name' | 'age' | 'player_rating' | 'createdAt' | 'team_name'
>

export type PlayerRequiredFields = Pick<Player, 'id_player' | 'player_name' | 'createdAt' | 'updatedAt'>

// 📝 DATOS PARA CREAR JUGADOR (FORMATO LEGACY)
// ✅ PROPÓSITO: Compatibilidad con formularios existentes
export interface CrearJugadorData {
  nombre: string                         // Nombre del jugador (obligatorio)
  nombreUsuario: string                  // Username único (obligatorio)
  posicion: string                       // Posición en el campo (obligatorio)
  edad: number                          // Edad del jugador (16-50)
  equipo: string                        // Equipo actual (obligatorio)
  numeroCamiseta?: number               // Número de camiseta (1-99, opcional)
  biografia?: string                    // Biografía del jugador (opcional)
  valoracion?: string                   // Valoración de mercado (opcional)
  urlAvatar?: string                    // URL de la imagen (opcional)
  atributos?: Array<{                   // Atributos personalizados (opcional)
    nombre: string                      // Nombre del atributo
    valor: string                       // Valor del atributo
  }>
}

// 📤 EXPORTACIONES ADICIONALES
// Re-exportar todo para fácil importación desde otros archivos
export default Player