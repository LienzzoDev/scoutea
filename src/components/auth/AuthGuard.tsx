/**
 * AuthGuard - Componente que espera a que Clerk esté listo
 */

"use client";

import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();

  // Mostrar loading mientras Clerk se inicializa
  if (!isLoaded) {
    return (
      fallback || (
        <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#6d6d6d]">Inicializando...</p>
          </div>
        </div>
      )
    );
  }

  // Si no está autenticado, mostrar mensaje
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6d6d6d] text-lg">No estás autenticado</p>
          <p className="text-sm text-gray-500 mt-2">Por favor, inicia sesión para continuar</p>
        </div>
      </div>
    );
  }

  // Renderizar contenido cuando todo está listo
  return <>{children}</>;
}