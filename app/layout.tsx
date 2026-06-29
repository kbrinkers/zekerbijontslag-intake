import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZekerbijOntslag — Gratis intake",
  description:
    "Ontvang gratis juridische begeleiding bij ontslag of een vaststellingsovereenkomst.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
