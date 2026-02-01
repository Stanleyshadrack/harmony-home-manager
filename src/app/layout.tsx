import type { Metadata } from "next";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Property Governance Platform</title>
        <meta
          name="description"
          content="Connect and manage your extended family with FamLink - a comprehensive platform for family trees, events, contributions, and heritage preservation."
        />
        <meta name="author" content="FamLink" />

        <meta
          property="og:title"
          content="FamLink - Extended Family Governance Platform"
        />
        <meta
          property="og:description"
          content="Connect and manage your extended family with comprehensive tools for family trees, events, and governance."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://lovable.dev/opengraph-image-p98pqg.png"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@lovable_dev" />
        <meta
          name="twitter:image"
          content="https://lovable.dev/opengraph-image-p98pqg.png"
        />
      </head>
     <html suppressHydrationWarning>
      <body>
        <div id="root">{children}</div>
      </body> 
      </html>
    </html>
  );
}
