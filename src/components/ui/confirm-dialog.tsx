'use client'

import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false)

  const loading = isLoading || internalLoading

  const handleConfirm = async () => {
    setInternalLoading(true)
    try {
      await onConfirm()
    } finally {
      setInternalLoading(false)
    }
  }

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: <Trash2 className="h-6 w-6 text-red-500" />,
      iconBg: 'bg-red-100',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
      iconBg: 'bg-yellow-100',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    default: {
      icon: <AlertTriangle className="h-6 w-6 text-blue-500" />,
      iconBg: 'bg-blue-100',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${styles.iconBg}`}>
            {styles.icon}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="min-w-[100px]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={`min-w-[100px] ${styles.buttonClass}`}
          >
            {loading ? 'Procesando...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook para manejar el estado del diálogo de confirmación
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'default'
    onConfirm: () => void | Promise<void>
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })

  const openDialog = (options: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'default'
    onConfirm: () => void | Promise<void>
  }) => {
    setDialogState({
      isOpen: true,
      ...options,
    })
  }

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }))
  }

  return {
    dialogState,
    openDialog,
    closeDialog,
  }
}
