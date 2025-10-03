import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export const useBreadcrumbNavigation = () => {
  const router = useRouter();

  const navigateToHome = useCallback(() => {
    router.push('/member/dashboard');
  }, [router]);

  const navigateToPlayers = useCallback(() => {
    // Intentar volver a la página anterior si es una página de jugadores
    // Si no, ir al dashboard por defecto
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      const currentOrigin = window.location.origin;
      
      // Si viene de una página interna de jugadores, volver ahí
      if (referrer.includes(currentOrigin) && 
          (referrer.includes('/member/dashboard') || 
           referrer.includes('/member/search') ||
           referrer.includes('/member/scouts'))) {
        router.back();
        return;
      }
    }
    
    // Por defecto, ir al dashboard
    router.push('/member/dashboard');
  }, [router]);

  const navigateBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/member/dashboard');
    }
  }, [router]);

  return {
    navigateToHome,
    navigateToPlayers,
    navigateBack,
  };
};