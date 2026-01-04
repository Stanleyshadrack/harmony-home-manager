import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My App',
  description: 'My App is a...',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
       
      

        <title>Property Management App</title>

        <meta name="description" content="Lovable Generated Project" />
        <meta name="author" content="Lovable" />

        <meta property="og:title" content="Lovable App" />
        <meta property="og:description" content="Lovable Generated Project" />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://lovable.dev/opengraph-image-p98pqg.png"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Lovable" />
        <meta
          name="twitter:image"
          content="https://lovable.dev/opengraph-image-p98pqg.png"
        />
      </head>

      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
