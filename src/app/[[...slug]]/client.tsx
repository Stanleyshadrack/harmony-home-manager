'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const App = dynamic(() => import('../../App'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Loading…
    </div>
  ),
})

export function ClientOnly() {
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message?.includes('ChunkLoadError')) {
        console.warn('ChunkLoadError detected — reloading')
        window.location.reload()
      }
    }

    window.addEventListener('error', handler)

    return () => {
      window.removeEventListener('error', handler)
    }
  }, [])

  return <App />
}