/**
 * Main Players API Endpoint
 * 
 * Handles player searches and creation operations.
 * Replaces the duplicate /api/jugadores API.
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { PlayerService } from '@/lib/services/player-service'
import {
  PlayerSearchSchema,
  PlayerCreateSchema
} from '@/lib/validation/player-schema'
import { checkRateLimit, RateLimitConfigs } from '@/lib/validation/rate-limiter'
import { sanitizeRequest } from '@/lib/validation/request-sanitizer'
import type { PlayerSearchResult, Player } from '@/types/player'

/**
 * GET /api/players - Search players with filters and pagination
 * Enhanced with comprehensive error handling and recovery mechanisms
 * 
 * @param request - Request with search parameters
 * @returns Paginated list of players matching the criteria
 * 
 * @example
 * GET /api/players?page=1&limit=20&filters[position_player]=CF
 */
export async function GET(request: NextRequest): Promise<NextResponse<PlayerSearchResult | { error: string; code?: string; details?: any }>> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    // 🛡️ RATE LIMITING CHECK FIRST
    const rateLimitResult = checkRateLimit('players-search', request, undefined, RateLimitConfigs.search);
    if (!rateLimitResult.allowed) {
      console.warn(`⚠️ [${requestId}] Rate limit exceeded`, {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        retryAfter: rateLimitResult.retryAfter
      });
      
      const response = NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Por favor, intenta nuevamente más tarde.',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            retryAfter: rateLimitResult.retryAfter,
            limit: rateLimitResult.limit
          }
        }, 
        { status: 429 }
      );
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
      response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
      response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', String(rateLimitResult.retryAfter));
      }
      
      return response;
    }

    // 🔐 ENHANCED AUTHENTICATION WITH DETAILED ERROR HANDLING
    let userId: string | null = null;
    let authError: Error | null = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (error) {
      authError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ [${requestId}] Authentication failed:`, {
        error: authError.message,
        stack: authError.stack,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          error: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
          code: 'AUTH_ERROR',
          details: process.env.NODE_ENV === 'development' ? authError.message : undefined
        }, 
        { status: 401 }
      );
    }
    
    if (!userId) {
      console.warn(`⚠️ [${requestId}] Unauthorized access attempt`);
      return NextResponse.json(
        { 
          error: 'No autorizado. Debes iniciar sesión para acceder a los jugadores.',
          code: 'UNAUTHORIZED'
        }, 
        { status: 401 }
      );
    }

    // 🛡️ ENHANCED REQUEST SANITIZATION AND VALIDATION
    const sanitizationResult = await sanitizeRequest(
      request,
      PlayerSearchSchema,
      {
        requestId,
        userId
      }
    );

    if (!sanitizationResult.success) {
      console.warn(`⚠️ [${requestId}] Request sanitization failed:`, {
        errors: sanitizationResult.errors,
        warnings: sanitizationResult.warnings,
        blocked: sanitizationResult.blocked,
        userId
      });
      
      const statusCode = sanitizationResult.blocked ? 403 : 400;
      const errorCode = sanitizationResult.blocked ? 'REQUEST_BLOCKED' : 'VALIDATION_ERROR';
      
      return NextResponse.json(
        { 
          error: sanitizationResult.blocked 
            ? 'Solicitud bloqueada por razones de seguridad.'
            : `Parámetros inválidos: ${sanitizationResult.errors.join(', ')}`,
          code: errorCode,
          details: process.env.NODE_ENV === 'development' ? {
            errors: sanitizationResult.errors,
            warnings: sanitizationResult.warnings
          } : undefined
        },
        { status: statusCode }
      );
    }

    const validatedParams = sanitizationResult.data!;

    // 🔄 SAFE PARAMETER TRANSFORMATION
    let searchOptions;
    try {
      searchOptions = {
        page: validatedParams.page,
        limit: validatedParams.limit,
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder,
        filters: {
          player_name: validatedParams['filters[player_name]'],
          position_player: validatedParams['filters[position_player]'],
          team_name: validatedParams['filters[team_name]'],
          nationality_1: validatedParams['filters[nationality_1]'],
          min_age: validatedParams['filters[min_age]'],
          max_age: validatedParams['filters[max_age]'],
          min_rating: validatedParams['filters[min_rating]'],
          max_rating: validatedParams['filters[max_rating]'],
          on_loan: validatedParams['filters[on_loan]']
        }
      };
    } catch (transformError) {
      console.error(`❌ [${requestId}] Parameter transformation failed:`, {
        error: transformError instanceof Error ? transformError.message : String(transformError),
        validatedParams,
        userId
      });
      
      return NextResponse.json(
        { 
          error: 'Error al procesar parámetros de búsqueda.',
          code: 'PARAM_TRANSFORM_ERROR'
        },
        { status: 400 }
      );
    }

    // 🚀 ENHANCED SERVICE CALL WITH COMPREHENSIVE ERROR HANDLING
    let result: PlayerSearchResult;
    try {
      console.log(`🔍 [${requestId}] Starting player search:`, {
        userId,
        searchOptions: {
          ...searchOptions,
          filters: Object.keys(searchOptions.filters).length > 0 ? '...' : 'none'
        }
      });
      
      result = await PlayerService.searchPlayers(searchOptions);
      
      console.log(`✅ [${requestId}] Player search completed:`, {
        userId,
        playersFound: result.players?.length || 0,
        totalResults: result.pagination?.total || 0,
        duration: Date.now() - startTime
      });
      
    } catch (serviceError) {
      // Enhanced service error handling with classification
      const error = serviceError instanceof Error ? serviceError : new Error(String(serviceError));
      
      console.error(`❌ [${requestId}] Player service failed:`, {
        error: error.message,
        stack: error.stack,
        searchOptions,
        userId,
        duration: Date.now() - startTime
      });
      
      // Classify error type for appropriate response
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'La búsqueda está tardando más de lo esperado. Por favor, intenta nuevamente.',
            code: 'SERVICE_TIMEOUT'
          },
          { status: 504 }
        );
      }
      
      if (error.message.includes('connection') || error.message.includes('database')) {
        return NextResponse.json(
          { 
            error: 'Error de conexión con la base de datos. Por favor, intenta nuevamente.',
            code: 'DATABASE_ERROR'
          },
          { status: 503 }
        );
      }
      
      if (error.message.includes('cache')) {
        return NextResponse.json(
          { 
            error: 'Error en el sistema de caché. Los datos se están obteniendo directamente.',
            code: 'CACHE_ERROR'
          },
          { status: 200 } // Still return 200 as this might be recoverable
        );
      }
      
      // Generic service error
      return NextResponse.json(
        { 
          error: 'Error interno del servicio. Por favor, inténtalo de nuevo más tarde.',
          code: 'SERVICE_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    // 📊 ENHANCED RESPONSE WITH COMPREHENSIVE HEADERS AND VALIDATION
    try {
      // Validate result structure before sending response
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid service response structure');
      }
      
      if (!result.players || !Array.isArray(result.players)) {
        throw new Error('Invalid players array in service response');
      }
      
      if (!result.pagination || typeof result.pagination !== 'object') {
        throw new Error('Invalid pagination object in service response');
      }
      
      const response = NextResponse.json(result);
      
      // Add comprehensive headers for client
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Total-Count', String(result.pagination.total || 0));
      response.headers.set('X-Page', String(result.pagination.page || 1));
      response.headers.set('X-Total-Pages', String(result.pagination.totalPages || 0));
      response.headers.set('X-Response-Time', String(Date.now() - startTime));
      response.headers.set('X-Cache-Status', 'processed'); // Could be enhanced with actual cache status
      
      // Add CORS headers if needed
      response.headers.set('Access-Control-Expose-Headers', 'X-Total-Count,X-Page,X-Total-Pages,X-Response-Time');
      
      return response;
      
    } catch (responseError) {
      console.error(`❌ [${requestId}] Response formatting failed:`, {
        error: responseError instanceof Error ? responseError.message : String(responseError),
        result: typeof result === 'object' ? Object.keys(result) : typeof result,
        userId
      });
      
      return NextResponse.json(
        { 
          error: 'Error al formatear la respuesta del servidor.',
          code: 'RESPONSE_FORMAT_ERROR'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    // 🚨 ULTIMATE ERROR BOUNDARY - CATCHES ANY UNHANDLED ERRORS
    const finalError = error instanceof Error ? error : new Error(String(error));
    
    console.error(`❌ [${requestId}] Unhandled error in GET /api/players:`, {
      error: finalError.message,
      stack: finalError.stack,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });
    
    // Try to get userId for logging, but don't fail if auth is broken
    let userId = 'unknown';
    try {
      const authResult = await auth();
      userId = authResult.userId || 'anonymous';
    } catch (authError) {
      console.warn(`⚠️ [${requestId}] Could not get userId for error logging:`, authError);
    }
    
    // Log error for monitoring/alerting systems
    console.error(`🚨 [${requestId}] CRITICAL ERROR - Players API failure:`, {
      userId,
      error: finalError.message,
      requestId,
      timestamp: new Date().toISOString()
    });

    // Return safe, generic error response
    return NextResponse.json(
      { 
        error: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.',
        code: 'INTERNAL_SERVER_ERROR',
        requestId: requestId // Include request ID for support
      },
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Error-Type': 'unhandled_exception'
        }
      }
    );
  }
}

/**
 * ➕ POST /api/players - CREAR NUEVO JUGADOR
 * 
 * ✅ QUÉ HACE: Crea un nuevo jugador en la base de datos
 * ✅ POR QUÉ: Permite a los admins añadir nuevos jugadores al sistema
 * ✅ EJEMPLO: POST /api/players con body { "player_name": "Nuevo Jugador", "age": 20 }
 * 
 * @param request - Request con datos del nuevo jugador
 * @returns El jugador creado con su ID asignado
 */
export async function POST(request: NextRequest): Promise<NextResponse<Player | { error: string; code?: string; details?: any }>> {
  const requestId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    // 🛡️ RATE LIMITING CHECK FOR WRITE OPERATIONS
    const rateLimitResult = checkRateLimit('players-create', request, undefined, RateLimitConfigs.write);
    if (!rateLimitResult.allowed) {
      console.warn(`⚠️ [${requestId}] Rate limit exceeded for POST`, {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        retryAfter: rateLimitResult.retryAfter
      });
      
      const response = NextResponse.json(
        { 
          error: 'Demasiadas solicitudes de creación. Por favor, intenta nuevamente más tarde.',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            retryAfter: rateLimitResult.retryAfter,
            limit: rateLimitResult.limit
          }
        }, 
        { status: 429 }
      );
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
      response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
      response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', String(rateLimitResult.retryAfter));
      }
      
      return response;
    }

    // 🔐 ENHANCED AUTHENTICATION WITH DETAILED ERROR HANDLING
    let userId: string | null = null;
    let sessionClaims: any = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
      sessionClaims = authResult.sessionClaims;
    } catch (authError) {
      console.error(`❌ [${requestId}] Authentication failed in POST:`, {
        error: authError instanceof Error ? authError.message : String(authError),
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          error: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
          code: 'AUTH_ERROR'
        }, 
        { status: 401 }
      );
    }
    
    if (!userId) {
      console.warn(`⚠️ [${requestId}] Unauthorized player creation attempt`);
      return NextResponse.json(
        { 
          error: 'No autorizado. Debes iniciar sesión para crear jugadores.',
          code: 'UNAUTHORIZED'
        }, 
        { status: 401 }
      );
    }

    // 👮‍♂️ ENHANCED ROLE VERIFICATION WITH DETAILED LOGGING
    let userRole: string | undefined;
    try {
      userRole = sessionClaims?.public_metadata?.role;
      
      if (userRole !== 'admin') {
        console.warn(`⚠️ [${requestId}] Insufficient permissions for player creation:`, {
          userId,
          userRole: userRole || 'none',
          requiredRole: 'admin'
        });
        
        return NextResponse.json(
          { 
            error: 'Acceso denegado. Solo los administradores pueden crear jugadores.',
            code: 'INSUFFICIENT_PERMISSIONS'
          },
          { status: 403 }
        );
      }
    } catch (roleError) {
      console.error(`❌ [${requestId}] Role verification failed:`, {
        error: roleError instanceof Error ? roleError.message : String(roleError),
        userId,
        sessionClaims
      });
      
      return NextResponse.json(
        { 
          error: 'Error al verificar permisos de usuario.',
          code: 'ROLE_VERIFICATION_ERROR'
        },
        { status: 403 }
      );
    }

    // 🛡️ ENHANCED REQUEST SANITIZATION AND VALIDATION FOR POST
    const sanitizationResult = await sanitizeRequest(
      request,
      PlayerCreateSchema,
      {
        requestId,
        userId
      }
    );

    if (!sanitizationResult.success) {
      console.warn(`⚠️ [${requestId}] Request sanitization failed:`, {
        errors: sanitizationResult.errors,
        warnings: sanitizationResult.warnings,
        blocked: sanitizationResult.blocked,
        userId
      });
      
      const statusCode = sanitizationResult.blocked ? 403 : 400;
      const errorCode = sanitizationResult.blocked ? 'REQUEST_BLOCKED' : 'VALIDATION_ERROR';
      
      return NextResponse.json(
        { 
          error: sanitizationResult.blocked 
            ? 'Solicitud bloqueada por razones de seguridad.'
            : `Datos inválidos: ${sanitizationResult.errors.join(', ')}`,
          code: errorCode,
          details: process.env.NODE_ENV === 'development' ? {
            errors: sanitizationResult.errors,
            warnings: sanitizationResult.warnings
          } : undefined
        },
        { status: statusCode }
      );
    }

    const validatedData = sanitizationResult.data!;

    // ➕ ENHANCED PLAYER CREATION WITH COMPREHENSIVE ERROR HANDLING
    let newPlayer: Player;
    try {
      console.log(`🔄 [${requestId}] Creating new player:`, {
        userId,
        playerName: validatedData.player_name,
        userRole
      });
      
      newPlayer = await PlayerService.createPlayer(validatedData);
      
      console.log(`✅ [${requestId}] Player created successfully:`, {
        playerId: newPlayer.id_player,
        playerName: newPlayer.player_name,
        createdBy: userId,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
    } catch (serviceError) {
      // Enhanced service error handling with classification
      const error = serviceError instanceof Error ? serviceError : new Error(String(serviceError));
      
      console.error(`❌ [${requestId}] Player creation service failed:`, {
        error: error.message,
        stack: error.stack,
        validatedData: process.env.NODE_ENV === 'development' ? validatedData : '[hidden]',
        userId,
        duration: Date.now() - startTime
      });
      
      // Classify error type for appropriate response
      if (error.message.includes('Unique constraint') || error.message.includes('duplicate')) {
        return NextResponse.json(
          { 
            error: 'Ya existe un jugador con ese nombre. Por favor, usa un nombre diferente.',
            code: 'DUPLICATE_PLAYER'
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            error: 'Error de referencia de datos. Verifica que todos los datos relacionados existan.',
            code: 'FOREIGN_KEY_ERROR'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'La creación del jugador está tardando más de lo esperado. Por favor, intenta nuevamente.',
            code: 'SERVICE_TIMEOUT'
          },
          { status: 504 }
        );
      }
      
      if (error.message.includes('connection') || error.message.includes('database')) {
        return NextResponse.json(
          { 
            error: 'Error de conexión con la base de datos. Por favor, intenta nuevamente.',
            code: 'DATABASE_ERROR'
          },
          { status: 503 }
        );
      }
      
      // Generic service error
      return NextResponse.json(
        { 
          error: 'Error interno del servicio al crear el jugador. Por favor, inténtalo de nuevo más tarde.',
          code: 'SERVICE_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    // 📤 ENHANCED RESPONSE WITH VALIDATION AND HEADERS
    try {
      // Validate player object before sending response
      if (!newPlayer || typeof newPlayer !== 'object' || !newPlayer.id_player) {
        throw new Error('Invalid player object returned from service');
      }
      
      const response = NextResponse.json(newPlayer, { status: 201 });
      
      // Add comprehensive headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', String(Date.now() - startTime));
      response.headers.set('Location', `/api/players/${newPlayer.id_player}`);
      
      return response;
      
    } catch (responseError) {
      console.error(`❌ [${requestId}] Response formatting failed for player creation:`, {
        error: responseError instanceof Error ? responseError.message : String(responseError),
        newPlayer: typeof newPlayer === 'object' ? Object.keys(newPlayer) : typeof newPlayer,
        userId
      });
      
      return NextResponse.json(
        { 
          error: 'Jugador creado pero error al formatear la respuesta.',
          code: 'RESPONSE_FORMAT_ERROR'
        },
        { status: 201 } // Still 201 because player was created
      );
    }

  } catch (error) {
    // 🚨 ULTIMATE ERROR BOUNDARY FOR POST
    const finalError = error instanceof Error ? error : new Error(String(error));
    
    console.error(`❌ [${requestId}] Unhandled error in POST /api/players:`, {
      error: finalError.message,
      stack: finalError.stack,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });
    
    // Try to get userId for logging, but don't fail if auth is broken
    let userId = 'unknown';
    try {
      const authResult = await auth();
      userId = authResult.userId || 'anonymous';
    } catch (authError) {
      console.warn(`⚠️ [${requestId}] Could not get userId for error logging:`, authError);
    }
    
    // Log critical error
    console.error(`🚨 [${requestId}] CRITICAL ERROR - Player creation API failure:`, {
      userId,
      error: finalError.message,
      requestId,
      timestamp: new Date().toISOString()
    });

    // Return safe, generic error response
    return NextResponse.json(
      { 
        error: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.',
        code: 'INTERNAL_SERVER_ERROR',
        requestId: requestId
      },
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Error-Type': 'unhandled_exception'
        }
      }
    );
  }
}
