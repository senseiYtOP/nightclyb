import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NightDevs Hub - Developer Marketplace",
  description:
    "Buy and sell premium development tools, software, and digital products with secure licensing.",
  keywords: [
    "marketplace",
    "developers",
    "software",
    "tools",
    "licensing",
    "digital products",
  ],
  openGraph: {
    title: "NightDevs Hub - Developer Marketplace",
    description:
      "Buy and sell premium development tools with secure licensing",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
