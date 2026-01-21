"use client";

import { Edit2, Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { useEditableCell } from "@/contexts/EditableCellContext";

interface EditableCellProps {
  value: string | number | boolean | Date | null;
  playerId: number | string;
  fieldName: string;
  onSave: (playerId: number | string, fieldName: string, value: string | number | boolean) => Promise<boolean>;
  type?: 'text' | 'number' | 'boolean' | 'url' | 'date';
  isBold?: boolean;
}

export default function EditableCell({
  value,
  playerId,
  fieldName,
  onSave,
  type = 'text',
  isBold = false
}: EditableCellProps) {
  const { setActiveCell, requestEdit } = useEditableCell();
  const cellId = `${playerId}-${fieldName}`;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(() => {
    if (type === 'date' && value) {
      // Si es Date o string ISO, convertir a formato YYYY-MM-DD para input type="date"
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      } else if (typeof value === 'string') {
        // Convertir string ISO a formato YYYY-MM-DD
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    return value?.toString() || '';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar editValue cuando el value prop cambia externamente
  useEffect(() => {
    if (!isEditing) {
      if (type === 'date' && value) {
        if (value instanceof Date) {
          setEditValue(value.toISOString().split('T')[0]);
        } else if (typeof value === 'string') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            setEditValue(date.toISOString().split('T')[0]);
          } else {
            setEditValue('');
          }
        }
      } else {
        setEditValue(value?.toString() || '');
      }
    }
  }, [value, type, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== 'date') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleEdit = () => {
    // Solicitar permiso para editar esta celda
    if (!requestEdit(cellId)) {
      // Si hay otra celda activa, no permitir editar
      return;
    }

    if (type === 'date' && value) {
      if (value instanceof Date) {
        setEditValue(value.toISOString().split('T')[0]);
      } else if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setEditValue(date.toISOString().split('T')[0]);
        } else {
          setEditValue('');
        }
      }
    } else {
      setEditValue(value?.toString() || '');
    }
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value?.toString() || '');
    setError(null);
    setActiveCell(null); // Liberar la celda activa
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      let finalValue: string | number | boolean | null = editValue ?? '';

      // Conversión de tipo según el campo
      if (type === 'number') {
        // Permitir valores vacíos (null) o convertir a número
        if (editValue === '' || editValue === null || editValue === undefined) {
          finalValue = null;
        } else {
          const parsed = parseFloat(editValue);
          finalValue = isNaN(parsed) ? 0 : parsed;
        }
      } else if (type === 'boolean') {
        // Manejar valores booleanos
        if (typeof editValue === 'boolean') {
          finalValue = editValue;
        } else {
          const strValue = String(editValue).toLowerCase();
          finalValue = strValue === 'true' || strValue === '1' || strValue === 'yes' || strValue === 'si' || strValue === 'sí';
        }
      } else if (type === 'date') {
        // Para fechas, enviamos el string en formato ISO (YYYY-MM-DD)
        finalValue = editValue || null;
      }

      const success = await onSave(playerId, fieldName, finalValue as string | number | boolean);

      if (success) {
        setIsEditing(false);
        setActiveCell(null); // Liberar la celda activa
      } else {
        setError('Error al guardar');
      }
    } catch (err) {
      setError('Error al guardar');
      console.error('Error saving:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDisplayValue = () => {
    if (value === null || value === undefined) return 'N/A';

    if (type === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (type === 'url' && value) {
      return 'Link';
    }

    if (type === 'date' && value) {
      // Mostrar solo fecha sin hora en formato DD/MM/YYYY
      if (value instanceof Date) {
        return value.toLocaleDateString('es-ES');
      } else if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES');
        }
      }
    }

    // Formatear ELO
    if (fieldName.includes('elo')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return num.toFixed(2);
      }
    }

    return value.toString();
  };

  if (isEditing) {
    // Para campos booleanos, mostrar checkbox
    if (type === 'boolean') {
      return (
        <div className="flex flex-col gap-1 w-full items-center">
          <input
            ref={inputRef}
            type="checkbox"
            checked={editValue === 'true' || editValue === true}
            onChange={(e) => setEditValue(e.target.checked ? 'true' : 'false')}
            disabled={isSaving}
            className="w-4 h-4 bg-slate-800 border border-[#FF5733] rounded focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
          />
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 hover:bg-green-600/20 rounded transition-colors disabled:opacity-50 flex-shrink-0"
              title="Guardar"
            >
              <Check className="h-3 w-3 text-green-500" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1 hover:bg-red-600/20 rounded transition-colors disabled:opacity-50 flex-shrink-0"
              title="Cancelar"
            >
              <X className="h-3 w-3 text-red-500" />
            </button>
          </div>
        </div>
      );
    }

    // Para otros tipos, input normal
    return (
      <div className="flex flex-col gap-1 w-full">
        <input
          ref={inputRef}
          type={type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full px-2 py-1 text-xs bg-slate-800 border border-[#FF5733] rounded text-white focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
        />
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 hover:bg-green-600/20 rounded transition-colors disabled:opacity-50 flex-shrink-0"
            title="Guardar"
          >
            <Check className="h-3 w-3 text-green-500" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 hover:bg-red-600/20 rounded transition-colors disabled:opacity-50 flex-shrink-0"
            title="Cancelar"
          >
            <X className="h-3 w-3 text-red-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 px-2 py-1 rounded transition-colors"
      onClick={handleEdit}
    >
      <span className={`text-sm text-white whitespace-nowrap flex-1 ${isBold ? 'font-semibold' : ''}`}>
        {formatDisplayValue()}
      </span>
      <Edit2 className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  );
}
