"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef<
  HTMLDivElement,
  {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
  }
>(({ value, onValueChange, children, ...props }, ref) => {
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")

  React.useEffect(() => {
    setSelectedValue(value || "")
  }, [value])

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative" {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            open,
            setOpen,
            selectedValue,
            onValueChange: handleValueChange,
          })
        }
        return child
      })}
    </div>
  )
})
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    open?: boolean
    setOpen?: (open: boolean) => void
    selectedValue?: string
    onValueChange?: (value: string) => void
  }
>(({ className, children, open, setOpen, selectedValue, onValueChange, ...domProps }, ref) => {
  // open, setOpen, selectedValue y onValueChange ya están extraídas y no se pasarán al DOM
  
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setOpen?.(!open)}
      {...domProps}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    placeholder?: string
    selectedValue?: string
  }
>(({ className, placeholder, selectedValue, ...domProps }, ref) => {
  // selectedValue ya está extraída y no se pasará al DOM
  
  return (
    <span ref={ref} className={cn("block truncate", className)} {...domProps}>
      {selectedValue || placeholder}
    </span>
  )
})
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    setOpen?: (open: boolean) => void
    onValueChange?: (value: string) => void
    selectedValue?: string
  }
>(({ className, children, open, setOpen, onValueChange, selectedValue, ...domProps }, ref) => {
  if (!open) return null

  // open, setOpen, onValueChange y selectedValue ya están extraídas y no se pasarán al DOM

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen?.(false)}
      />
      <div
        ref={ref}
        className={cn(
          "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          "top-full mt-1 w-full",
          className
        )}
        {...domProps}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onValueChange,
              setOpen,
            })
          }
          return child
        })}
      </div>
    </>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    onValueChange?: (value: string) => void
    setOpen?: (open: boolean) => void
  }
>(({ className, children, value, onValueChange, setOpen, ...domProps }, ref) => {
  // value, onValueChange y setOpen ya están extraídas y no se pasarán al DOM
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={() => {
        onValueChange?.(value)
        setOpen?.(false)
      }}
      {...domProps}
    >
      {children}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }