'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

interface MobileNavTriggerProps {
  children: React.ReactNode
}

export function MobileNavTrigger({ children }: MobileNavTriggerProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col bg-card shadow-xl">
          <div className="flex items-center justify-end p-3 border-b border-border">
            <button
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Menü schließen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
