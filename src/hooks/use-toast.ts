// Hook simplificado para toast
export interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: Toast) => {
    // Por ahora, usar console.log para simular el toast
    // En una implementación real, esto se conectaría con el sistema de toast
    const prefix = variant === 'destructive' ? '❌' : '✅'
    console.log(`${prefix} ${title}${description ? `: ${description}` : ''}`)
    
    // También mostrar una alerta temporal para feedback visual
    if (typeof window !== 'undefined') {
      // Crear un elemento toast temporal
      const toastElement = document.createElement('div')
      toastElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm ${
        variant === 'destructive' ? 'bg-red-600' : 'bg-green-600'
      }`
      toastElement.innerHTML = `
        <div class="font-medium">${title}</div>
        ${description ? `<div class="text-sm opacity-90">${description}</div>` : ''}
      `
      
      document.body.appendChild(toastElement)
      
      // Remover después de 3 segundos
      setTimeout(() => {
        if (document.body.contains(toastElement)) {
          document.body.removeChild(toastElement)
        }
      }, 3000)
    }
  }

  return { toast }
}