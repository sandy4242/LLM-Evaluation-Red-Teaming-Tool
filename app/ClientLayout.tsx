'use client'

import { ThemeProvider } from '@/components/ui/ThemeProvider'
import Sidebar from '@/components/ui/Sidebar'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { Toaster } from 'sonner'
import { useTheme } from '@/components/ui/ThemeProvider'
import { useEffect, useState } from 'react'

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <Sidebar />

      <div className="md:pl-[240px] min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-30 glass border-b border-border px-6 md:px-8 h-14 flex items-center">
          <div className="md:hidden w-10" />
          <Breadcrumb />
        </header>

        <main className="max-w-6xl mx-auto px-6 md:px-8 py-8">
          {children}
        </main>
      </div>

      <Toaster
        theme={resolvedTheme}
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LayoutInner>{children}</LayoutInner>
    </ThemeProvider>
  )
}