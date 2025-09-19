/**
 * Environment Detection Service
 * 
 * Provides reliable detection of server/client environments and hydration state
 * to prevent cache-related hydration issues in Next.js applications.
 * 
 * This module works in both server and client environments.
 */



export interface EnvironmentDetector {
  isServer(): boolean;
  isClient(): boolean;
  isBrowser(): boolean;
  isHydrating(): boolean;
  canUseCache(): boolean;
}

class EnvironmentDetectorImpl implements EnvironmentDetector {
  private _isHydrated = false;
  private _hydrationStarted = false;
  private _isServerSide: boolean;

  constructor() {
    // Determine if we're on server side immediately
    this._isServerSide = typeof window === 'undefined';
    
    // Initialize hydration tracking only on client side
    if (!this._isServerSide && this.isBrowser()) {
      this.initializeHydrationTracking();
    } else if (this._isServerSide) {
      // On server side, consider hydration as "complete" since it doesn't apply
      this._isHydrated = true;
      this._hydrationStarted = false;
    }
  }

  /**
   * Detects if code is running on the server
   * Enhanced with additional safety checks
   */
  isServer(): boolean {
    try {
      // Use cached result if available
      if (this._isServerSide !== undefined) {
        return this._isServerSide;
      }

      // Primary check: window object
      if (typeof window === 'undefined') {
        return true;
      }

      // Additional server-side indicators
      if (typeof global !== 'undefined' && global.process && global.process.versions && global.process.versions.node) {
        return true;
      }

      // Check for Next.js server-side context
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
        return typeof window === 'undefined';
      }

      return false;
    } catch (error) {
      // If any error occurs, assume server-side for safety
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Environment detection error, assuming server-side:', error);
      }
      return true;
    }
  }

  /**
   * Detects if code is running on the client
   * Enhanced with additional safety checks
   */
  isClient(): boolean {
    try {
      return !this.isServer() && this.isBrowser();
    } catch (error) {
      // If detection fails, assume not client for safety
      console.warn('Client detection error, assuming not client:', error);
      return false;
    }
  }

  /**
   * Detects if code is running in a browser environment
   * Enhanced with comprehensive browser feature detection
   */
  isBrowser(): boolean {
    try {
      // Basic browser object checks
      const hasWindow = typeof window !== 'undefined' && window !== null;
      const hasDocument = typeof document !== 'undefined' && document !== null;
      const hasNavigator = typeof navigator !== 'undefined' && navigator !== null;

      if (!hasWindow || !hasDocument || !hasNavigator) {
        return false;
      }

      // Additional browser environment checks
      const hasLocation = typeof window.location !== 'undefined';
      const hasHistory = typeof window.history !== 'undefined';
      const hasLocalStorage = (() => {
        try {
          return typeof window.localStorage !== 'undefined';
        } catch {
          return false; // Some browsers block localStorage access
        }
      })();

      // Check for DOM readiness
      const hasDocumentElement = document.documentElement !== null;
      const hasBody = document.body !== null || document.readyState !== 'loading';

      return hasWindow && hasDocument && hasNavigator && hasLocation && hasHistory && hasDocumentElement;
    } catch (error) {
      // If any check fails, assume not browser
      console.warn('Browser detection error, assuming not browser:', error);
      return false;
    }
  }

  /**
   * Detects if React is currently hydrating
   * Enhanced with comprehensive hydration state detection
   */
  isHydrating(): boolean {
    try {
      // Server-side is never hydrating
      if (this.isServer()) {
        return false;
      }

      // Not in browser environment
      if (!this.isBrowser()) {
        return false;
      }

      // If hydration has completed, return false
      if (this._isHydrated) {
        return false;
      }

      // If hydration has started but not completed
      if (this._hydrationStarted) {
        return true;
      }

      // Check DOM readiness state
      if (typeof document !== 'undefined' && document.readyState) {
        const isDocumentLoading = document.readyState === 'loading';
        const isDocumentInteractive = document.readyState === 'interactive';
        
        // If document is still loading, we're likely hydrating
        if (isDocumentLoading) {
          return true;
        }

        // If document is interactive but hydration hasn't been marked complete
        if (isDocumentInteractive && !this._isHydrated) {
          return true;
        }
      }

      // Check for React hydration indicators
      if (typeof window !== 'undefined') {
        // Check if React is in the process of hydrating
        const reactFiberNode = document.querySelector('[data-reactroot]') || 
                              document.querySelector('#__next') || 
                              document.querySelector('#root');
        
        if (reactFiberNode && !this._isHydrated) {
          // React root exists but hydration not complete
          return true;
        }
      }

      // Default to not hydrating if we can't determine state
      return false;
    } catch (error) {
      // If hydration detection fails, assume not hydrating for safety
      console.warn('Hydration detection error, assuming not hydrating:', error);
      return false;
    }
  }

  /**
   * Determines if cache operations are safe to perform
   * Simplified and more reliable logic
   */
  canUseCache(): boolean {
    try {
      // Never use cache on server
      if (this.isServer()) {
        console.log('🔍 EnvironmentDetector.canUseCache: false (server)');
        return false;
      }

      // Must be in browser environment
      if (!this.isBrowser()) {
        console.log('🔍 EnvironmentDetector.canUseCache: false (not browser)');
        return false;
      }

      // Must be on client side
      if (!this.isClient()) {
        console.log('🔍 EnvironmentDetector.canUseCache: false (not client)');
        return false;
      }

      // Simplified hydration check - if hydration completed, we can use cache
      if (this._isHydrated && !this._hydrationStarted) {
        console.log('🔍 EnvironmentDetector.canUseCache: true (hydration complete)', {
          isHydrated: this._isHydrated,
          hydrationStarted: this._hydrationStarted
        });
        return true;
      }

      // Additional check: if hydration completed but flag not updated, check window flag
      if (typeof window !== 'undefined' && (window as any).__HYDRATION_COMPLETE__) {
        console.log('🔍 EnvironmentDetector.canUseCache: true (window hydration flag set)');
        return true;
      }

      // If hydration hasn't started yet, check if we're in a safe state
      if (!this._hydrationStarted && typeof window !== 'undefined') {
        // Basic browser environment checks
        const hasRequiredAPIs = typeof window.setTimeout !== 'undefined' &&
                               typeof window.clearTimeout !== 'undefined' &&
                               typeof Date !== 'undefined' &&
                               typeof JSON !== 'undefined';

        if (!hasRequiredAPIs) {
          console.log('🔍 EnvironmentDetector.canUseCache: false (missing APIs)');
          return false;
        }

        // If document is ready, we can use cache
        if (typeof document !== 'undefined' && document.readyState) {
          const canUse = document.readyState === 'complete' || document.readyState === 'interactive';
          console.log('🔍 EnvironmentDetector.canUseCache: document check', {
            readyState: document.readyState,
            canUse,
            hydrationStarted: this._hydrationStarted,
            isHydrated: this._isHydrated
          });
          return canUse;
        }

        // Default to allowing cache if basic checks pass
        console.log('🔍 EnvironmentDetector.canUseCache: true (basic checks passed)');
        return true;
      }

      // If we're currently hydrating, don't use cache
      if (this._hydrationStarted && !this._isHydrated) {
        console.log('🔍 EnvironmentDetector.canUseCache: false (currently hydrating)', {
          hydrationStarted: this._hydrationStarted,
          isHydrated: this._isHydrated
        });
        return false;
      }

      // More permissive approach: if we're on client and document is ready, allow cache
      if (typeof document !== 'undefined' && document.readyState !== 'loading') {
        console.log('🔍 EnvironmentDetector.canUseCache: true (document ready, permissive mode)', {
          readyState: document.readyState,
          hydrationStarted: this._hydrationStarted,
          isHydrated: this._isHydrated
        });
        return true;
      }

      // Default to safe (allow cache)
      console.log('🔍 EnvironmentDetector.canUseCache: true (default allow)', {
        hydrationStarted: this._hydrationStarted,
        isHydrated: this._isHydrated
      });
      return true;
    } catch (error) {
      // If any check fails, default to not using cache for safety
      console.warn('Cache safety check error, disabling cache:', error);
      return false;
    }
  }

  /**
   * Initialize hydration tracking for client-side
   * Enhanced with comprehensive tracking and error handling
   */
  private initializeHydrationTracking(): void {
    try {
      if (!this.isBrowser()) {
        return;
      }

      // Mark hydration as started
      this._hydrationStarted = true;

      // Multiple strategies to detect hydration completion
      let hydrationCompleted = false;
      const completeHydration = () => {
        if (!hydrationCompleted) {
          hydrationCompleted = true;
          this.markHydrationComplete();
        }
      };

      // Strategy 1: DOM Content Loaded
      if (document.readyState === 'loading') {
        const domContentLoadedHandler = () => {
          document.removeEventListener('DOMContentLoaded', domContentLoadedHandler);
          // Delay to ensure React hydration has time to complete
          setTimeout(completeHydration, 100);
        };
        document.addEventListener('DOMContentLoaded', domContentLoadedHandler);
      } else {
        // DOM is already loaded, schedule hydration completion check
        setTimeout(completeHydration, 0);
      }

      // Strategy 2: Window Load (fallback)
      if (document.readyState !== 'complete') {
        const windowLoadHandler = () => {
          window.removeEventListener('load', windowLoadHandler);
          setTimeout(completeHydration, 50);
        };
        window.addEventListener('load', windowLoadHandler);
      }

      // Strategy 3: RequestAnimationFrame (React-specific)
      const rafHandler = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(completeHydration);
        });
      };
      
      if (typeof requestAnimationFrame !== 'undefined') {
        rafHandler();
      }

      // Strategy 4: Timeout fallback (safety net)
      setTimeout(() => {
        if (!hydrationCompleted) {
          console.warn('Hydration timeout reached, marking as complete');
          completeHydration();
        }
      }, 10000); // 10 second timeout

      // Strategy 5: React-specific hydration detection
      if (typeof window !== 'undefined') {
        // Check for React DevTools or other React indicators
        const checkReactHydration = () => {
          const reactRoot = document.querySelector('[data-reactroot]') || 
                           document.querySelector('#__next') || 
                           document.querySelector('#root');
          
          if (reactRoot && !hydrationCompleted) {
            // Use MutationObserver to detect when React finishes rendering
            const observer = new MutationObserver(() => {
              // React has made changes, likely hydration is complete
              setTimeout(() => {
                observer.disconnect();
                completeHydration();
              }, 100);
            });
            
            observer.observe(reactRoot, { 
              childList: true, 
              subtree: true, 
              attributes: true 
            });
            
            // Disconnect observer after timeout
            setTimeout(() => {
              observer.disconnect();
            }, 5000);
          }
        };

        if (typeof MutationObserver !== 'undefined') {
          setTimeout(checkReactHydration, 0);
        }
      }

    } catch (error) {
      console.warn('Error initializing hydration tracking:', error);
      // Fallback: mark as hydrated immediately to prevent blocking
      setTimeout(() => {
        this.markHydrationComplete();
      }, 0);
    }
  }

  /**
   * Mark hydration as complete
   * Enhanced with comprehensive completion handling
   */
  private markHydrationComplete(): void {
    try {
      if (!this._isHydrated) {
        this._isHydrated = true;
        this._hydrationStarted = false;
        
        // Log hydration completion in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Hydration completed successfully');
        }
        
        // Dispatch custom event for other parts of the app to listen to
        if (this.isBrowser() && typeof window !== 'undefined') {
          try {
            // Create and dispatch hydration complete event
            const event = new CustomEvent('hydration-complete', {
              detail: {
                timestamp: Date.now(),
                environment: 'client'
              }
            });
            window.dispatchEvent(event);
            
            // Also dispatch a more generic event for broader compatibility
            const genericEvent = new Event('hydration-complete');
            window.dispatchEvent(genericEvent);
          } catch (eventError) {
            console.warn('Failed to dispatch hydration-complete event:', eventError);
          }
        }
        
        // Set a flag on window for other scripts to check
        if (typeof window !== 'undefined') {
          try {
            (window as any).__HYDRATION_COMPLETE__ = true;
          } catch (windowError) {
            console.warn('Failed to set hydration flag on window:', windowError);
          }
        }
      }
    } catch (error) {
      console.warn('Error marking hydration as complete:', error);
      // Ensure hydration is marked complete even if event dispatch fails
      this._isHydrated = true;
      this._hydrationStarted = false;
    }
  }

  /**
   * Reset hydration state (useful for testing)
   */
  resetHydrationState(): void {
    this._isHydrated = false;
    this._hydrationStarted = false;
    
    // Clear window flag if it exists
    if (typeof window !== 'undefined') {
      try {
        delete (window as any).__HYDRATION_COMPLETE__;
      } catch (error) {
        console.warn('Failed to clear hydration flag:', error);
      }
    }
  }

  /**
   * Check if environment is stable and ready for operations
   */
  isEnvironmentStable(): boolean {
    try {
      if (this.isServer()) {
        // Server environment is generally stable
        return true;
      }

      if (!this.isBrowser()) {
        // Not in browser, not stable for client operations
        return false;
      }

      // Check if all required browser APIs are available
      const requiredAPIs = [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'addEventListener',
        'removeEventListener'
      ];

      for (const api of requiredAPIs) {
        if (typeof (window as any)[api] !== 'function') {
          return false;
        }
      }

      // Check document readiness
      if (typeof document !== 'undefined') {
        const isDocumentReady = document.readyState === 'complete' || 
                               (document.readyState === 'interactive' && this._isHydrated);
        
        if (!isDocumentReady) {
          return false;
        }
      }

      // Check hydration state
      return this._isHydrated && !this._hydrationStarted;
    } catch (error) {
      console.warn('Environment stability check failed:', error);
      return false;
    }
  }

  /**
   * Get comprehensive environment information for debugging
   */
  getEnvironmentInfo(): {
    isServer: boolean;
    isClient: boolean;
    isBrowser: boolean;
    isHydrating: boolean;
    isHydrated: boolean;
    canUseCache: boolean;
    isEnvironmentStable: boolean;
    documentReadyState?: string;
    userAgent?: string;
  } {
    try {
      return {
        isServer: this.isServer(),
        isClient: this.isClient(),
        isBrowser: this.isBrowser(),
        isHydrating: this.isHydrating(),
        isHydrated: this._isHydrated,
        canUseCache: this.canUseCache(),
        isEnvironmentStable: this.isEnvironmentStable(),
        documentReadyState: typeof document !== 'undefined' ? document.readyState : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      };
    } catch (error) {
      console.warn('Failed to get environment info:', error);
      return {
        isServer: true, // Safe default
        isClient: false,
        isBrowser: false,
        isHydrating: false,
        isHydrated: false,
        canUseCache: false,
        isEnvironmentStable: false
      };
    }
  }

  /**
   * Get current hydration state (useful for testing)
   */
  getHydrationState(): { isHydrated: boolean; hydrationStarted: boolean } {
    return {
      isHydrated: this._isHydrated,
      hydrationStarted: this._hydrationStarted
    };
  }
}

// Singleton instance
let environmentDetectorInstance: EnvironmentDetectorImpl | null = null;

/**
 * Get the singleton environment detector instance
 */
export function getEnvironmentDetector(): EnvironmentDetector {
  if (!environmentDetectorInstance) {
    environmentDetectorInstance = new EnvironmentDetectorImpl();
  }
  return environmentDetectorInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetEnvironmentDetector(): void {
  environmentDetectorInstance = null;
}

/**
 * Utility functions for quick access
 */
export const isServer = () => getEnvironmentDetector().isServer();
export const isClient = () => getEnvironmentDetector().isClient();
export const isBrowser = () => getEnvironmentDetector().isBrowser();
export const isHydrating = () => getEnvironmentDetector().isHydrating();
export const canUseCache = () => getEnvironmentDetector().canUseCache();



export default getEnvironmentDetector;