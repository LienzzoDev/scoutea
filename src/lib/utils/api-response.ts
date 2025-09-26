/**
 * Utility functions for handling API responses safely
 */

/**
 * Safely parse JSON response, handling empty or malformed responses
 */
export async function safeJsonParse(response: Response): Promise<any> {
  const responseText = await response.text();
  
  if (!responseText || responseText.trim() === '') {
    return {};
  }
  
  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('❌ Error parsing JSON response:', error);
    console.error('❌ Response text:', responseText);
    return {
      error: `Error parsing server response (${response.status})`,
      details: responseText
    };
  }
}

/**
 * Handle API response with proper error handling
 */
export async function handleApiResponse(response: Response): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const data = await safeJsonParse(response);
    
    if (response.ok) {
      return {
        success: true,
        data
      };
    } else {
      return {
        success: false,
        error: data.error || data.message || `Error ${response.status}`,
        data
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error de conexión con el servidor'
    };
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(message: string, status: number = 500) {
  return Response.json({ error: message }, { status });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}