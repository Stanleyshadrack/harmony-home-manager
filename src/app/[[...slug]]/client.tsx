'use client'

import dynamic from 'next/dynamic'

const App = dynamic(() => import("@/App"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Loading…
    </div>
  ),
})

export function ClientOnly() {
  return <App />
}
