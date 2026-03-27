'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'

interface MobileNavTriggerProps {
  children: React.ReactNode
}

export function MobileNavTrigger({ children }: MobileNavTriggerProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations('nav')

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
        aria-label={t('menuOpen')}
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
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col bg-card shadow-xl overflow-y-auto">
          {/* Close button overlaid on logo bar */}
          <div className="absolute top-4 right-3 z-10">
            <button
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted transition-colors"
              aria-label={t('menuClose')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  )
}
