export function useToast() {
  return {
    toast: ({ title, description, variant }: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => {
      const event = new CustomEvent('toast', {
        detail: { title, description, variant: variant || 'default' },
      })
      window.dispatchEvent(event)
    },
  }
}
