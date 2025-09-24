// 🚀 COMPONENTE DE IMAGEN OPTIMIZADO
// 🎯 PROPÓSITO: Lazy loading, optimización automática y mejor performance
// 📊 IMPACTO: Carga más rápida de páginas con muchas imágenes

"use client";

import Image from "next/image";
import React, { memo, useState, useCallback, useMemo } from 'react';


interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  lazy?: boolean;
}

// 🚀 COMPONENTE OPTIMIZADO CON LAZY LOADING Y FALLBACKS
const OptimizedImage = memo<OptimizedImageProps>(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  fallbackSrc = '/default-avatar.svg',
  lazy: _lazy = true
}) {
  // 🔄 ESTADO PARA MANEJO DE ERRORES Y CARGA
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 HANDLERS MEMOIZADOS
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // 📊 MEMOIZAR PROPS DE IMAGEN
  const imageProps = useMemo(() => {
    const props: unknown = {
      alt,
      quality,
      onLoad: handleLoad,
      onError: handleError,
      className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
      style: {
        objectFit,
        objectPosition
      }
    };

    // 🎯 CONFIGURAR DIMENSIONES
    if (fill) {
      props.fill = true;
    } else if (width && height) {
      props.width = width;
      props.height = height;
    }

    // 🚀 CONFIGURAR OPTIMIZACIONES
    if (priority) {
      props.priority = true;
    }

    if (placeholder === 'blur' && blurDataURL) {
      props.placeholder = 'blur';
      props.blurDataURL = blurDataURL;
    }

    if (sizes) {
      props.sizes = sizes;
    }

    return props;
  }, [
    alt,
    quality,
    handleLoad,
    handleError,
    isLoading,
    className,
    objectFit,
    objectPosition,
    fill,
    width,
    height,
    priority,
    placeholder,
    blurDataURL,
    sizes
  ]);

  // 🛡️ GENERAR PLACEHOLDER BLUR AUTOMÁTICO
  const _generateBlurDataURL = useCallback((w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  }, []);

  // 🎨 PLACEHOLDER MIENTRAS CARGA
  const LoadingPlaceholder = useMemo(() => {
    if (!isLoading) return null;

    return (
      <div 
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          position: fill ? 'absolute' : 'relative',
          top: fill ? 0 : undefined,
          left: fill ? 0 : undefined,
          right: fill ? 0 : undefined,
          bottom: fill ? 0 : undefined
        }}
      />
    );
  }, [isLoading, className, fill, width, height]);

  // 🔄 RENDERIZAR IMAGEN CON FALLBACK
  if (imageError) {
    return (
      <Image
        {...imageProps}
        src={fallbackSrc}
        alt={`${alt} (fallback)`}
      />
    );
  }

  return (
    <>
      {LoadingPlaceholder}
      <Image
        {...imageProps}
        src={src}
       alt="" />
    </>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;

// 🎯 HOOK PARA LAZY LOADING AVANZADO
export function useLazyImage(src: string, options: { threshold?: number; rootMargin?: string } = {}) {
  const [isInView, setIsInView] = useState(false);
  const [imageRef, setImageRef] = useState<HTMLElement | null>(null);

  const { threshold = 0.1, rootMargin = '50px' } = options;

  React.useEffect(() => {
    if (!imageRef || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(imageRef);

    return () => observer.disconnect();
  }, [imageRef, isInView, threshold, rootMargin]);

  return {
    ref: setImageRef,
    shouldLoad: isInView,
    src: isInView ? src : undefined
  };
}

// 🎨 COMPONENTE DE AVATAR OPTIMIZADO
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackInitials?: string;
}

export const OptimizedAvatar = memo<OptimizedAvatarProps>(function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackInitials
}) {
  // 📏 TAMAÑOS PREDEFINIDOS
  const sizeClasses = useMemo(() => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl'
    };
    return sizes[size];
  }, [size]);

  const pixelSizes = useMemo(() => {
    const sizes = {
      xs: { width: 24, height: 24 },
      sm: { width: 32, height: 32 },
      md: { width: 40, height: 40 },
      lg: { width: 48, height: 48 },
      xl: { width: 64, height: 64 }
    };
    return sizes[size];
  }, [size]);

  // 🎨 FALLBACK CON INICIALES
  const InitialsFallback = useMemo(() => {
    if (!fallbackInitials) return null;

    return (
      <div className={`${sizeClasses} ${className} bg-gray-300 rounded-full flex items-center justify-center font-medium text-gray-700`}>
        {fallbackInitials}
      </div>
    );
  }, [sizeClasses, className, fallbackInitials]);

  if (!src) {
    return InitialsFallback;
  }

  return (
    <div className={`${sizeClasses} ${className} rounded-full overflow-hidden relative`}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={pixelSizes.width}
        height={pixelSizes.height}
        className="rounded-full"
        objectFit="cover"
        fallbackSrc="/default-avatar.svg"
      />
    </div>
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';