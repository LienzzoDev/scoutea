'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Component
 *
 * Captura errores en componentes hijos y muestra una UI de fallback
 * en lugar de romper toda la aplicación.
 *
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para mostrar la UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Registrar el error para debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Guardar info del error en el estado
    this.setState({ errorInfo });

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Enviar a servicio de logging (Sentry, LogRocket, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback por defecto
      return (
        <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 border border-[#e7e7e7]">
            {/* Header con icono */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#000000]">
                  Algo salió mal
                </h1>
                <p className="text-[#6d6d6d] mt-1">
                  Lo sentimos, ha ocurrido un error inesperado
                </p>
              </div>
            </div>

            {/* Mensaje de error (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-sm font-semibold text-red-800 mb-2">
                  Detalles del error (solo en desarrollo):
                </h2>
                <p className="text-sm text-red-700 font-mono mb-2">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-red-700 cursor-pointer hover:text-red-800">
                      Ver stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-48 p-2 bg-red-100 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Mensaje de ayuda */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                ¿Qué puedes hacer?
              </h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Intentar recargar la página</li>
                <li>Volver a la página de inicio</li>
                <li>Si el problema persiste, contacta con soporte</li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#8c1a10] text-white rounded-lg hover:bg-[#6d1410] transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                Ir a inicio
              </button>
            </div>

            {/* Footer con info adicional */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-[#6d6d6d] text-center">
                Si este error persiste, por favor contacta con soporte técnico
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
