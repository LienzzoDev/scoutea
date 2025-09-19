import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [],
  },
  webpack: (config) => {
    // Configuración básica de webpack para evitar errores
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }
    
    return config
  },
  // Configuración para evitar problemas de caché
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Deshabilitar prerendering para páginas problemáticas
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

export default nextConfig
