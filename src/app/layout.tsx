import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Property Governance Platform',
  description: 'Manage properties, units, tenants, bills, staff and maintenance securely.',
};

// Explicit phone viewport prevents desktop-width scaling on mobile browsers.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><div id="root">{children}</div></body>
    </html>
  );
}
