import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lovable App",
  description: "Lovable Generated Project",
  authors: [{ name: "Lovable" }],

  openGraph: {
    title: "Lovable App",
    description: "Lovable Generated Project",
    type: "website",
    images: [
      {
        url: "https://lovable.dev/opengraph-image-p98pqg.png",
        width: 1200,
        height: 630,
        alt: "Lovable App",
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
      <body>{children}</body>
    </html>
  );
}
