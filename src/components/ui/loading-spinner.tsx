import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

export function LoadingSpinner({ size = "md", text, className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-[#FF5733]`} />
      {text && (
        <span className="ml-2 text-slate-400">{text}</span>
      )}
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-[#080F17] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="p-8 text-center">
      <LoadingSpinner size="md" text="Cargando..." />
    </div>
  )
}

