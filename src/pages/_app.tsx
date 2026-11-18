import dynamic from 'next/dynamic';

// This repository hosts a single client-side React Router application inside
// Next.js. The src/pages directory contains React Router screens, not standalone
// Next.js pages; Next must never prerender them outside their providers.
const BrowserApplication = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => <div className="flex min-h-screen items-center justify-center">Loading…</div>,
});

export default function LegacyPagesShell() {
  return <BrowserApplication />;
}
