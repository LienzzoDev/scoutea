import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { Scout } from '@/types/scout'

interface UseScoutProfileReturn {
  scout: Scout | null
  loading: boolean
  error: string | null
  isScoutInList: boolean
  listLoading: boolean
  isSaving: boolean
  handleToggleList: () => Promise<void>
  refetch: () => Promise<void>
}

export function useScoutProfile(scoutId: string): UseScoutProfileReturn {
  const [scout, setScout] = useState<Scout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScoutInList, setIsScoutInList] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Función para obtener los datos del scout
  const fetchScout = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching scout with ID:', scoutId)
      
      const response = await fetch(`/api/scouts/${scoutId}`)
      
      console.log('📡 API Response:', response.status, response.statusText)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Scout not found. ID "${scoutId}" does not exist in the database.`)
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Scout data received:', data.scout?.scout_name || data.scout?.name)
      setScout(data.scout)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      
      // Log detallado del error
      console.error('❌ Error fetching scout:', errorMessage)
      console.error('📋 Error details:', {
        scoutId,
        errorType: typeof err,
        errorConstructor: err?.constructor?.name,
        errorMessage,
        fullError: err
      })
      
      // Mostrar toast de error solo si no es un error de red
      if (!(err instanceof TypeError && err.message.includes('fetch'))) {
        toast({
          title: "Scout not found",
          description: `The scout with ID "${scoutId}" could not be found. Please check the URL or try a different scout.`,
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para verificar si el scout está en la lista
  const checkScoutInList = async () => {
    try {
      setListLoading(true)
      setListError(null)
      
      const response = await fetch(`/api/my-scouts/check/${scoutId}`)
      
      if (!response.ok) {
        // Si es error 401 (no autorizado) o 404 (usuario no encontrado), no es crítico
        if (response.status === 401 || response.status === 404) {
          console.log('ℹ️  User not authenticated or not found in database - skipping scout list check')
          setIsScoutInList(false)
          return
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setIsScoutInList(data.isInList)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setListError(errorMessage)
      console.log('ℹ️  Could not check scout list (user may not be authenticated):', errorMessage)
      // No mostrar error crítico, solo log
      setIsScoutInList(false)
    } finally {
      setListLoading(false)
    }
  }

  // Función para añadir/quitar scout de la lista
  const handleToggleList = async () => {
    if (!scout) return

    try {
      setIsSaving(true)
      
      const endpoint = isScoutInList 
        ? `/api/my-scouts/remove/${scoutId}`
        : `/api/my-scouts/add/${scoutId}`
      
      const response = await fetch(endpoint, {
        method: isScoutInList ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scoutId: scout.id_scout || scout.id
        })
      })

      if (!response.ok) {
        // Si es error de autenticación, mostrar mensaje específico
        if (response.status === 401 || response.status === 404) {
          toast({
            title: "Authentication required",
            description: "Please sign in to add scouts to your list",
            variant: "destructive",
          })
          return
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Actualizar el estado
      setIsScoutInList(!isScoutInList)
      
      // Mostrar toast de éxito
      toast({
        title: isScoutInList ? "Scout removed from list" : "Scout added to list",
        description: isScoutInList 
          ? `${scout.scout_name || scout.name} has been removed from your scout list`
          : `${scout.scout_name || scout.name} has been added to your scout list`,
        variant: "default",
      })

      console.log('✅ Scout list updated:', data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error toggling scout in list:', err)
      
      toast({
        title: "Error",
        description: `Failed to ${isScoutInList ? 'remove' : 'add'} scout: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Efectos
  useEffect(() => {
    if (scoutId) {
      fetchScout()
      checkScoutInList()
    }
  }, [scoutId])

  return {
    scout,
    loading,
    error: error || listError,
    isScoutInList,
    listLoading,
    isSaving,
    handleToggleList,
    refetch: fetchScout,
  }
}