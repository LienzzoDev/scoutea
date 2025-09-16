"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary";
  text?: string;
  className?: string;
}

function LoadingSpinner({
  size = "md",
  variant = "default",
  text,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const variantClasses = {
    default: "border-gray-300 border-t-gray-600",
    primary: "border-[#8c1a10]/20 border-t-[#8c1a10]",
    secondary: "border-blue-200 border-t-blue-600",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          border-2 rounded-full animate-spin
        `}
      />
      {text && (
        <span className={`mt-2 text-[#6d6d6d] ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  );
}

// Preset loading states for common use cases
export function PlayerLoadingSpinner({ text = "Cargando jugador..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner
        size="lg"
        variant="primary"
        text={text}
      />
    </div>
  );
}

export function TableLoadingSpinner({ text = "Cargando datos..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner
        size="md"
        variant="primary"
        text={text}
      />
    </div>
  );
}

export function ButtonLoadingSpinner() {
  return (
    <LoadingSpinner
      size="sm"
      variant="default"
      className="text-white"
    />
  );
}

export function LoadingPage({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner
        size="xl"
        variant="primary"
        text={text}
      />
    </div>
  );
}

export function LoadingCard({ text = "Cargando datos..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner
        size="lg"
        variant="primary"
        text={text}
      />
    </div>
  );
}

export { LoadingSpinner };
export default LoadingSpinner;