import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./seo.css";
import Analytics from "./Analytics";
import { ClerkProvider } from '@clerk/nextjs';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"),
  title: "LifeBook — Meet yourself where you are",
  description: "A quieter way forward through Scripture, reflection, prayer, and growth.",
  applicationName: "LifeBook",
  keywords: ["Christian devotional", "Scripture reflection", "Christian prayer", "faith journey"],
  openGraph: {
    title: "LifeBook — Meet yourself where you are",
    description: "A quieter way forward through Scripture, reflection, prayer, and growth.",
    type: "website",
    images: [{ url: "/lifebookbanner.png", width: 1200, height: 420, alt: "LifeBook" }],
  },
  twitter: { card: "summary_large_image", images: ["/lifebookbanner.png"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LifeBook",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002",
    description: "A Christian devotional companion for Scripture, reflection, prayer, and community.",
    sameAs: [],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><ClerkProvider><Analytics /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />{children}</ClerkProvider></body>
    </html>
  );
}
