import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property Management App",
  description: "Manage properties, tenants, billing, and maintenance with ease",
  openGraph: {
    title: "Property Management App",
    description: "Lovable Generated Project",
    type: "website",
    images: [
      {
        url: "https://lovable.dev/opengraph-image-p98pqg.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@Lovable",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
