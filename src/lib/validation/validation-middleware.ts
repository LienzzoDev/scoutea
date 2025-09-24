/**
 * Validation Middleware for API Routes
 * 
 * Provides comprehensive request validation and sanitization middleware
 * that can be used across all API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '../logging/production-logger'
import { sanitizeObject, SanitizationOptions } from './input-sanitizer'

export interface ValidationOptions {
  sanitization?: SanitizationOptions
  requireAuth?: boolean
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
  sanitizationThreats?: string[]
}

/**
 * Create a validation middleware for API routes
 */
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  options: ValidationOptions = {}
) {
  return async function validateRequest(
    request: NextRequest,
    getData: (req: NextRequest) => Promise<unknown> | unknown
  ): Promise<ValidationResult<T>> {
    try {
      // Get data from request (body, query params, etc.)
      const rawData = await getData(request)

      // Sanitize the data first
      let sanitizedData = rawData
      const sanitizationThreats: string[] = []

      if (typeof rawData === 'object' && rawData !== null) {
        try {
          sanitizedData = sanitizeObject(rawData as Record<string, unknown>, options.sanitization)
        } catch (error) {
          logger.securityEvent('Data sanitization failed', 'high', {
            error: error instanceof Error ? error.message : 'Unknown error',
            endpoint: request.url,
            method: request.method
          })
          
          return {
            success: false,
            sanitizationThreats: ['SANITIZATION_FAILED']
          }
        }
      }

      // Validate with Zod schema
      const result = schema.safeParse(sanitizedData)

      if (!result.success) {
        logger.warn('Request validation failed', {
          endpoint: request.url,
          method: request.method,
          errors: result.error.errors
        })

        return {
          success: false,
          errors: result.error,
          sanitizationThreats
        }
      }

      logger.debug('Request validation successful', {
        endpoint: request.url,
        method: request.method
      })

      return {
        success: true,
        data: result.data,
        sanitizationThreats
      }

    } catch (error) {
      logger.error('Validation middleware error', error as Error, {
        endpoint: request.url,
        method: request.method
      })

      return {
        success: false,
        sanitizationThreats: ['VALIDATION_ERROR']
      }
    }
  }
}

/**
 * Validate request body
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  options: ValidationOptions = {}
): Promise<ValidationResult<T>> {
  const validator = createValidationMiddleware(schema, options)
  
  return validator(request, async (req) => {
    try {
      return await req.json()
    } catch {
      return {}
    }
  })
}

/**
 * Validate query parameters
 */
export async function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  options: ValidationOptions = {}
): Promise<ValidationResult<T>> {
  const validator = createValidationMiddleware(schema, options)
  
  return validator(request, (req) => {
    const searchParams = req.nextUrl.searchParams
    const params: Record<string, string | string[]> = {}
    
    for (const [key, value] of searchParams.entries()) {
      if (params[key]) {
        // Handle multiple values for the same key
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value)
        } else {
          params[key] = [params[key] as string, value]
        }
      } else {
        params[key] = value
      }
    }
    
    return params
  })
}

/**
 * Validate path parameters
 */
export async function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>,
  options: ValidationOptions = {}
): Promise<ValidationResult<T>> {
  try {
    // Sanitize the params
    let sanitizedParams = params
    const sanitizationThreats: string[] = []

    try {
      sanitizedParams = sanitizeObject(params, options.sanitization)
    } catch (error) {
      logger.securityEvent('Path params sanitization failed', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params
      })
      
      return {
        success: false,
        sanitizationThreats: ['SANITIZATION_FAILED']
      }
    }

    // Validate with Zod schema
    const result = schema.safeParse(sanitizedParams)

    if (!result.success) {
      logger.warn('Path params validation failed', {
        params,
        errors: result.error.errors
      })

      return {
        success: false,
        errors: result.error,
        sanitizationThreats
      }
    }

    return {
      success: true,
      data: result.data,
      sanitizationThreats
    }

  } catch (error) {
    logger.error('Path params validation error', error as Error, { params })

    return {
      success: false,
      sanitizationThreats: ['VALIDATION_ERROR']
    }
  }
}

/**
 * Create error response for validation failures
 */
export function createValidationErrorResponse(
  result: ValidationResult<unknown>
): NextResponse {
  if (result.sanitizationThreats && result.sanitizationThreats.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Security threat detected in request',
        code: 'SECURITY_THREAT'
      },
      { status: 400 }
    )
  }

  if (result.errors) {
    const fieldErrors: Record<string, string[]> = {}
    
    for (const error of result.errors.errors) {
      const field = error.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(error.message)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        fieldErrors,
        code: 'VALIDATION_ERROR'
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Invalid request',
      code: 'INVALID_REQUEST'
    },
    { status: 400 }
  )
}

/**
 * Wrapper function to easily add validation to API routes
 */
export function withValidation<TBody = unknown, TQuery = unknown, TParams = unknown>(
  handler: (
    request: NextRequest,
    context: {
      body?: TBody
      query?: TQuery
      params?: TParams
    }
  ) => Promise<NextResponse> | NextResponse,
  schemas: {
    body?: z.ZodSchema<TBody>
    query?: z.ZodSchema<TQuery>
    params?: z.ZodSchema<TParams>
  },
  options: ValidationOptions = {}
) {
  return async function validatedHandler(
    request: NextRequest,
    context: { params?: Record<string, string | string[]> } = {}
  ): Promise<NextResponse> {
    try {
      const validationResults: {
        body?: ValidationResult<TBody>
        query?: ValidationResult<TQuery>
        params?: ValidationResult<TParams>
      } = {}

      // Validate body if schema provided
      if (schemas.body) {
        validationResults.body = await validateRequestBody(request, schemas.body, options)
        if (!validationResults.body.success) {
          return createValidationErrorResponse(validationResults.body)
        }
      }

      // Validate query if schema provided
      if (schemas.query) {
        validationResults.query = await validateQueryParams(request, schemas.query, options)
        if (!validationResults.query.success) {
          return createValidationErrorResponse(validationResults.query)
        }
      }

      // Validate params if schema provided
      if (schemas.params && context.params) {
        validationResults.params = await validatePathParams(context.params, schemas.params, options)
        if (!validationResults.params.success) {
          return createValidationErrorResponse(validationResults.params)
        }
      }

      // Call the original handler with validated data
      return await handler(request, {
        body: validationResults.body?.data,
        query: validationResults.query?.data,
        params: validationResults.params?.data
      })

    } catch (error) {
      logger.error('Validation wrapper error', error as Error, {
        endpoint: request.url,
        method: request.method
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
    }
  }
}