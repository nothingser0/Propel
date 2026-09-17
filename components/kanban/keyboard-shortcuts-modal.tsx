'use client'

import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: 'C', description: 'Create a new task' },
  { key: '?', description: 'Open this keyboard shortcuts cheat sheet' },
  { key: 'Esc', description: 'Close any open modal or side panel' },
  { key: 'Enter', description: 'Open selected task / submit form' },
]

export function KeyboardShortcutsModal({
  open,
  onClose,
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-[#0079BF]" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Close shortcuts dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs"
            >
              <span className="text-gray-600 dark:text-gray-300">
                {item.description}
              </span>
              <kbd className="px-2 py-0.5 font-mono text-[11px] font-bold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-2xs text-gray-800 dark:text-gray-200">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
