// src/components/error-boundary.tsx - ERROR BOUNDARIES PARA REACT
// 🎯 PROPÓSITO: Capturar errores de React y mostrar UI de fallback

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

import { ClientErrorHandler } from '@/lib/errors/client-errors'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (_error: Error, errorInfo: ErrorInfo) => void
  context?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
}

// Error Boundary principal
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(__error: Error, errorInfo: ErrorInfo) {
    // Log del error usando nuestro sistema
    const _clientError = ClientErrorHandler.handleError(
      error,
      this.props.context || 'ErrorBoundary',
      'error'
    )
    
    // Callback personalizado si se proporciona
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // Log adicional para desarrollo
    console.error('Error Boundary caught an __error: ', {
      _error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      __context: this.props.context
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, __error: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // UI de fallback por defecto
      return (
        <ErrorFallback _error ={this.state.error}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          context={this.props.context}
        />
      )
    }

    return this.props.children
  }
}

// Componente de fallback por defecto
interface ErrorFallbackProps {
  error?: Error
  errorId?: string
  onRetry?: () => void
  context?: string
}

function ErrorFallback({ error, errorId, onRetry, context }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Algo salió mal
        </h2>
        
        <p className="text-red-700 mb-4">
          Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
        </p>
        
        {isDevelopment && error && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
              Detalles del error (desarrollo)
            </summary>
            <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto">
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              {context && (
                <div className="mb-2">
                  <strong>Contexto:</strong> {context}
                </div>
              )}
              {errorId && (
                <div className="mb-2">
                  <strong>ID:</strong> {errorId}
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
        
        <div className="space-y-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          )}
          
          <button
            onClick={() =>window.location.reload()}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
            Recargar página
          </button>
        </div>
      </div>
    </div>
  )
}

// Error Boundary específico para páginas
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      context="Page"
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-lg w-full mx-4">
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
              <div className="text-gray-400 text-6xl mb-6">😵</div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Error en la página
              </h1>
              
              <p className="text-gray-600 mb-6">
                Ha ocurrido un error inesperado al cargar esta página. 
                Nuestro equipo ha sido notificado automáticamente.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() =>window.location.reload()}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Recargar página
                </button>
                
                <button
                  onClick={() =>window.history.back()}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Volver atrás
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// Error Boundary específico para componentes
export function ComponentErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: ReactNode
  componentName?: string 
}) {
  return (
    <ErrorBoundary
      context={componentName || 'Component'}
      fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-yellow-800 font-medium">
              Error en componente
            </span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Este componente no se pudo cargar correctamente.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// Hook para usar Error Boundary programáticamente
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)
  
  const resetError = React.useCallback(() => {
    setError(null)
  }, [])
  
  const captureError = React.useCallback((__error: Error) => {
    setError(error)
  }, [error])
  
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])
  
  return { captureError, resetError }
}

// HOC para envolver componentes con Error Boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}