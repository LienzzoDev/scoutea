// src/hooks/useErrorHandling.ts - HOOK INTEGRADO PARA MANEJO DE ERRORES
// 🎯 PROPÓSITO: Hook unificado que combina todos los sistemas de error

'use client'

import { useCallback } from 'react'

import { useToast } from '@/components/ui/toast'
import { useErrorHandler, fetchWithErrorHandling, ClientErrorState } from '@/lib/errors/client-errors'

// Hook principal para manejo de errores en componentes
export function useErrorHandling(context?: string) {
  const { handleError, handleAPIResponse, clearError } = useErrorHandler()
  const { showError, showSuccess, showWarning, showInfo } = useToast()
  
  // Función para hacer fetch con manejo automático de errores
  const fetchWithError = useCallback(async (
    url: string,
    options?: RequestInit,
    showToast: boolean = true
  ) => {
    try {
      const result = await fetchWithErrorHandling(url, options, context)
      return result
    } catch (error) {
      if (showToast && error instanceof Object && 'message' in error) {
        showError(error as ClientErrorState)
      }
      throw error
    }
  }, [context, showError])
  
  // Función para manejar errores con toast automático
  const handleErrorWithToast = useCallback((
    error: unknown,
    errorContext?: string,
    showToast: boolean = true
  ) => {
    const clientError = handleError(error, errorContext || context)
    
    if (showToast) {
      showError(clientError)
    }
    
    return clientError
  }, [handleError, showError, context])
  
  // Función para manejar respuestas de API con toast automático
  const handleAPIResponseWithToast = useCallback(async (
    response: Response,
    errorContext?: string,
    showToast: boolean = true
  ) => {
    try {
      return await handleAPIResponse(response, errorContext || context)
    } catch (error) {
      if (showToast && error instanceof Object && 'message' in error) {
        showError(error as ClientErrorState)
      }
      throw error
    }
  }, [handleAPIResponse, showError, context])
  
  // Función para limpiar errores específicos
  const clearErrorWithToast = useCallback((errorContext: string) => {
    clearError(errorContext)
  }, [clearError])
  
  // Funciones de conveniencia para diferentes tipos de mensajes
  const showSuccessMessage = useCallback((message: string, duration?: number) => {
    showSuccess(message, duration)
  }, [showSuccess])
  
  const showWarningMessage = useCallback((message: string, duration?: number) => {
    showWarning(message, duration)
  }, [showWarning])
  
  const showInfoMessage = useCallback((message: string, duration?: number) => {
    showInfo(message, duration)
  }, [showInfo])
  
  const showErrorMessage = useCallback((message: string, duration?: number) => {
    showError(message, duration)
  }, [showError])
  
  return {
    // Funciones principales de manejo de errores
    handleError: handleErrorWithToast,
    handleAPIResponse: handleAPIResponseWithToast,
    fetchWithError,
    clearError: clearErrorWithToast,
    
    // Funciones de mensajes
    showSuccess: showSuccessMessage,
    showWarning: showWarningMessage,
    showInfo: showInfoMessage,
    showError: showErrorMessage,
    
    // Funciones originales sin toast (para casos especiales)
    handleErrorSilent: handleError,
    handleAPIResponseSilent: handleAPIResponse
  }
}

// Hook específico para operaciones CRUD con manejo de errores
export function useCRUDErrorHandling(resourceName: string) {
  const errorHandling = useErrorHandling(`CRUD_${resourceName}`)
  
  const handleCreate = useCallback(async (
    createFn: () => Promise<any>,
    successMessage?: string
  ) => {
    try {
      const result = await createFn()
      errorHandling.showSuccess(
        successMessage || `${resourceName} creado exitosamente`
      )
      return result
    } catch (error) {
      errorHandling.handleError(error, `create_${resourceName}`)
      throw error
    }
  }, [errorHandling, resourceName])
  
  const handleUpdate = useCallback(async (
    updateFn: () => Promise<any>,
    successMessage?: string
  ) => {
    try {
      const result = await updateFn()
      errorHandling.showSuccess(
        successMessage || `${resourceName} actualizado exitosamente`
      )
      return result
    } catch (error) {
      errorHandling.handleError(error, `update_${resourceName}`)
      throw error
    }
  }, [errorHandling, resourceName])
  
  const handleDelete = useCallback(async (
    deleteFn: () => Promise<any>,
    successMessage?: string
  ) => {
    try {
      const result = await deleteFn()
      errorHandling.showSuccess(
        successMessage || `${resourceName} eliminado exitosamente`
      )
      return result
    } catch (error) {
      errorHandling.handleError(error, `delete_${resourceName}`)
      throw error
    }
  }, [errorHandling, resourceName])
  
  const handleRead = useCallback(async (
    readFn: () => Promise<any>
  ) => {
    try {
      return await readFn()
    } catch (error) {
      errorHandling.handleError(error, `read_${resourceName}`)
      throw error
    }
  }, [errorHandling, resourceName])
  
  return {
    ...errorHandling,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleRead
  }
}

// Hook para manejo de errores en formularios
export function useFormErrorHandling(formName: string) {
  const errorHandling = useErrorHandling(`form_${formName}`)
  
  const handleSubmit = useCallback(async (
    submitFn: () => Promise<any>,
    successMessage?: string
  ) => {
    try {
      const result = await submitFn()
      errorHandling.showSuccess(
        successMessage || 'Formulario enviado exitosamente'
      )
      return result
    } catch (error) {
      errorHandling.handleError(error, `submit_${formName}`)
      throw error
    }
  }, [errorHandling, formName])
  
  const handleValidation = useCallback((
    validationFn: () => boolean | string,
    fieldName?: string
  ) => {
    try {
      const result = validationFn()
      
      if (typeof result === 'string') {
        // Error de validación
        errorHandling.showWarning(result)
        return false
      }
      
      return result
    } catch (error) {
      errorHandling.handleError(
        error, 
        fieldName ? `validation_${formName}_${fieldName}` : `validation_${formName}`
      )
      return false
    }
  }, [errorHandling, formName])
  
  return {
    ...errorHandling,
    handleSubmit,
    handleValidation
  }
}

// Hook para manejo de errores en operaciones asíncronas
export function useAsyncErrorHandling(operationName: string) {
  const errorHandling = useErrorHandling(`async_${operationName}`)
  
  const executeWithErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      showLoading?: boolean
    }
  ): Promise<T> => {
    try {
      const result = await asyncFn()
      
      if (options?.successMessage) {
        errorHandling.showSuccess(options.successMessage)
      }
      
      return result
    } catch (error) {
      if (options?.errorMessage) {
        errorHandling.showError(options.errorMessage)
      } else {
        errorHandling.handleError(error, operationName)
      }
      throw error
    }
  }, [errorHandling, operationName])
  
  return {
    ...errorHandling,
    execute: executeWithErrorHandling
  }
}