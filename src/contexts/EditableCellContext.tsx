"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface EditableCellContextType {
  activeCell: string | null;
  setActiveCell: (cellId: string | null) => void;
  requestEdit: (cellId: string) => boolean;
}

const EditableCellContext = createContext<EditableCellContextType | undefined>(undefined);

export function EditableCellProvider({ children }: { children: React.ReactNode }) {
  const [activeCell, setActiveCell] = useState<string | null>(null);

  const requestEdit = useCallback((cellId: string) => {
    // Si no hay celda activa, permitir edición
    if (!activeCell) {
      setActiveCell(cellId);
      return true;
    }

    // Si es la misma celda, permitir continuar editando
    if (activeCell === cellId) {
      return true;
    }

    // Si hay otra celda activa, no permitir edición
    return false;
  }, [activeCell]);

  return (
    <EditableCellContext.Provider value={{ activeCell, setActiveCell, requestEdit }}>
      {children}
    </EditableCellContext.Provider>
  );
}

export function useEditableCell() {
  const context = useContext(EditableCellContext);
  if (!context) {
    throw new Error('useEditableCell must be used within EditableCellProvider');
  }
  return context;
}
