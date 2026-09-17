'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  onClose: () => void
}

export function Toast({ id, title, description, variant = 'default', onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg',
        {
          'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950': variant === 'default',
          'border-red-500 bg-red-50 dark:border-red-900 dark:bg-red-950': variant === 'destructive',
        }
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            {title && (
              <div className="text-sm font-semibold">{title}</div>
            )}
            {description && (
              <div className="mt-1 text-sm opacity-90">{description}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 inline-flex rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  React.useEffect(() => {
    const handleToast = (event: CustomEvent<Omit<ToastProps, 'id' | 'onClose'>>) => {
      const id = Math.random().toString(36).slice(2, 11)
      setToasts((prev) => [...prev, { ...event.detail, id, onClose: () => removeToast(id) }])
    }

    const removeToast = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    window.addEventListener('toast' as any, handleToast)
    return () => window.removeEventListener('toast' as any, handleToast)
  }, [])

  return (
    <div className="fixed top-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
