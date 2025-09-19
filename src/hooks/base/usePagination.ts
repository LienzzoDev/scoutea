'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  offset: number
}

export interface PaginationOptions {
  initialPage?: number
  initialLimit?: number
  maxLimit?: number
  minLimit?: number
}

export interface UsePaginationReturn {
  // Estado actual
  pagination: PaginationState
  
  // Acciones
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setTotal: (total: number) => void
  nextPage: () => void
  prevPage: () => void
  firstPage: () => void
  lastPage: () => void
  
  // Utilidades
  getPageNumbers: (maxVisible?: number) => number[]
  getPageInfo: () => string
  canGoToPage: (page: number) => boolean
  reset: () => void
  
  // Para URLs
  getQueryParams: () => URLSearchParams
  setFromQueryParams: (params: URLSearchParams) => void
}

/**
 * 🚀 HOOK DE PAGINACIÓN REUTILIZABLE
 * 
 * ✅ PROPÓSITO: Lógica de paginación consistente para toda la aplicación
 * ✅ BENEFICIOS:
 *   - Estado de paginación completo
 *   - Navegación intuitiva
 *   - Validación automática
 *   - Integración con URLs
 *   - Cálculos automáticos
 *   - Información de estado
 */
export function usePagination(options: PaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialLimit = 20,
    maxLimit = 100,
    minLimit = 1
  } = options

  const [page, setPageState] = useState(initialPage)
  const [limit, setLimitState] = useState(initialLimit)
  const [total, setTotalState] = useState(0)

  /**
   * 📊 ESTADO CALCULADO DE PAGINACIÓN
   */
  const pagination = useMemo((): PaginationState => {
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const currentPage = Math.max(1, Math.min(page, totalPages))
    const offset = (currentPage - 1) * limit
    
    return {
      page: currentPage,
      limit,
      total,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      offset
    }
  }, [page, limit, total])

  /**
   * 📄 CAMBIAR PÁGINA
   */
  const setPage = useCallback((newPage: number): void => {
    const validPage = Math.max(1, Math.min(newPage, pagination.totalPages))
    setPageState(validPage)
  }, [pagination.totalPages])

  /**
   * 📏 CAMBIAR LÍMITE
   */
  const setLimit = useCallback((newLimit: number): void => {
    const validLimit = Math.max(minLimit, Math.min(newLimit, maxLimit))
    
    // Calcular nueva página para mantener aproximadamente los mismos elementos visibles
    const currentOffset = (page - 1) * limit
    const newPage = Math.max(1, Math.floor(currentOffset / validLimit) + 1)
    
    setLimitState(validLimit)
    setPageState(newPage)
  }, [page, limit, maxLimit, minLimit])

  /**
   * 📊 ESTABLECER TOTAL
   */
  const setTotal = useCallback((newTotal: number): void => {
    const validTotal = Math.max(0, newTotal)
    setTotalState(validTotal)
    
    // Ajustar página si es necesaria
    if (validTotal > 0) {
      const maxPage = Math.ceil(validTotal / limit)
      if (page > maxPage) {
        setPageState(maxPage)
      }
    }
  }, [page, limit])

  /**
   * ➡️ PÁGINA SIGUIENTE
   */
  const nextPage = useCallback((): void => {
    if (pagination.hasNext) {
      setPage(pagination.page + 1)
    }
  }, [pagination.hasNext, pagination.page, setPage])

  /**
   * ⬅️ PÁGINA ANTERIOR
   */
  const prevPage = useCallback((): void => {
    if (pagination.hasPrev) {
      setPage(pagination.page - 1)
    }
  }, [pagination.hasPrev, pagination.page, setPage])

  /**
   * ⏮️ PRIMERA PÁGINA
   */
  const firstPage = useCallback((): void => {
    setPage(1)
  }, [setPage])

  /**
   * ⏭️ ÚLTIMA PÁGINA
   */
  const lastPage = useCallback((): void => {
    setPage(pagination.totalPages)
  }, [pagination.totalPages, setPage])

  /**
   * 🔢 OBTENER NÚMEROS DE PÁGINA PARA UI
   */
  const getPageNumbers = useCallback((maxVisible: number = 7): number[] => {
    const { page: currentPage, totalPages } = pagination
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    const end = Math.min(totalPages, start + maxVisible - 1)
    
    // Ajustar si estamos cerca del final
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [pagination])

  /**
   * ℹ️ OBTENER INFORMACIÓN DE PÁGINA
   */
  const getPageInfo = useCallback((): string => {
    const { page: currentPage, limit: pageLimit, total: totalItems } = pagination
    
    if (totalItems === 0) {
      return 'No hay elementos'
    }
    
    const start = (currentPage - 1) * pageLimit + 1
    const end = Math.min(currentPage * pageLimit, totalItems)
    
    return `Mostrando ${start}-${end} de ${totalItems} elementos`
  }, [pagination])

  /**
   * ✅ VERIFICAR SI SE PUEDE IR A UNA PÁGINA
   */
  const canGoToPage = useCallback((targetPage: number): boolean => {
    return targetPage >= 1 && targetPage <= pagination.totalPages
  }, [pagination.totalPages])

  /**
   * 🔄 RESETEAR PAGINACIÓN
   */
  const reset = useCallback((): void => {
    setPageState(initialPage)
    setLimitState(initialLimit)
    setTotalState(0)
  }, [initialPage, initialLimit])

  /**
   * 🔗 OBTENER PARÁMETROS DE QUERY
   */
  const getQueryParams = useCallback((): URLSearchParams => {
    const params = new URLSearchParams()
    params.set('page', pagination.page.toString())
    params.set('limit', pagination.limit.toString())
    return params
  }, [pagination.page, pagination.limit])

  /**
   * 🔗 ESTABLECER DESDE PARÁMETROS DE QUERY
   */
  const setFromQueryParams = useCallback((params: URLSearchParams): void => {
    const pageParam = params.get('page')
    const limitParam = params.get('limit')
    
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10)
      if (!isNaN(parsedPage) && parsedPage > 0) {
        setPageState(parsedPage)
      }
    }
    
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      if (!isNaN(parsedLimit) && parsedLimit >= minLimit && parsedLimit <= maxLimit) {
        setLimitState(parsedLimit)
      }
    }
  }, [maxLimit, minLimit])

  // Validar página cuando cambie el total
  useEffect(() => {
    if (total > 0 && page > pagination.totalPages) {
      setPageState(pagination.totalPages)
    }
  }, [total, page, pagination.totalPages])

  return {
    pagination,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    getPageNumbers,
    getPageInfo,
    canGoToPage,
    reset,
    getQueryParams,
    setFromQueryParams
  }
}

/**
 * 🚀 HOOK SIMPLIFICADO PARA CASOS BÁSICOS
 */
export function useSimplePagination(initialLimit: number = 20) {
  const {
    pagination,
    setPage,
    setTotal,
    nextPage,
    prevPage,
    getPageInfo
  } = usePagination({ initialLimit })

  return {
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    hasNext: pagination.hasNext,
    hasPrev: pagination.hasPrev,
    setPage,
    setTotal,
    nextPage,
    prevPage,
    pageInfo: getPageInfo()
  }
}

/**
 * 🔧 UTILIDADES DE PAGINACIÓN
 */
export const PaginationUtils = {
  /**
   * Calcular offset desde página y límite
   */
  calculateOffset: (page: number, limit: number): number => {
    return Math.max(0, (page - 1) * limit)
  },

  /**
   * Calcular página desde offset y límite
   */
  calculatePage: (offset: number, limit: number): number => {
    return Math.max(1, Math.floor(offset / limit) + 1)
  },

  /**
   * Calcular total de páginas
   */
  calculateTotalPages: (total: number, limit: number): number => {
    return Math.max(1, Math.ceil(total / limit))
  },

  /**
   * Validar parámetros de paginación
   */
  validateParams: (page: number, limit: number, maxLimit: number = 100): { page: number; limit: number } => {
    return {
      page: Math.max(1, Math.floor(page)),
      limit: Math.max(1, Math.min(Math.floor(limit), maxLimit))
    }
  },

  /**
   * Crear respuesta de paginación estándar
   */
  createPaginationResponse: <T>(
    items: T[],
    page: number,
    limit: number,
    total: number
  ): {
    items: T[]
    pagination: PaginationState
  } => {
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const currentPage = Math.max(1, Math.min(page, totalPages))
    
    return {
      items,
      _pagination: {
        page: currentPage,
        limit,
        total,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        offset: (currentPage - 1) * limit
      }
    }
  }
}