"use client";

import { Edit2, Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useEditableCell } from "@/contexts/EditableCellContext";

interface ColorPickerCellProps {
  value: string | null;
  playerId: string;
  onSave: (playerId: string, fieldName: string, value: string) => Promise<boolean>;
}

// Colores predefinidos para selección rápida
const PRESET_COLORS = [
  '#FF5733', // Rojo
  '#33FF57', // Verde
  '#3357FF', // Azul
  '#FF33F5', // Magenta
  '#F5FF33', // Amarillo
  '#33FFF5', // Cyan
  '#FF8C33', // Naranja
  '#8C33FF', // Púrpura
  '#33FF8C', // Verde claro
  '#FF3388', // Rosa
  '#888888', // Gris
  '#000000', // Negro
];

export default function ColorPickerCell({
  value,
  playerId,
  onSave,
}: ColorPickerCellProps) {
  const { activeCell, setActiveCell, requestEdit } = useEditableCell();
  const cellId = `${playerId}-player_color`;
  const [isEditing, setIsEditing] = useState(false);
  const [currentColor, setCurrentColor] = useState(value || '#888888'); // Estado del color guardado
  const [selectedColor, setSelectedColor] = useState(value || '#FF5733'); // Estado del color seleccionado
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Actualizar el color actual cuando cambie el prop value
  useEffect(() => {
    setCurrentColor(value || '#888888');
  }, [value]);

  const handleEdit = () => {
    // Solicitar permiso para editar esta celda
    if (!requestEdit(cellId)) {
      return;
    }
    setIsEditing(true);
    setSelectedColor(currentColor || '#FF5733');
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedColor(currentColor || '#FF5733');
    setError(null);
    setActiveCell(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const success = await onSave(playerId, 'player_color', selectedColor);

      if (success) {
        // Actualizar el color guardado inmediatamente
        setCurrentColor(selectedColor);
        setIsEditing(false);
        setActiveCell(null);
      } else {
        setError('Error al guardar');
      }
    } catch (err) {
      setError('Error al guardar');
      console.error('Error saving color:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isEditing) {
          handleCancel();
        }
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div ref={containerRef} className="flex flex-col gap-2 w-full p-2">
        {/* Selector de color personalizado */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            disabled={isSaving}
            className="w-12 h-12 rounded cursor-pointer border-2 border-[#FF5733]"
          />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Color personalizado</span>
            <span className="text-xs text-white font-mono">{selectedColor}</span>
          </div>
        </div>

        {/* Colores predefinidos */}
        <div className="grid grid-cols-6 gap-2 mt-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              disabled={isSaving}
              className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                selectedColor === color ? 'border-white' : 'border-slate-600'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-2 hover:bg-green-600/20 rounded transition-colors disabled:opacity-50 flex-shrink-0"
            title="Guardar"
          >
            <Check className="h-4 w-4 text-green-500" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-2 hover:bg-red-600/20 rounded transition-colors disabled:opacity-50 flex-shrink-0"
            title="Cancelar"
          >
            <X className="h-4 w-4 text-red-500" />
          </button>
        </div>

        {error && (
          <span className="text-xs text-red-400 text-center">{error}</span>
        )}
      </div>
    );
  }

  // Vista normal: círculo de color
  return (
    <div
      className="group flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-800/50 px-2 py-1 rounded transition-colors"
      onClick={handleEdit}
    >
      <div
        className="w-6 h-6 rounded-full border-2 border-slate-600 group-hover:border-[#FF5733] transition-colors"
        style={{ backgroundColor: currentColor || '#888888' }}
        title={currentColor || 'Sin color asignado'}
      />
      <Edit2 className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
