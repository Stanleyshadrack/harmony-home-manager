import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Property Governance Platform',
  description: 'Manage properties, units, tenants, bills, staff and maintenance securely.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><div id="root">{children}</div></body>
    </html>
  );
}
