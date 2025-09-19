/**
 * Client-Side Environment Hooks
 * 
 * React hooks for environment detection that must run on client side.
 * These hooks use "use client" directive and should only be used in client components.
 */

"use client";

import { useState, useEffect } from 'react';

import { getEnvironmentDetector } from './environment-detector';

/**
 * Hook for React components to track hydration state
 * This must be used in client components only
 */
export function useHydrationState() {
  const [hydrationState, setHydrationState] = useState(() => {
    // For SSR safety, always start with not hydrated
    if (typeof window === 'undefined') {
      return {
        isHydrated: false,
        isHydrating: false,
        canUseCache: false,
      };
    }

    const detector = getEnvironmentDetector();
    
    return {
      isHydrated: !detector.isHydrating(),
      isHydrating: detector.isHydrating(),
      canUseCache: detector.canUseCache(),
    };
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    const detector = getEnvironmentDetector();
    
    const updateState = () => {
      const newState = {
        isHydrated: !detector.isHydrating(),
        isHydrating: detector.isHydrating(),
        canUseCache: detector.canUseCache(),
      };
      
      setHydrationState(prevState => {
        // Only update if state actually changed
        if (
          prevState.isHydrated !== newState.isHydrated ||
          prevState.isHydrating !== newState.isHydrating ||
          prevState.canUseCache !== newState.canUseCache
        ) {
          return newState;
        }
        return prevState;
      });
    };

    // Listen for hydration complete event
    const handleHydrationComplete = () => {
      updateState();
    };

    window.addEventListener('hydration-complete', handleHydrationComplete);
    
    // Check once immediately in case hydration is already complete
    updateState();

    return () => {
      window.removeEventListener('hydration-complete', handleHydrationComplete);
    };
  }, []);

  return hydrationState;
}

/**
 * Hook to get environment information for debugging
 */
export function useEnvironmentInfo() {
  const [envInfo, setEnvInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isServer: true,
        isClient: false,
        isBrowser: false,
        isHydrating: false,
        isHydrated: false,
        canUseCache: false,
        isEnvironmentStable: false
      };
    }

    const detector = getEnvironmentDetector();
    return detector.getEnvironmentInfo();
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const detector = getEnvironmentDetector();
    
    const updateEnvInfo = () => {
      setEnvInfo(detector.getEnvironmentInfo());
    };

    // Update on hydration complete
    window.addEventListener('hydration-complete', updateEnvInfo);
    
    // Update immediately
    updateEnvInfo();

    return () => {
      window.removeEventListener('hydration-complete', updateEnvInfo);
    };
  }, []);

  return envInfo;
}