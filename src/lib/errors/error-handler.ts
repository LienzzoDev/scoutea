import { NextRequest, NextResponse } from 'next/server';

import { APIError } from './api-errors';

export interface ErrorContext {
  request: NextRequest;
  userId?: string;
  timestamp: Date;
  path: string;
  method: string;
}

export function extractErrorContext(request: NextRequest): ErrorContext {
  return {
    request,
    timestamp: new Date(),
    path: request.nextUrl.pathname,
    method: request.method
  };
}

export function handleAPIError(error: unknown, context?: ErrorContext): NextResponse {
  console.error('API Error:', error, context);
  
  if (error instanceof APIError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code,
        details: error.details 
      },
      { status: error.statusCode }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as NextRequest;
      const context = extractErrorContext(request);
      return handleAPIError(error, context);
    }
  };
}

export function requireAuth(request: NextRequest): void {
  // Mock implementation - replace with actual auth check
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new APIError('UNAUTHORIZED', 'Authentication required', 401);
  }
}

export function requireRole(request: NextRequest, _role: string): void {
  // Mock implementation - replace with actual role check
  requireAuth(request);
  // Additional role checking logic would go here
}

export function requireParam(params: Record<string, unknown>, paramName: string): string {
  const value = params[paramName];
  if (!value) {
    throw new APIError('VALIDATION_ERROR', `Missing required parameter: ${paramName}`, 400);
  }
  return value;
}