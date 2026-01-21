"use client"

import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, Search } from "lucide-react"
import * as React from "react"
import { useState, useMemo, useCallback, useRef, useEffect } from "react"

import { cn } from "@/lib/utils"

interface VirtualizedSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
  baseOptions?: { value: string; label: string }[]
  showSearch?: boolean
}

/**
 * Select con virtualización para listas largas
 * Muestra un máximo de items visibles y permite búsqueda
 */
export function VirtualizedSelect({
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar",
  className,
  baseOptions = [
    { value: "all", label: "Todos" },
    { value: "has", label: "Con valor" },
    { value: "empty", label: "Vacío (N/A)" }
  ],
  showSearch = true
}: VirtualizedSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Filtrar opciones basado en búsqueda
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const searchLower = search.toLowerCase()
    return options.filter(opt => opt.toLowerCase().includes(searchLower))
  }, [options, search])

  // Limitar a 100 items para rendimiento
  const visibleOptions = useMemo(() => {
    return filteredOptions.slice(0, 100)
  }, [filteredOptions])

  // Limpiar búsqueda al cerrar
  useEffect(() => {
    if (!open) {
      setSearch("")
    }
  }, [open])

  // Focus en input al abrir
  useEffect(() => {
    if (open && showSearch && inputRef.current) {
      // Pequeño delay para que el portal esté montado
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, showSearch])

  // Obtener label del valor actual
  const getDisplayValue = useCallback(() => {
    const baseOption = baseOptions.find(opt => opt.value === value)
    if (baseOption) return baseOption.label
    if (options.includes(value)) return value
    return placeholder
  }, [value, baseOptions, options, placeholder])

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {getDisplayValue()}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-slate-700 bg-[#131921] text-white shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
          position="popper"
          sideOffset={4}
        >
          {/* Campo de búsqueda */}
          {showSearch && options.length > 10 && (
            <div className="p-2 border-b border-slate-600">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-transparent border border-slate-600 rounded focus:outline-none focus:border-slate-500 text-white placeholder:text-slate-500"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <SelectPrimitive.Viewport className="p-1 max-h-[250px] overflow-y-auto w-full min-w-[var(--radix-select-trigger-width)]">
            {/* Opciones base */}
            {baseOptions.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-white hover:bg-slate-700"
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}

            {/* Separador */}
            {options.length > 0 && (
              <SelectPrimitive.Separator className="-mx-1 my-1 h-px bg-slate-600" />
            )}

            {/* Opciones dinámicas */}
            {visibleOptions.map((opt) => (
              <SelectPrimitive.Item
                key={opt}
                value={opt}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-white hover:bg-slate-700"
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{opt}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}

            {/* Indicador de más resultados */}
            {filteredOptions.length > 100 && (
              <div className="px-2 py-1.5 text-xs text-slate-400 text-center">
                +{filteredOptions.length - 100} más (usa la búsqueda)
              </div>
            )}

            {/* Sin resultados */}
            {search && visibleOptions.length === 0 && (
              <div className="px-2 py-4 text-sm text-slate-400 text-center">
                No se encontraron resultados
              </div>
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
