/**
 * 🧪 TESTS BÁSICOS PARA useAPI
 * 
 * ✅ PROPÓSITO: Verificar que el hook base funciona correctamente
 */

import { renderHook, act } from '@testing-library/react'

import { useAPI } from '../useAPI'

// Mock fetch
global.fetch = jest.fn()

describe('useAPI Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useAPI({ url: '/test' })
    )

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle successful API call', async () => {
    const mockData = { id: 1, name: 'Test' }
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
      headers: new Map([['content-type', 'application/json']])
    })

    const { result } = renderHook(() => 
      useAPI({ url: '/test' })
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Resource not found' })
    })

    const { result } = renderHook(() => 
      useAPI({ url: '/test' })
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.status).toBe(404)
  })

  it('should use cache for GET requests', async () => {
    const mockData = { id: 1, name: 'Test' }
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
      headers: new Map([['content-type', 'application/json']])
    })

    const { result } = renderHook(() => 
      useAPI({ 
        url: '/test', 
        cacheKey: 'test-cache',
        cacheTTL: 5000
      })
    )

    // Primera llamada
    await act(async () => {
      await result.current.execute()
    })

    // Segunda llamada debería usar cache
    await act(async () => {
      await result.current.execute()
    })

    // Fetch solo debería haberse llamado una vez
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(mockData)
  })
})