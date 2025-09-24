export interface ClientError {
  id: string;
  message: string;
  context: string;
  level: 'error' | 'warning' | 'info';
  timestamp: Date;
  stack?: string;
}

export class ClientErrorHandler {
  static handleError(
    error: Error,
    context: string = 'Unknown',
    level: 'error' | 'warning' | 'info' = 'error'
  ): ClientError {
    const clientError: ClientError = {
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      context,
      level,
      timestamp: new Date(),
      stack: error.stack
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error:', clientError);
    }

    // In production, you might want to send this to an error tracking service
    // Example: sendToErrorTrackingService(clientError);

    return clientError;
  }

  static logError(message: string, context: string = 'Unknown'): ClientError {
    const error = new Error(message);
    return this.handleError(error, context, 'error');
  }

  static logWarning(message: string, context: string = 'Unknown'): ClientError {
    const error = new Error(message);
    return this.handleError(error, context, 'warning');
  }
}

// Utility function to safely convert errors to strings for rendering
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try { 
    return JSON.stringify(error); 
  } catch { 
    return String(error); 
  }
}