export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: ToastAction
}

export function useToast() {
  return {
    toast: ({ title, description, variant, action }: ToastOptions) => {
      const event = new CustomEvent('toast', {
        detail: { title, description, variant: variant || 'default', action },
      })
      window.dispatchEvent(event)
    },
  }
}
