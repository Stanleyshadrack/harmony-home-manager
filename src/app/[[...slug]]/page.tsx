import { ClientOnly } from "./client";

export const dynamicParams = false; // 🚨 REQUIRED in Next 16

export function generateStaticParams() {
  return [
    { slug: [] }, // root "/"
  ];
}

export default function Page() {
  return <ClientOnly />;
}
