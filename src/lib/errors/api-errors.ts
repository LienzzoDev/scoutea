export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  DUPLICATE = 'DUPLICATE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const ErrorResponses = {
  notFound: (message: string = 'Resource not found') => 
    new APIError(ErrorCode.NOT_FOUND, message, 404),
  
  validation: (message: string = 'Validation error') => 
    new APIError(ErrorCode.VALIDATION_ERROR, message, 400),
  
  unauthorized: (message: string = 'Unauthorized') => 
    new APIError(ErrorCode.UNAUTHORIZED, message, 401),
  
  forbidden: (message: string = 'Forbidden') => 
    new APIError(ErrorCode.FORBIDDEN, message, 403),
  
  duplicate: (message: string = 'Resource already exists') => 
    new APIError(ErrorCode.DUPLICATE, message, 409),
  
  database: (message: string = 'Database error') => 
    new APIError(ErrorCode.DATABASE_ERROR, message, 500),
  
  externalService: (message: string = 'External service error') => 
    new APIError(ErrorCode.EXTERNAL_SERVICE_ERROR, message, 502)
};

export const createAPIError = (code: ErrorCode, message: string, statusCode: number = 500) => 
  new APIError(code, message, statusCode);

export const notFoundError = (message?: string) => ErrorResponses.notFound(message);
export const validationError = (message?: string) => ErrorResponses.validation(message);
export const unauthorizedError = (message?: string) => ErrorResponses.unauthorized(message);
export const forbiddenError = (message?: string) => ErrorResponses.forbidden(message);
export const duplicateError = (message?: string) => ErrorResponses.duplicate(message);
export const databaseError = (message?: string) => ErrorResponses.database(message);
export const externalServiceError = (message?: string) => ErrorResponses.externalService(message);