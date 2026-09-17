'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToastAction } from '@/hooks/use-toast'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: ToastAction
  onClose: () => void
}

export function Toast({
  id,
  title,
  description,
  variant = 'default',
  action,
  onClose,
}: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 6000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-xl transition-all',
        {
          'border-gray-200 bg-white/95 text-gray-900 dark:border-gray-800 dark:bg-gray-900/95 dark:text-gray-100':
            variant === 'default',
          'border-red-500 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100':
            variant === 'destructive',
        }
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {title && <div className="text-sm font-semibold">{title}</div>}
            {description && (
              <div className="mt-1 text-xs opacity-90 leading-relaxed">
                {description}
              </div>
            )}

            {action && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    action.onClick()
                    onClose()
                  }}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#0079BF] hover:bg-[#026AA7] text-white shadow-xs transition-colors"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Dismiss notification"
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
    const handleToast = (
      event: CustomEvent<Omit<ToastProps, 'id' | 'onClose'>>
    ) => {
      const id = Math.random().toString(36).slice(2, 11)
      setToasts((prev) => [
        ...prev,
        { ...event.detail, id, onClose: () => removeToast(id) },
      ])
    }

    const removeToast = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    window.addEventListener('toast' as any, handleToast)
    return () => window.removeEventListener('toast' as any, handleToast)
  }, [])

  return (
    <div className="fixed top-4 right-4 z-60 flex max-h-screen w-full flex-col-reverse p-4 sm:flex-col md:max-w-[400px] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
