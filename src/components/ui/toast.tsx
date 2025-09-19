// src/components/ui/toast.tsx - SISTEMA DE NOTIFICACIONES TOAST
// 🎯 PROPÓSITO: Mostrar notificaciones de errores y mensajes al usuario

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

import { ClientErrorState, formatErrorMessage, shouldShowErrorToUser } from '@/lib/errors/client-errors'

// Tipos para el sistema de toast
export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  showError: (_error: ClientErrorState | string, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Provider del contexto de toast
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastMessage = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove después de la duración especificada
    const duration = toast.duration ?? (toast.type === 'error' ? 7000 : 5000)
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])
  
  const showError = useCallback((__error: ClientErrorState | string, duration?: number) => {
    const message = typeof _error === 'string' 
      ? error 
      : formatErrorMessage(error)
    
    // Solo mostrar si es apropiado para el usuario
    if (typeof error !== 'string' && !shouldShowErrorToUser(error)) {
      return
    }
    
    addToast({
      message,
      type: 'error',
      duration
    })
  }, [addToast])
  
  const showSuccess = useCallback((message: string, duration?: number) => {
    addToast({
      message,
      type: 'success',
      duration
    })
  }, [addToast])
  
  const showWarning = useCallback((message: string, duration?: number) => {
    addToast({
      message,
      type: 'warning',
      duration
    })
  }, [addToast])
  
  const showInfo = useCallback((message: string, duration?: number) => {
    addToast({
      message,
      type: 'info',
      duration
    })
  }, [addToast])
  
  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      showError,
      showSuccess,
      showWarning,
      showInfo
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Hook para usar el sistema de toast
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Componente contenedor de toasts
function ToastContainer() {
  const { toasts, removeToast } = useToast()
  
  if (toasts.length === 0) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Componente individual de toast
function Toast({ 
  toast, 
  onClose 
}: { 
  toast: ToastMessage
  onClose: () => void 
}) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])
  
  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Esperar animación de salida
  }
  
  const getToastStyles = () => {
    const baseStyles = `
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      bg-white border rounded-lg shadow-lg p-4 min-w-0 max-w-sm
    `
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} border-green-200 bg-green-50`
      case 'error':
        return `${baseStyles} border-red-200 bg-red-50`
      case 'warning':
        return `${baseStyles} border-yellow-200 bg-yellow-50`
      case 'info':
        return `${baseStyles} border-blue-200 bg-blue-50`
      default:
        return `${baseStyles} border-gray-200`
    }
  }
  
  const getIconStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }
  
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return '•'
    }
  }
  
  return (
    <div className={getToastStyles()}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 text-lg ${getIconStyles()}`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 break-words">
            {toast.message}
          </p>
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Hook para integrar automáticamente errores con toast
export function useErrorToast() {
  const { showError, showSuccess, showWarning, showInfo } = useToast()
  
  useEffect(() => {
    // Suscribirse a errores globales del ClientErrorHandler
    const { ClientErrorHandler } = require('@/lib/errors/client-errors')
    
    const unsubscribe = ClientErrorHandler.subscribe((__error: ClientErrorState) => {
      if (shouldShowErrorToUser(error)) {
        showError(error)
      }
    })
    
    return unsubscribe
  }, [showError])
  
  return {
    showError,
    showSuccess,
    showWarning,
    showInfo
  }
}