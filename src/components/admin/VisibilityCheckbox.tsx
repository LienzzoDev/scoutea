"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { Checkbox } from "@/components/ui/checkbox";

interface VisibilityCheckboxProps {
  value: boolean | null | undefined;
  playerId: number;
  onSave: (playerId: number, fieldName: string, value: boolean) => Promise<boolean>;
}

export default function VisibilityCheckbox({
  value,
  playerId,
  onSave,
}: VisibilityCheckboxProps) {
  // Estado local para respuesta inmediata
  const [isVisible, setIsVisible] = useState(value !== false);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar con el prop cuando cambie
  useEffect(() => {
    setIsVisible(value !== false);
  }, [value]);

  const handleToggle = async (checked: boolean) => {
    // Actualizar estado local inmediatamente para feedback visual
    setIsVisible(checked);
    setIsSaving(true);

    try {
      const success = await onSave(playerId, 'is_visible', checked);

      if (!success) {
        // Revertir si falla
        setIsVisible(!checked);
        console.error('Error al guardar visibilidad');
      }
    } catch (error) {
      // Revertir si hay error
      setIsVisible(!checked);
      console.error('Error al guardar visibilidad:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={isVisible}
        onCheckedChange={(checked) => handleToggle(!!checked)}
        disabled={isSaving}
        className="h-5 w-5 border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 disabled:opacity-50"
      />
      {isSaving ? (
        <Loader2 className="h-4 w-4 ml-2 text-slate-400 animate-spin" />
      ) : isVisible ? (
        <Eye className="h-4 w-4 ml-2 text-emerald-500" />
      ) : (
        <EyeOff className="h-4 w-4 ml-2 text-slate-500" />
      )}
    </div>
  );
}
