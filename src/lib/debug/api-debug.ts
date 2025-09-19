/**
 * 🔍 API DEBUG UTILITIES
 * 
 * Utilidades para debugging y logging de llamadas a API
 */

interface APICallOptions {
  url: string
  method?: string
  body?: any
  headers?: Record<string, string>
}

interface APIResponse {
  ok: boolean
  status: number
  statusText: string
  data?: any
  error?: string
}

/**
 * Wrapper para fetch con logging detallado
 * Sobrecarga para compatibilidad con diferentes sintaxis
 */
export async function fetchPlayerAPI(url: string, options?: Omit<APICallOptions, 'url'>): Promise<any>
export async function fetchPlayerAPI(options: APICallOptions): Promise<APIResponse>
export async function fetchPlayerAPI(
  urlOrOptions: string | APICallOptions, 
  options?: Omit<APICallOptions, 'url'>
): Promise<any> {
  let url: string
  let method: string
  let body: any
  let headers: Record<string, string>

  // Determinar la sintaxis usada
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions
    method = options?.method || 'GET'
    body = options?.body
    headers = options?.headers || {}
  } else {
    url = urlOrOptions.url
    method = urlOrOptions.method || 'GET'
    body = urlOrOptions.body
    headers = urlOrOptions.headers || {}
  }
  
  // Log de la petición
  console.log('🚀 API Call:', {
    url,
    method,
    body: body ? JSON.stringify(body, null, 2) : undefined,
    headers,
    timestamp: new Date().toISOString()
  })

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    })

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.warn('⚠️ Failed to parse response as JSON:', parseError)
      data = null
    }

    // Log de la respuesta
    if (response.ok) {
      console.log('✅ API Success:', {
        url,
        status: response.status,
        data: data ? JSON.stringify(data, null, 2) : 'No data',
        timestamp: new Date().toISOString()
      })
      
      // Para compatibilidad, devolver directamente los datos si la respuesta es exitosa
      return data
    } else {
      const errorMessage = data?.error || `HTTP ${response.status}: ${response.statusText}`
      
      console.error('❌ API Error:', {
        url,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data: data ? JSON.stringify(data, null, 2) : 'No data',
        timestamp: new Date().toISOString()
      })
      
      // Lanzar error para mantener compatibilidad con el código existente
      throw new Error(errorMessage)
    }

  } catch (networkError) {
    console.error('🌐 Network Error:', {
      url,
      error: networkError instanceof Error ? networkError.message : 'Unknown network error',
      timestamp: new Date().toISOString()
    })

    // Re-lanzar el error para mantener compatibilidad
    throw networkError
  }
}

// Cache logging removed - cache system eliminated

/**
 * Log de debug para errores de hooks
 */
export function logHookError(hookName: string, error: any, context?: any) {
  console.error(`🪝 Hook Error in ${hookName}:`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString()
  })
}

/**
 * Log de debug para estados de loading
 */
export function logLoadingState(component: string, isLoading: boolean, additionalInfo?: any) {
  console.log(`⏳ Loading State - ${component}:`, {
    isLoading,
    additionalInfo,
    timestamp: new Date().toISOString()
  })
}