/**
 * Server-Side Environment Detection Service
 * 
 * Provides environment detection specifically for server-side usage.
 * This avoids the "use client" issues when used in API routes.
 */

export interface ServerEnvironmentDetector {
  isServer(): boolean;
  isClient(): boolean;
  isBrowser(): boolean;
  isHydrating(): boolean;
  canUseCache(): boolean;
}

class ServerEnvironmentDetectorImpl implements ServerEnvironmentDetector {
  /**
   * Always returns true on server
   */
  isServer(): boolean {
    return true;
  }

  /**
   * Always returns false on server
   */
  isClient(): boolean {
    return false;
  }

  /**
   * Always returns false on server
   */
  isBrowser(): boolean {
    return false;
  }

  /**
   * Always returns false on server (hydration is client-side concept)
   */
  isHydrating(): boolean {
    return false;
  }

  /**
   * Server-side cache policy - can be configured
   */
  canUseCache(): boolean {
    // For now, disable server-side caching to avoid hydration issues
    // This can be enabled later with proper server-side cache implementation
    return false;
  }
}

// Singleton instance for server
let serverEnvironmentDetectorInstance: ServerEnvironmentDetectorImpl | null = null;

/**
 * Get the server environment detector instance
 */
export function getServerEnvironmentDetector(): ServerEnvironmentDetector {
  if (!serverEnvironmentDetectorInstance) {
    serverEnvironmentDetectorInstance = new ServerEnvironmentDetectorImpl();
  }
  return serverEnvironmentDetectorInstance;
}

/**
 * Reset the server environment detector (useful for testing)
 */
export function resetServerEnvironmentDetector(): void {
  serverEnvironmentDetectorInstance = null;
}

/**
 * Universal environment detector that works in both server and client
 */
export function getUniversalEnvironmentDetector(): ServerEnvironmentDetector {
  // Check if we're on server side
  if (typeof window === 'undefined') {
    return getServerEnvironmentDetector();
  }
  
  // On client side, we need to import the client version dynamically
  // For now, return a safe server-like implementation
  return getServerEnvironmentDetector();
}